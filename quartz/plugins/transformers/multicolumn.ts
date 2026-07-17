import { QuartzTransformerPlugin } from "../types"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
// @ts-ignore – rehype-stringify has no type definitions but is safe to import
import rehypeStringify from "rehype-stringify"

export interface MultiColumnOptions {
  // Future options can be added here
}

interface ColumnSettings {
  numberOfColumns: number
  largestColumn?: string
  columnSize?: string | string[]
  border?: boolean | boolean[]
  shadow?: boolean
  columnSpacing?: string | string[]
  alignment?: string | string[]
  overflow?: string | string[]
}

function parseColumnSettings(settingsBlock: string): ColumnSettings {
  const settings: ColumnSettings = {
    numberOfColumns: 2, // default
  }

  const lines = settingsBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)

  for (const line of lines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    const key = line.substring(0, colonIndex).trim().toLowerCase()
    const value = line.substring(colonIndex + 1).trim()

    // Handle different setting variations
    if (
      key.includes("number of columns") ||
      key.includes("num of cols") ||
      key.includes("col count")
    ) {
      const num = parseInt(value)
      if (!isNaN(num)) settings.numberOfColumns = num
    } else if (key.includes("largest column")) {
      settings.largestColumn = value
    } else if (
      key.includes("column size") ||
      key.includes("col size") ||
      key.includes("column width") ||
      key.includes("col width")
    ) {
      // Handle array syntax [25%, 75%] or single values
      if (value.startsWith("[") && value.endsWith("]")) {
        settings.columnSize = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
      } else {
        settings.columnSize = value
      }
    } else if (key.includes("border")) {
      if (value.startsWith("[") && value.endsWith("]")) {
        settings.border = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().toLowerCase() !== "off")
      } else {
        settings.border = !["disabled", "off", "false"].includes(value.toLowerCase())
      }
    } else if (key.includes("shadow")) {
      settings.shadow = !["disabled", "off", "false"].includes(value.toLowerCase())
    } else if (key.includes("column spacing")) {
      if (value.startsWith("[") && value.endsWith("]")) {
        settings.columnSpacing = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
      } else {
        settings.columnSpacing = value
      }
    } else if (key.includes("alignment") || key.includes("text align")) {
      if (value.startsWith("[") && value.endsWith("]")) {
        settings.alignment = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
      } else {
        settings.alignment = value
      }
    } else if (key.includes("overflow") || key.includes("content overflow")) {
      if (value.startsWith("[") && value.endsWith("]")) {
        settings.overflow = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
      } else {
        settings.overflow = value
      }
    }
  }

  return settings
}

function processMultiColumnRegions(src: string): string {
  // Regex to match multi-column regions
  const multiColumnRegex =
    /--- start-multi-column:\s*([^\n]+)\n(?:[ \t]*\n)*(```column-settings\n([\s\S]*?)\n```)?\n?([\s\S]*?)--- end-multi-column/g

  return src.replace(
    multiColumnRegex,
    (_match, id, _settingsBlockFull, settingsContent, content) => {
      // Parse settings if they exist
      const settings = settingsContent
        ? parseColumnSettings(settingsContent)
        : { numberOfColumns: 2 }

      // Split content by column breaks
      const columnBreakRegex = /--- (?:column-break|end-column|column-end|break-column) ---/
      const columns = content
        .split(columnBreakRegex)
        .map((col: string) => col.trim())
        .filter((col: string) => col.length > 0)

      // Generate HTML directly
      return generateMultiColumnHTML(id.trim(), settings, columns)
    },
  )
}

