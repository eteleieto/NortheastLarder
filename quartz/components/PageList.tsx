import { FullSlug, isFolderPath, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { GlobalConfiguration } from "../cfg"
import { getCardImage } from "../util/cardImage"

export type SortFn = (f1: QuartzPluginData, f2: QuartzPluginData) => number

export function byDateAndAlphabetical(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

export function byDateAndAlphabeticalFolderFirst(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort folders first
    const f1IsFolder = isFolderPath(f1.slug ?? "")
    const f2IsFolder = isFolderPath(f2.slug ?? "")
    if (f1IsFolder && !f2IsFolder) return -1
    if (!f1IsFolder && f2IsFolder) return 1

    // If both are folders or both are files, sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

type Props = {
  limit?: number
  sort?: SortFn
} & QuartzComponentProps

export const PageList: QuartzComponent = ({ cfg, fileData, allFiles, limit, sort }: Props) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
  let list = allFiles.sort(sorter)
  if (limit) {
    list = list.slice(0, limit)
  }

  return (
    <ul class="section-ul">
      {list.map((page) => {
        const title = page.frontmatter?.title
        const tags = page.frontmatter?.tags ?? []

        return (
          <li class="section-li">
            <div class="section">
              <p class="meta">
                {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
              </p>
              <div class="desc">
                <h3>
                  <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal">
                    {title}
                  </a>
                </h3>
              </div>
              <ul class="tags">
                {tags.map((tag) => (
                  <li>
                    <a
                      class="internal tag-link"
                      href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                    >
                      {tag}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// Helper function to clean description text by removing titles, wikilinks, and unwanted elements
function cleanDescriptionText(content: string): string {
  if (!content) return ""
  
  // Split into lines
  const lines = content.split('\n')
  
  // Filter out unwanted lines and clean content
  const cleanedLines = lines
    .filter(line => {
      const trimmed = line.trim()
      // Skip empty lines
      if (!trimmed) return false
      // Skip markdown headers
      if (trimmed.startsWith('#')) return false
      // Skip lines that are just wikilinks or tables
      if (trimmed.match(/^[\|\s]*\[\[.*?\]\][\|\s]*$/) || trimmed.match(/^\|+$/)) return false
      // Skip frontmatter separators
      if (trimmed === '---') return false
      return true
    })
    .map(line => {
      // Remove wikilinks [[text]]
      let cleaned = line.replace(/\[\[.*?\]\]/g, '')
      // Remove markdown links [text](url)
      cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown images ![alt](src)
      cleaned = cleaned.replace(/!\[.*?\]\([^)]+\)/g, '')
      // Clean up extra whitespace
      cleaned = cleaned.replace(/\s+/g, ' ').trim()
      return cleaned
    })
    .filter(line => line.length > 0)
  
  // Find the first substantial paragraph (not just short fragments)
  for (const line of cleanedLines) {
    if (line.length > 50) {
      // Truncate to reasonable length for display
      if (line.length > 200) {
        return line.substring(0, 200).trim() + '...'
      }
      return line
    }
  }
  
  // Fallback: join first few lines if no single substantial paragraph found
  const joined = cleanedLines.slice(0, 3).join(' ')
  if (joined.length > 200) {
    return joined.substring(0, 200).trim() + '...'
  }
  return joined
}

// New Grid PageList component for tag pages
export const GridPageList: QuartzComponent = ({ cfg, fileData, allFiles, limit, sort }: Props) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
  let list = allFiles.sort(sorter)
  if (limit) {
    list = list.slice(0, limit)
  }

  return (
    <div class="grid-container">
      {list.map((page) => {
        const title = page.frontmatter?.title
        const description = page.frontmatter?.description || page.description || ""
        
        // Get raw content for processing
        const rawContent = (page as any).text || 
                          (page as any).content || 
                          page.description || 
                          ""
        
        // Create cleaned description for display (removing titles, wikilinks, etc.)
        const cleanedDescription = cleanDescriptionText(rawContent) || description
        
        const firstImage = getCardImage({ ...(page as QuartzPluginData), slug: page.slug })

        return (
          <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal grid-item-link" data-no-popover="true">
            <div class={firstImage ? "grid-item has-bg" : "grid-item"}>
              {firstImage && (
                <div
                  class="grid-item-bg"
                  style={{ backgroundImage: `url('${firstImage}')` }}
                  aria-hidden="true"
                />
              )}
              <div class="grid-item-content">
                <div class="grid-item-meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </div>
                <h3 class="grid-item-title">
                  {title}
                </h3>
                {cleanedDescription && (
                  <p class="grid-item-description">{cleanedDescription}</p>
                )}
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}

PageList.css = `
.section h3 {
  margin: 0;
}

.section > .tags {
  margin: 0;
}
`

