import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { getCardImage } from "../util/cardImage"

type Props = {
  pages: string[] // Array of page slugs/titles to render
} & QuartzComponentProps

export const CardList: QuartzComponent = ({ cfg, fileData, allFiles, pages }: Props) => {
  const filteredPages = allFiles.filter((page) => {
    const title = page.frontmatter?.title?.toLowerCase()
    const slug = page.slug?.toLowerCase()

    return pages.some((targetPage) => {
      const target = targetPage.toLowerCase()
      return (
        title === target ||
        slug === target ||
        title?.includes(target) ||
        slug?.includes(target)
      )
    })
  })

  const sortedPages = filteredPages.sort((f1, f2) => {
    if (f1.dates && f2.dates) {
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  })

  return (
    <div class="card-list-container">
      {sortedPages.map((page) => {
        const title = page.frontmatter?.title
        const description = page.frontmatter?.description || page.description || ""
        const firstImage = getCardImage({ ...(page as QuartzPluginData), slug: page.slug })

        return (
          <a
            href={resolveRelative(fileData.slug!, page.slug!)}
            class="internal card-item-link"
            data-no-popover="true"
          >
            <div class={firstImage ? "card-item has-bg" : "card-item"}>
              {firstImage && (
                <div
                  class="card-item-bg"
                  style={{ backgroundImage: `url('${firstImage}')` }}
                  aria-hidden="true"
                />
              )}
              <div class="card-item-content">
                <div class="card-item-meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </div>
                <h3 class="card-item-title">{title}</h3>
                {description && <p class="card-item-description">{description}</p>}
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
