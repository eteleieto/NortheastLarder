import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, SimpleSlug } from "../util/path"
import style from "./styles/categoryLinks.scss"
import { GlobalConfiguration } from "../cfg"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

interface CategoryItem {
  name: string
  slug: SimpleSlug
  icon: any
}

interface Options {
  title?: string
  categories: Array<CategoryItem>
}

const defaultOptions = (cfg: GlobalConfiguration): Options => ({
  title: "Browse by Category",
  categories: [
    { 
      name: "Recipes", 
      slug: "recipes" as SimpleSlug,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
          <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>
        </svg>
      )
    },
    { 
      name: "Experiments", 
      slug: "experiments" as SimpleSlug,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 2v6l-3 7h12l-3-7V2"/>
          <path d="M6 2h12"/>
        </svg>
      )
    },
    { 
      name: "Blogs", 
      slug: "blogs" as SimpleSlug,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      )
    },
    { 
      name: "Ideas", 
      slug: "ideas" as SimpleSlug,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.59 0 3.07.41 4.36 1.14"/>
        </svg>
      )
    },
    { 
      name: "Larders", 
      slug: "larders" as SimpleSlug,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 8l4-4v3a4 4 0 0 0 4 4h0a5 5 0 0 1 5 5v3l4-4"/>
          <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/>
          <path d="M1 8h22"/>
        </svg>
      )
    },
    { 
      name: "Projects", 
      slug: "projects" as SimpleSlug,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )
    },
  ],
})

export default ((userOpts?: Partial<Options>) => {
  const CategoryLinks: QuartzComponent = ({
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const opts = { ...defaultOptions(cfg), ...userOpts }

    return (
      <div class={classNames(displayClass, "category-links")}>
        <h3>{opts.title}</h3>
        <ul class="category-list">
          {opts.categories.map((category) => (
            <li class="category-item">
              <div class="section">
                <div class="desc">
                  <h3>
                    <a href={resolveRelative(fileData.slug!, category.slug)} class="category-link">
                      <span class="category-icon">
                        {category.icon}
                      </span>
                      {category.name}
                    </a>
                  </h3>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  CategoryLinks.css = style
  return CategoryLinks
}) satisfies QuartzComponentConstructor 