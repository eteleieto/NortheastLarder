import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { Date, getDate } from "./Date"
import { resolveRelative } from "../util/path"
import { getCardImage } from "../util/cardImage"
import { getProjectPages, isProjectPage } from "../util/projectMatch"
// @ts-ignore
import script from "./scripts/projectgallery.inline"
import style from "./styles/projectGallery.scss"

const ProjectGallery: QuartzComponent = ({ cfg, fileData, allFiles }: QuartzComponentProps) => {
  if (!isProjectPage(fileData)) return null

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

  const countLabel =
    relatedPages.length === 1 ? "1 exploration" : `${relatedPages.length} explorations`

  return (
    <section class="project-gallery" aria-label="Project explorations">
      <div class="project-gallery-header">
        <h2 class="project-gallery-title">In this project</h2>
        <p class="project-gallery-count">{countLabel}</p>
      </div>
      <div class="project-gallery-controls">
        <button
          type="button"
          class="project-gallery-nav project-gallery-nav-prev"
          aria-label="Scroll to previous explorations"
          disabled
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <div class="project-gallery-track" tabindex="0">
          {relatedPages.map((page) => {
            const title = page.frontmatter?.title
            const description = page.frontmatter?.description || page.description || ""
            const firstImage = getCardImage(page)

            return (
              <a
                href={resolveRelative(fileData.slug!, page.slug!)}
                class="internal project-gallery-card"
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
        <button
          type="button"
          class="project-gallery-nav project-gallery-nav-next"
          aria-label="Scroll to next explorations"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
    </section>
  )
}

ProjectGallery.css = style
ProjectGallery.afterDOMLoaded = script

export default (() => ProjectGallery) satisfies QuartzComponentConstructor
