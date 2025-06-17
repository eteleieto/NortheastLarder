import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
// @ts-ignore – rehype-stringify has no type definitions but is safe to import
import rehypeStringify from "rehype-stringify"

export interface MultiColumnOptions {
  // Future options can be added here
}

const defaultOptions: MultiColumnOptions = {}

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

  const lines = settingsBlock.split('\n').map(line => line.trim()).filter(line => line)
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = line.substring(0, colonIndex).trim().toLowerCase()
    const value = line.substring(colonIndex + 1).trim()
    
    // Handle different setting variations
    if (key.includes('number of columns') || key.includes('num of cols') || key.includes('col count')) {
      const num = parseInt(value)
      if (!isNaN(num)) settings.numberOfColumns = num
    } else if (key.includes('largest column')) {
      settings.largestColumn = value
    } else if (key.includes('column size') || key.includes('col size') || key.includes('column width') || key.includes('col width')) {
      // Handle array syntax [25%, 75%] or single values
      if (value.startsWith('[') && value.endsWith(']')) {
        settings.columnSize = value.slice(1, -1).split(',').map(s => s.trim())
      } else {
        settings.columnSize = value
      }
    } else if (key.includes('border')) {
      if (value.startsWith('[') && value.endsWith(']')) {
        settings.border = value.slice(1, -1).split(',').map(s => s.trim().toLowerCase() !== 'off')
      } else {
        settings.border = !['disabled', 'off', 'false'].includes(value.toLowerCase())
      }
    } else if (key.includes('shadow')) {
      settings.shadow = !['disabled', 'off', 'false'].includes(value.toLowerCase())
    } else if (key.includes('column spacing')) {
      if (value.startsWith('[') && value.endsWith(']')) {
        settings.columnSpacing = value.slice(1, -1).split(',').map(s => s.trim())
      } else {
        settings.columnSpacing = value
      }
    } else if (key.includes('alignment') || key.includes('text align')) {
      if (value.startsWith('[') && value.endsWith(']')) {
        settings.alignment = value.slice(1, -1).split(',').map(s => s.trim())
      } else {
        settings.alignment = value
      }
    } else if (key.includes('overflow') || key.includes('content overflow')) {
      if (value.startsWith('[') && value.endsWith(']')) {
        settings.overflow = value.slice(1, -1).split(',').map(s => s.trim())
      } else {
        settings.overflow = value
      }
    }
  }
  
  return settings
}

function isStartMarker(node: any): boolean {
  // Handle both paragraph and text nodes
  if (node.type === 'paragraph') {
    if (!node.children || node.children.length === 0) return false
    const firstChild = node.children[0]
    if (firstChild.type !== 'text') return false
    return firstChild.value.startsWith('--- start-multi-column:')
  }
  
  // Handle direct text nodes (in case markdown parsing differs)
  if (node.type === 'text') {
    return node.value.startsWith('--- start-multi-column:')
  }
  
  return false
}

function isColumnBreak(node: any): boolean {
  if (node.type !== 'paragraph') return false
  if (!node.children || node.children.length === 0) return false
  
  const firstChild = node.children[0]
  if (firstChild.type !== 'text') return false
  
  const text = firstChild.value.trim()
  return ['--- column-break ---', '--- end-column ---', '--- column-end ---', '--- break-column ---'].includes(text)
}

function isEndMarker(node: any): boolean {
  if (node.type !== 'paragraph') return false
  if (!node.children || node.children.length === 0) return false
  
  const firstChild = node.children[0]
  if (firstChild.type !== 'text') return false
  
  const text = firstChild.value.trim()
  return ['--- end-multi-column', '--- multi-column-end'].includes(text)
}

function isSettingsBlock(node: any): boolean {
  if (node.type !== 'code') return false
  return node.lang === 'column-settings'
}

function extractRegionId(startNode: any): string {
  let text: string
  
  if (startNode.type === 'paragraph' && startNode.children && startNode.children[0]) {
    text = startNode.children[0].value
  } else if (startNode.type === 'text') {
    text = startNode.value
  } else {
    return 'default'
  }
  
  const match = text.match(/--- start-multi-column:\s*(.+)/)
  return match ? match[1].trim() : 'default'
}

