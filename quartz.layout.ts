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

const browseCategories = [
  { name: "Recipes", slug: "tags/RECIPE" as SimpleSlug },
  { name: "Blogs", slug: "tags/BLOG" as SimpleSlug },
  { name: "Larders", slug: "tags/LARDER" as SimpleSlug },
  { name: "Projects", slug: "tags/PROJECT" as SimpleSlug },
]

const browseNav = Component.CategoryLinks({
  title: "Browse",
  categories: [...browseCategories, { name: "Graph", action: "graph" }],
})

const browseNavHome = Component.CategoryLinks({
  title: "Browse",
  categories: browseCategories,
})

// Primary site pages — surfaced in the mobile drawer (desktop reaches them
// via the home intro links and the footer).
const pagesNav = Component.CategoryLinks({
  title: "Pages",
  categories: [
    { name: "About Us", slug: "About-Us" as SimpleSlug },
    { name: "For Restaurants", slug: "For-Restaurants" as SimpleSlug },
    { name: "Documentation", slug: "Documentation" as SimpleSlug },
    { name: "Bookshelf", slug: "Bookshelf" as SimpleSlug },
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
      // Hierarchy: site pages first, then content categories, then recency
      children: [pagesNav, browseNavHome, recentBlogPosts, recentNotes],
    }),
  ),
  Component.DesktopOnly(recentBlogPosts),
  Component.DesktopOnly(recentNotes),
]

// Right rail: browse and page-contextual tools.
const rightSidebar = [
  Component.DesktopOnly(Component.Search()),
  // Desktop/tablet only — the mobile drawer carries Browse instead
  Component.ConditionalRender({
    component: Component.DesktopOnly(browseNavHome),
    condition: (page) => isHomePage(page.fileData.slug),
  }),
  Component.ConditionalRender({
    component: Component.DesktopOnly(browseNav),
    condition: (page) => !isHomePage(page.fileData.slug),
  }),
  Component.ConditionalRender({
    component: Component.DesktopOnly(Component.TableOfContents()),
    condition: (page) => !isLandingPage(page.fileData.slug),
  }),
  Component.ConditionalRender({
    component: Component.DesktopOnly(Component.Backlinks()),
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
  // fitView: start the overlay zoomed so every node is visible
  afterBody: [Component.Graph({ globalGraph: { fitView: true } })],
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
  right: [Component.DesktopOnly(Component.Search()), Component.DesktopOnly(browseNav)],
}
