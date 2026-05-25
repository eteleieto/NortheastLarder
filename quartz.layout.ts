import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

// Static landing-style pages: no Table of Contents or Backlinks in the right rail.
const LANDING_SLUGS = ["index", "About-Us", "For-Restaurants", "Documentation", "Bookshelf"]
const isLandingPage = (slug: string | undefined) => !!slug && LANDING_SLUGS.includes(slug)

// Pages that already provide their own h1 in the body — suppress the auto
// ArticleTitle/ContentMeta so the title doesn't render twice.
const suppressArticleHeader = (slug: string | undefined) => isLandingPage(slug)
const isHomePage = (slug: string | undefined) => slug === "index"

const graphPreview = Component.Graph({ preview: true })

const primaryNav = Component.CategoryLinks({
  title: "Browse",
  categories: [
    { name: "Recipes", slug: "tags/RECIPE" as SimpleSlug },
    { name: "Blogs", slug: "tags/BLOG" as SimpleSlug },
    { name: "Larders", slug: "tags/LARDER" as SimpleSlug },
    { name: "Projects", slug: "tags/PROJECT" as SimpleSlug },
    { name: "Graph", action: "graph" },
  ],
})

const recentBlogPosts = Component.RecentNotes({
  title: "Recent Blog Posts",
  showTags: false,
  limit: 3,
  filter: (page) => {
    const tags = page.frontmatter?.tags
    if (!tags) return false
    if (typeof tags === "string") return tags === "BLOG"
    if (Array.isArray(tags)) return tags.includes("BLOG")
    return false
  },
})

const recentNotes = Component.RecentNotes({
  title: "Recent Notes",
  showTags: false,
  limit: 3,
  filter: (page) => {
    const tags = page.frontmatter?.tags
    const allowedTags = ["PROJECT", "LARDER", "RECIPE", "IDEA"]
    if (!tags) return false
    if (typeof tags === "string") return allowedTags.includes(tags)
    if (Array.isArray(tags)) return tags.some((tag) => allowedTags.includes(tag))
    return false
  },
})

// Left rail: brand + recent postings.
const leftSidebar = [
  Component.PageTitle(),
  Component.MobileOnly(Component.Search()),
  Component.MobileOnly(
    Component.HamburgerMenu({
      children: [recentBlogPosts, recentNotes],
    }),
  ),
  Component.DesktopOnly(recentBlogPosts),
  Component.DesktopOnly(recentNotes),
]

// Right rail: browse and page-contextual tools.
const rightSidebar = [
  Component.DesktopOnly(Component.Search()),
  primaryNav,
  Component.ConditionalRender({
    component: Component.DesktopOnly(Component.TableOfContents()),
    condition: (page) => !isLandingPage(page.fileData.slug),
  }),
  Component.ConditionalRender({
    component: Component.Backlinks(),
    condition: (page) => !isLandingPage(page.fileData.slug),
  }),
  Component.ConditionalRender({
    component: graphPreview,
    condition: (page) => isHomePage(page.fileData.slug),
  }),
]

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [Component.Graph()],
  footer: Component.Footer(),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => !suppressArticleHeader(page.fileData.slug),
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => !suppressArticleHeader(page.fileData.slug),
    }),
    Component.ProjectLink(),
  ],
  left: leftSidebar,
  right: rightSidebar,
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: leftSidebar,
  right: [Component.DesktopOnly(Component.Search()), primaryNav],
}