function collectColumns(children: any[], startIndex: number): { columns: any[][], endIndex: number, settings: ColumnSettings } {
  const columns: any[][] = [[]]
  let currentColumnIndex = 0
  let settings: ColumnSettings = { numberOfColumns: 2 }
  let i = startIndex

  // Check if the next node is a settings block
  if (i < children.length && isSettingsBlock(children[i])) {
    settings = parseColumnSettings(children[i].value)
    i++ // Skip the settings block
  }

  // Collect nodes until we hit the end marker
  while (i < children.length) {
    const node = children[i]
    
    if (isEndMarker(node)) {
      return { columns, endIndex: i, settings }
    }
    
    if (isColumnBreak(node)) {
      currentColumnIndex++
      columns[currentColumnIndex] = []
    } else {
      if (!columns[currentColumnIndex]) {
        columns[currentColumnIndex] = []
      }
      columns[currentColumnIndex].push(node)
    }
    
    i++
  }
  
  return { columns, endIndex: i - 1, settings }
}

function processMultiColumnRegions(src: string): string {
  // Regex to match multi-column regions
  const multiColumnRegex = /--- start-multi-column:\s*([^\n]+)\n(```column-settings\n([\s\S]*?)\n```)?\n?([\s\S]*?)--- end-multi-column/g
  
  return src.replace(multiColumnRegex, (match, id, settingsBlockFull, settingsContent, content) => {
    // Parse settings if they exist
    const settings = settingsContent ? parseColumnSettings(settingsContent) : { numberOfColumns: 2 }
    
    // Split content by column breaks
    const columnBreakRegex = /--- (?:column-break|end-column|column-end|break-column) ---/
    const columns = content.split(columnBreakRegex).map((col: string) => col.trim()).filter((col: string) => col.length > 0)
    
    // Generate HTML directly
    return generateMultiColumnHTML(id.trim(), settings, columns)
  })
}

// Convert raw Markdown string into HTML (synchronously)
function mdToHtml(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(md)
  )
}

function generateMultiColumnHTML(id: string, settings: ColumnSettings, columns: string[]): string {
  // Generate HTML for multi-column layout
  let html = `<div class="mcm-wrapper" data-columns="${settings.numberOfColumns}" data-id="${id}"`
  
  // Add custom properties for spacing if specified
  let style = ''
  if (settings.columnSpacing) {
    const spacing = Array.isArray(settings.columnSpacing) ? settings.columnSpacing[0] : settings.columnSpacing
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
  
  html += '>'
  
  // Create column HTML
  columns.forEach((columnContent: string, index: number) => {
    let columnClass = `mcm-col col-${index + 1}`
    let columnStyle = ''
    
    // Add alignment if specified
    if (settings.alignment) {
      const alignment = Array.isArray(settings.alignment) ? settings.alignment[index] : settings.alignment
      if (alignment) {
        columnStyle = `text-align: ${alignment.toLowerCase()};`
      }
    }
    
    const rendered = mdToHtml(columnContent)
    html += `<div class="${columnClass}"${columnStyle ? ` style="${columnStyle}"` : ''}>`
    html += rendered
    html += '</div>'
  })
  
  html += '</div>'
  
  return html
}

function createMultiColumnWrapper(id: string, settings: ColumnSettings, columns: any[][]): any {
  // Create column divs
  const columnDivs = columns.map((columnNodes, index) => ({
    type: 'element',
    tagName: 'div',
    properties: {
      className: [`mcm-col`, `col-${index + 1}`],
      ...(settings.alignment && Array.isArray(settings.alignment) && settings.alignment[index] 
        ? { style: `text-align: ${settings.alignment[index].toLowerCase()}` }
        : settings.alignment && typeof settings.alignment === 'string' && index === 0
        ? { style: `text-align: ${settings.alignment.toLowerCase()}` }
        : {})
    },
    children: columnNodes
  }))

  // Calculate CSS custom properties
  const cssProps: Record<string, string> = {
    '--mcm-cols': settings.numberOfColumns.toString()
  }

  if (settings.columnSpacing) {
    if (Array.isArray(settings.columnSpacing)) {
      cssProps['--mcm-gap'] = settings.columnSpacing[0]
    } else {
      cssProps['--mcm-gap'] = settings.columnSpacing
    }
  }

  // Create wrapper div
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['mcm-wrapper'],
      'data-columns': settings.numberOfColumns,
      'data-id': id,
      ...(settings.border === false ? { 'data-no-border': 'true' } : {}),
      ...(settings.shadow === false ? { 'data-no-shadow': 'true' } : {}),
      style: Object.entries(cssProps).map(([key, value]) => `${key}: ${value}`).join('; ')
    },
    children: columnDivs
  }
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
                border: 1px solid var(--lightgray);
                border-radius: 8px;
                padding: 1.5rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    }
  }
} 