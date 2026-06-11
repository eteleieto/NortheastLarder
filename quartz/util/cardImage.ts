function normalizeImageSrc(src: string): string {
  let fixedSrc = src
  if (fixedSrc.startsWith("./")) {
    fixedSrc = fixedSrc.substring(2)
  }
  if (!fixedSrc.startsWith("/")) {
    fixedSrc = "/" + fixedSrc
  }
  return fixedSrc
}

export function extractFirstImageFromAST(htmlAst: unknown): string | null {
  if (!htmlAst || typeof htmlAst !== "object" || !("children" in htmlAst)) return null

  function findImageInNode(node: unknown): string | null {
    if (!node || typeof node !== "object") return null

    const el = node as {
      type?: string
      tagName?: string
      properties?: Record<string, unknown>
      children?: unknown[]
    }

    if (el.type === "element" && el.tagName === "img") {
      const src = el.properties?.src
      if (typeof src === "string" && src) {
        return normalizeImageSrc(src)
      }
    }

    if (el.children) {
      for (const child of el.children) {
        const result = findImageInNode(child)
        if (result) return result
      }
    }

    return null
  }

  return findImageInNode(htmlAst)
}

export function extractFirstImageFromText(content: string): string | null {
  const markdownImageRegex = /!\[.*?\]\(([^)]+)\)/
  const markdownMatch = content.match(markdownImageRegex)
  if (markdownMatch) {
    return normalizeImageSrc(markdownMatch[1])
  }

  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i
  const htmlMatch = content.match(htmlImageRegex)
  if (htmlMatch) {
    return normalizeImageSrc(htmlMatch[1])
  }

  return null
}

export function getCardImage(source: {
  cardImage?: string
  htmlAst?: unknown
  text?: string
  content?: string
  description?: string
}): string | null {
  if (source.cardImage) return source.cardImage

  const fromAst = extractFirstImageFromAST(source.htmlAst)
  if (fromAst) return fromAst

  const rawContent = source.text ?? source.content ?? source.description ?? ""
  return extractFirstImageFromText(rawContent)
}
