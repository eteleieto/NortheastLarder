import { FullSlug, isFolderPath, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { GlobalConfiguration } from "../cfg"

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

        return (
          <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal grid-item-link" data-no-popover="true">
            <div class="grid-item">
              <div class="grid-item-image-placeholder">
                {/* Placeholder for future image support */}
                <div class="image-placeholder"></div>
              </div>
              <div class="grid-item-content">
                <div class="grid-item-meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </div>
                <h3 class="grid-item-title">
                  {title}
                </h3>
                {description && (
                  <p class="grid-item-description">{description}</p>
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

GridPageList.css = `
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

@media all and (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media all and (max-width: 800px) {
  .grid-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.grid-item-link {
  text-decoration: none;
  color: inherit;
  background-color: transparent;
  display: block;
}

.grid-item {
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--light);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
}

.grid-item-link:hover .grid-item {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.grid-item-image-placeholder {
  height: 200px;
  background-color: var(--lightgray);
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--lightgray) 0%, var(--gray) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dark);
  font-size: 0.9rem;
  opacity: 0.6;
}

.image-placeholder::before {
  content: "🖼️";
  font-size: 2rem;
}

.grid-item-content {
  padding: 1.5rem;
}

.grid-item-meta {
  color: var(--gray);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.grid-item-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  line-height: 1.3;
  color: var(--dark);
}

.grid-item-link:hover .grid-item-title {
  color: var(--secondary);
}

.grid-item-description {
  color: var(--darkgray);
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
`
