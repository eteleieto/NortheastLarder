import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { Date, getDate } from "./Date"
import { resolveRelative } from "../util/path"
import { getCardImage } from "../util/cardImage"
import { getProjectPages, isProjectPage } from "../util/projectMatch"
import { isWipPage } from "../util/wip"
// @ts-ignore
import script from "./scripts/projectgallery.inline"
import style from "./styles/projectGallery.scss"

const INITIAL_VISIBLE = 6
const LOAD_MORE_STEP = 6

const ProjectGallery: QuartzComponent = ({ cfg, fileData, allFiles }: QuartzComponentProps) => {
  if (!isProjectPage(fileData) || isWipPage(fileData)) return null

  const relatedPages = getProjectPages(fileData, allFiles).sort((a, b) => {
    if (a.dates && b.dates) {
      return getDate(cfg, b)!.getTime() - getDate(cfg, a)!.getTime()
    }
    if (a.dates && !b.dates) return -1
    if (!a.dates && b.dates) return 1

    const aTitle = a.frontmatter?.title?.toLowerCase() ?? ""
    const bTitle = b.frontmatter?.title?.toLowerCase() ?? ""
    return aTitle.localeCompare(bTitle)
  })

  if (relatedPages.length === 0) return null

  const hasMore = relatedPages.length > INITIAL_VISIBLE

  return (
    <section class="project-gallery" aria-label="Project explorations">
      <h2 class="project-gallery-title">In this project</h2>
      <div
        class="card-list-container project-gallery-cards"
        data-initial={INITIAL_VISIBLE}
        data-step={LOAD_MORE_STEP}
      >
        {relatedPages.map((page, index) => {
          const title = page.frontmatter?.title
          const description = page.frontmatter?.description || page.description || ""
          const firstImage = getCardImage(page)
          const hidden = index >= INITIAL_VISIBLE

          return (
            <a
              href={resolveRelative(fileData.slug!, page.slug!)}
              class={
                hidden
                  ? "internal card-item-link project-gallery-card-hidden"
                  : "internal card-item-link"
              }
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
      {hasMore && (
        <button type="button" class="project-gallery-load-more">
          Load more
        </button>
      )}
    </section>
  )
}

ProjectGallery.css = style
ProjectGallery.afterDOMLoaded = script

export default (() => ProjectGallery) satisfies QuartzComponentConstructor
