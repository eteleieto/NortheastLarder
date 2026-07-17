import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { getCardImage } from "../util/cardImage"
import { getProjectPages, isProjectPage } from "../util/projectMatch"
import { isWipPage } from "../util/wip"
import style from "./styles/featuredProjects.scss"

const MAX_PROJECTS = 6
const MIN_WRITTEN_WORDS = 120
const MIN_PROJECTS = 3

function writtenWordCount(text: string | undefined): number {
  return (text ?? "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

const FeaturedProjects: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  const rankedProjects = allFiles
    .filter((page) => isProjectPage(page) && !isWipPage(page))
    .map((page) => ({
      page,
      words: writtenWordCount(page.text),
      explorations: getProjectPages(page, allFiles).length,
    }))
    .sort((a, b) => {
      if (a.words !== b.words) return b.words - a.words
      if (a.explorations !== b.explorations) return b.explorations - a.explorations
      return (a.page.frontmatter?.title ?? "").localeCompare(b.page.frontmatter?.title ?? "")
    })

  const developedProjects = rankedProjects.filter(({ words }) => words >= MIN_WRITTEN_WORDS)
  const projects = (
    developedProjects.length >= MIN_PROJECTS
      ? developedProjects
      : rankedProjects.slice(0, MIN_PROJECTS)
  ).slice(0, MAX_PROJECTS)

  if (projects.length === 0) return null

  return (
    <section class="featured-projects" aria-labelledby="featured-projects-title">
      <div class="featured-projects-heading">
        <h2 id="featured-projects-title">Current projects</h2>
      </div>

      <div class="featured-projects-track" tabindex={0} aria-label="Most developed projects">
        {projects.map(({ page }) => {
          const title = page.frontmatter?.title ?? "Untitled project"
          const image = getCardImage(page)

          return (
            <a
              href={resolveRelative(fileData.slug!, page.slug!)}
              class="internal featured-project-card"
              data-no-popover="true"
            >
              <div class={image ? "card-item has-bg" : "card-item"}>
                {image && (
                  <div
                    class="card-item-bg"
                    style={{ backgroundImage: `url('${image}')` }}
                    aria-hidden="true"
                  />
                )}
                <div class="card-item-content">
                  <h3 class="card-item-title">{title}</h3>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

FeaturedProjects.css = style

export default (() => FeaturedProjects) satisfies QuartzComponentConstructor
