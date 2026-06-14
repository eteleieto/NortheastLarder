import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, SimpleSlug } from "../util/path"
import style from "./styles/categoryLinks.scss"
import { GlobalConfiguration } from "../cfg"
import { classNames } from "../util/lang"
// @ts-ignore
import script from "./scripts/categorylinks.inline"

interface CategoryLinkItem {
  name: string
  slug: SimpleSlug
}

interface CategoryActionItem {
  name: string
  action: "graph"
}

type CategoryItem = CategoryLinkItem | CategoryActionItem

const isActionItem = (item: CategoryItem): item is CategoryActionItem => "action" in item

interface Options {
  title?: string
  categories: Array<CategoryItem>
}

const defaultOptions = (_cfg: GlobalConfiguration): Options => ({
  title: "Browse",
  categories: [
    { name: "Recipes", slug: "tags/RECIPE" as SimpleSlug },
    { name: "Blogs", slug: "tags/BLOG" as SimpleSlug },
    { name: "Experiments", slug: "tags/EXPERIMENT" as SimpleSlug },
    { name: "Projects", slug: "tags/PROJECT" as SimpleSlug },
  ],
})

export default ((userOpts?: Partial<Options>) => {
  const CategoryLinks: QuartzComponent = ({
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const opts = { ...defaultOptions(cfg), ...userOpts }
    const title = opts.title ?? "Browse"
    // Several instances can coexist (right rail + mobile drawer sections)
    const listId = `category-list-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

    return (
      <nav class={classNames(displayClass, "category-links")} aria-label={title}>
        <button
          type="button"
          class="category-links-header"
          aria-controls={listId}
          aria-expanded={true}
        >
          <span class="rail-label">{title}</span>
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
            class="fold"
          >
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
        <ul class="category-list" id={listId}>
          {opts.categories.map((category) => (
            <li class="category-item">
              {isActionItem(category) ? (
                <button type="button" class="category-link graph-open">
                  {category.name}
                </button>
              ) : (
                <a href={resolveRelative(fileData.slug!, category.slug)} class="category-link">
                  {category.name}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  CategoryLinks.css = style
  CategoryLinks.afterDOMLoaded = script

  return CategoryLinks
}) satisfies QuartzComponentConstructor
