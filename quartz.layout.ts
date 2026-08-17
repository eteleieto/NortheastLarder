import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"
import { isWipPage } from "./quartz/util/wip"
import { QuartzPluginData } from "./quartz/plugins/vfile"

// Static landing-style pages: no Table of Contents or Backlinks in the right rail.
const LANDING_SLUGS = ["index", "About-Us", "For-Restaurants", "Documentation", "Bookshelf"]
const isLandingPage = (slug: string | undefined) => !!slug && LANDING_SLUGS.includes(slug)

// Pages that already provide their own h1 in the body — suppress the auto
// ArticleTitle/ContentMeta so the title doesn't render twice.
const suppressArticleHeader = (slug: string | undefined) => isLandingPage(slug)
const isHomePage = (slug: string | undefined) => slug === "index"
const showArticleSidebar = (slug: string | undefined, fileData: QuartzPluginData) =>
  !isLandingPage(slug) && !isWipPage(fileData)

const graphPreview = Component.Graph({ preview: true })

// Right rail: title reads as a section label above the bar, like Browse/Graph
const railSearch = Component.Search({ labelAbove: true })

const browseCategories = [
  { name: "Recipes", slug: "tags/RECIPE" as SimpleSlug },
  { name: "Blogs", slug: "tags/BLOG" as SimpleSlug },
  { name: "Events", slug: "tags/EVENT" as SimpleSlug },
  { name: "Experiments", slug: "tags/EXPERIMENT" as SimpleSlug },
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

const recentProjects = Component.RecentNotes({
  title: "Recent Projects",
  showTags: false,
  limit: 3,
  filter: (page) => {
    const tags = page.frontmatter?.tags
    if (!tags) return false
    if (typeof tags === "string") return tags === "PROJECT"
    if (Array.isArray(tags)) return tags.includes("PROJECT")
    return false
  },
})

const recentBlogs = Component.RecentNotes({
  title: "Recent Blogs",
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

// Left rail: brand + recent postings.
const leftSidebar = [
  Component.PageTitle(),
  Component.MobileOnly(Component.Search()),
  Component.MobileOnly(
    Component.HamburgerMenu({
      // Hierarchy: site pages first, then content categories, then recency
      children: [pagesNav, browseNavHome, recentProjects, recentBlogs],
    }),
  ),
  Component.DesktopOnly(recentProjects),
  Component.DesktopOnly(recentBlogs),
]

// Right rail: browse and page-contextual tools.
const rightSidebar = [
  Component.DesktopOnly(railSearch),
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
    condition: (page) => showArticleSidebar(page.fileData.slug, page.fileData),
  }),
  Component.ConditionalRender({
    component: Component.DesktopOnly(Component.Backlinks()),
    condition: (page) => showArticleSidebar(page.fileData.slug, page.fileData),
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
  afterBody: [
    Component.ConditionalRender({
      component: Component.FeaturedProjects(),
      condition: (page) => isHomePage(page.fileData.slug),
    }),
    Component.ProjectGallery(),
    Component.Graph({ globalGraph: { fitView: true } }),
  ],
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
    Component.Pairings(),
  ],
  left: leftSidebar,
  right: rightSidebar,
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: leftSidebar,
  right: [Component.DesktopOnly(railSearch), Component.DesktopOnly(browseNav)],
}
