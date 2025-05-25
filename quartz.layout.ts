import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer(),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    // Mobile layout: search bar centered at top
    Component.MobileOnly(Component.Search()),
    Component.MobileOnly(Component.Spacer()),
    // Mobile layout: dark mode toggle and hamburger menu
    Component.MobileOnly(Component.Flex({
      components: [
        { 
          Component: Component.Darkmode(),
          justify: "start"
        },
        { 
          Component: Component.HamburgerMenu({
            children: [
              Component.RecentNotes({ 
                title: "Recent Blog Posts",
                showTags: false,
                limit: 5,
                filter: (page) => {
                  const tags = page.frontmatter?.tags
                  if (!tags) return false
                  if (typeof tags === 'string') return tags === "BLOG"
                  if (Array.isArray(tags)) return tags.includes("BLOG")
                  return false
                }
              }),
              Component.RecentNotes({
                title: "Recent Notes",
                showTags: false,
                limit: 5,
                filter: (page) => {
                  const tags = page.frontmatter?.tags;
                  // Show pages that have any tags at all (exclude pages with no tags)
                  if (!tags) return false; // Exclude pages without tags
                  if (typeof tags === 'string') {
                    return true; // Has a tag (any non-empty string)
                  }
                  if (Array.isArray(tags)) {
                    return tags.length > 0; // Has at least one tag
                  }
                  return false; // Default to exclude
                }
              }),
            ]
          }),
          justify: "end"
        },
      ],
      direction: "row",
      gap: "0",
    })),
    // Desktop layout: search with dark mode and reader mode
    Component.DesktopOnly(Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    })),
    // Desktop: Recent notes in sidebar
    Component.DesktopOnly(Component.RecentNotes({ 
      title: "Recent Blog Posts",
      showTags: false,
      filter: (page) => {
        const tags = page.frontmatter?.tags
        if (!tags) return false
        if (typeof tags === 'string') return tags === "BLOG"
        if (Array.isArray(tags)) return tags.includes("BLOG")
        return false
      }
    })),
    Component.DesktopOnly(Component.RecentNotes({
      title: "Recent Notes",
      showTags: false,
      filter: (page) => {
        const tags = page.frontmatter?.tags;
        // Show pages that have any tags at all (exclude pages with no tags)
        if (!tags) return false; // Exclude pages without tags
        if (typeof tags === 'string') {
          return true; // Has a tag (any non-empty string)
        }
        if (Array.isArray(tags)) {
          return tags.length > 0; // Has at least one tag
        }
        return false; // Default to exclude
      }
    })),
  ],
  right: [
    Component.Graph(),
    Component.ConditionalRender({
      component: Component.CategoryLinks(),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.TableOfContents()),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    // Mobile layout: search bar centered at top
    Component.MobileOnly(Component.Search()),
    Component.MobileOnly(Component.Spacer()),
    // Mobile layout: dark mode toggle and hamburger menu
    Component.MobileOnly(Component.Flex({
      components: [
        { 
          Component: Component.Darkmode(),
          justify: "start"
        },
        { 
          Component: Component.HamburgerMenu({
            children: [
              Component.Explorer(),
            ]
          }),
          justify: "end"
        },
      ],
      direction: "row",
      gap: "0",
    })),
    // Desktop layout: search with dark mode
    Component.DesktopOnly(Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    })),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
