import { Root as HTMLRoot, Element } from "hast"
import { toString } from "hast-util-to-string"
import { visit } from "unist-util-visit"

const loadingCardsRegex = /\s*Loading cards\.{0,3}\s*/gi

const headerLinePatterns = [
  /^background$/i,
  /^active explorations$/i,
  /^areas of (exploration|exp)/i,
  /^notes and observations$/i,
  /^recipe$/i,
  /^ingredients$/i,
  /^instructions$/i,
  /^equipment$/i,
  /^trials$/i,
  /^ideas$/i,
  /^dairy products$/i,
  /^notes$/i,
  /^detailed variables:/i,
  /^(possible )?ingredients:/i,
  /^loading cards\.{0,3}$/i,
]

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isHeaderLine(line: string, pageTitle?: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return true

  if (headerLinePatterns.some((pattern) => pattern.test(trimmed))) {
    return true
  }

  // Label-style section headers ending with a colon (e.g. "Possible Ingredients:")
  if (trimmed.endsWith(":") && trimmed.length < 80 && !trimmed.includes(".")) {
    const words = trimmed.replace(/:$/, "").split(/\s+/)
    if (words.length <= 5) {
      return true
    }
  }

  // Short title-like lines ending in "Project"
  if (/ project$/i.test(trimmed) && trimmed.length < 60) {
    return true
  }

  if (pageTitle) {
    const normalizedLine = normalizeForComparison(trimmed)
    const normalizedTitle = normalizeForComparison(pageTitle)
    if (normalizedLine === normalizedTitle) return true
    if (normalizedLine === `${normalizedTitle} project`) return true
  }

  // Short standalone lines without sentence punctuation are usually headings
  if (trimmed.length < 50 && !trimmed.includes(".") && !trimmed.includes("—")) {
    if (/^[A-Z][^.!?]*$/.test(trimmed)) {
      return true
    }
  }

  return false
}

function stripLeadingHeaderPhrases(text: string, pageTitle?: string): string {
  let result = text.trim()

  const leadingPatterns = [
    /^(Background|Active Explorations|Notes and Observations|Areas of Exploration)\s+/i,
    /^Loading cards\.{0,3}\s*/i,
  ]

  if (pageTitle) {
    const escaped = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    leadingPatterns.push(new RegExp(`^${escaped}\\s+Project\\s+`, "i"))
  }

  let changed = true
  while (changed) {
    changed = false
    for (const pattern of leadingPatterns) {
      const next = result.replace(pattern, "")
      if (next !== result) {
        result = next
        changed = true
      }
    }
  }

  return result.trim()
}

function cleanLine(line: string): string {
  let cleaned = line
    .replace(/\[\[.*?\]\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[.*?\]\([^)]+\)/g, "")
    .replace(loadingCardsRegex, " ")
    .replace(/\s+/g, " ")
    .trim()

  return cleaned
}

function isBodyLine(line: string): boolean {
  if (line.length < 40) return false
  if (/^Loading cards\.{0,3}$/i.test(line)) return false
  // Skip label-style lines even if long
  if (/^(possible )?ingredients:/i.test(line)) return false
  if (/^detailed variables:/i.test(line)) return false
  // Allow lines ending in colons when they contain substantial prose
  return true
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

/** Extract readable body text from HTML, skipping headings and card-list placeholders. */
export function extractBodyText(tree: HTMLRoot): string {
  const paragraphs: string[] = []

  visit(tree, "element", (node: Element) => {
    if (node.tagName === "p") {
      const text = toString(node).replace(/\s+/g, " ").trim()
      if (text && !/^Loading cards\.{0,3}$/i.test(text)) {
        paragraphs.push(text)
      }
    }
  })

  if (paragraphs.length > 0) {
    return paragraphs.join("\n")
  }

  const parts: string[] = []
  visit(tree, "element", (node: Element) => {
    if (/^h[1-6]$/.test(node.tagName)) return
    if (node.tagName === "li") {
      const text = toString(node).replace(/\s+/g, " ").trim()
      if (text && !/^Loading cards\.{0,3}$/i.test(text)) {
        parts.push(text)
      }
    }
  })

  return parts.join("\n")
}

/** Pick the first substantial prose snippet for card/list previews. */
export function cleanDescriptionText(
  content: string,
  pageTitle?: string,
  maxLength = 200,
): string {
  if (!content) return ""

  const stripped = stripLeadingHeaderPhrases(content, pageTitle)
  const lines = stripped.split("\n")

  const cleanedLines = lines
    .map(cleanLine)
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !/^Loading cards\.{0,3}$/i.test(line))
    .filter((line) => !isHeaderLine(line, pageTitle))
    .filter((line) => !/^\|+$/.test(line))
    .filter((line) => line !== "---")

  for (const line of cleanedLines) {
    if (isBodyLine(line)) {
      return truncate(line, maxLength)
    }
  }

  const joined = cleanedLines.join(" ").replace(loadingCardsRegex, " ").replace(/\s+/g, " ").trim()
  const finalText = stripLeadingHeaderPhrases(joined, pageTitle)

  if (!finalText || /^Loading cards\.{0,3}$/i.test(finalText)) return ""
  if (finalText.length > 20) {
    return truncate(finalText, maxLength)
  }

  return ""
}