// Convert wikilinks to markdown links
function convertWikilinksToMarkdown(md: string): string {
  // Match wikilinks like [[Koji]], [[Koji#Section]], [[Koji|Display Text]], or [[Koji#Section|Display Text]]
  // This regex matches the same pattern as ObsidianFlavoredMarkdown
  const wikilinkRegex = /!?\[\[([^\[\]\|\#\\]+)?(#+[^\[\]\|\#\\]+)?(\\?\|[^\[\]\#]*)?\]\]/g
  return md.replace(wikilinkRegex, (match, rawFp, rawHeader, rawAlias) => {
    // Skip embeds (starting with !)
    if (match.startsWith("!")) {
      return match
    }

    const fp = (rawFp ?? "").trim()
    const anchor = (rawHeader ?? "").trim()
    const alias = rawAlias ? rawAlias.replace(/^\\?\|/, "").trim() : null

    // Build the link target (file path + anchor)
    const linkTarget = fp + anchor

    // Use alias if provided, otherwise use the file path
    const displayText = alias ?? fp

    return `[${displayText}](${linkTarget})`
  })
}

// Convert raw Markdown string into HTML (synchronously)
function mdToHtml(md: string): string {
  // Convert wikilinks to markdown links first
  const processedMd = convertWikilinksToMarkdown(md)

  return String(
    (unified() as any)
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(processedMd),
  )
}

function generateMultiColumnHTML(id: string, settings: ColumnSettings, columns: string[]): string {
  // Generate HTML for multi-column layout
  let html = `<div class="mcm-wrapper" data-columns="${settings.numberOfColumns}" data-id="${id}"`

  // Add custom properties for spacing if specified
  let style = ""
  if (settings.columnSpacing) {
    const spacing = Array.isArray(settings.columnSpacing)
      ? settings.columnSpacing[0]
      : settings.columnSpacing
    style += `--mcm-gap: ${spacing}; `
  }

  if (style) {
    html += ` style="${style.trim()}"`
  }

  // Add data attributes for border and shadow
  if (settings.border === false) {
    html += ' data-no-border="true"'
  }
  if (settings.shadow === false) {
    html += ' data-no-shadow="true"'
  }

  html += ">"

  // Create column HTML
  columns.forEach((columnContent: string, index: number) => {
    let columnClass = `mcm-col col-${index + 1}`
    let columnStyle = ""

    // Add alignment if specified
    if (settings.alignment) {
      const alignment = Array.isArray(settings.alignment)
        ? settings.alignment[index]
        : settings.alignment
      if (alignment) {
        columnStyle = `text-align: ${alignment.toLowerCase()};`
      }
    }

    const rendered = mdToHtml(columnContent)
    html += `<div class="${columnClass}"${columnStyle ? ` style="${columnStyle}"` : ""}>`
    html += rendered
    html += "</div>"
  })

  html += "</div>"

  return html
}

export const MultiColumnTransformer: QuartzTransformerPlugin<Partial<MultiColumnOptions>> = () => {
  return {
    name: "MultiColumnTransformer",
    textTransform(_ctx, src) {
      // Process multi-column regions in the raw markdown
      return processMultiColumnRegions(src)
    },
    markdownPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [
          {
            inline: true,
            content: `
              .mcm-wrapper {
                display: grid;
                grid-template-columns: repeat(var(--mcm-cols, 2), 1fr);
                gap: var(--mcm-gap, 2rem);
                margin: 1.5rem 0;
                /* Wrapper is simply a grid container now */
                padding: 0;
                border: none;
                background: transparent;
                box-shadow: none;
              }
              
              /* Each column renders as its own card */
              .mcm-col {
                background-color: var(--light);
                border: 1px solid var(--gray);
                border-radius: 4px;
                padding: 1.5rem;
                box-shadow: none;
                min-width: 0; /* Allow content to wrap properly */
                overflow-wrap: break-word;
              }
              
              /* Disable border or shadow based on data attributes for per-column cards */
              .mcm-wrapper[data-no-border="true"] .mcm-col {
                border: none;
              }
              
              .mcm-wrapper[data-no-shadow="true"] .mcm-col {
                box-shadow: none;
              }
              
              /* Typography tweaks remain */
              .mcm-col h1,
              .mcm-col h2,
              .mcm-col h3,
              .mcm-col h4,
              .mcm-col h5,
              .mcm-col h6 {
                margin-top: 0;
              }
              
              .mcm-col p:first-child {
                margin-top: 0;
              }
              
              .mcm-col p:last-child {
                margin-bottom: 0;
              }
              
              .mcm-col ul,
              .mcm-col ol {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
              }
              
              .mcm-col li {
                margin: 0.25rem 0;
              }
              
              /* Responsive design */
              @media all and (max-width: 1200px) {
                .mcm-wrapper[data-columns="3"] {
                  grid-template-columns: repeat(2, 1fr);
                }
                
                .mcm-wrapper[data-columns="4"] {
                  grid-template-columns: repeat(2, 1fr);
                }
              }
              
              @media all and (max-width: 800px) {
                .mcm-wrapper {
                  grid-template-columns: 1fr !important;
                  gap: 1rem;
                  padding: 1rem;
                }
              }
              
              /* Handle different column counts */
              .mcm-wrapper[data-columns="1"] {
                --mcm-cols: 1;
              }
              
              .mcm-wrapper[data-columns="2"] {
                --mcm-cols: 2;
              }
              
              .mcm-wrapper[data-columns="3"] {
                --mcm-cols: 3;
              }
              
              .mcm-wrapper[data-columns="4"] {
                --mcm-cols: 4;
              }
              
              .mcm-wrapper[data-columns="5"] {
                --mcm-cols: 5;
              }
              
              .mcm-wrapper[data-columns="6"] {
                --mcm-cols: 6;
              }
            `,
          },
        ],
      }
    },
  }
}
