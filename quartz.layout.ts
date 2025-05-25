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
    // Mobile layout: only search, no dark mode or reader mode
    Component.MobileOnly(Component.Search()),
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
    // Mobile: Recent notes under the title/search
    Component.MobileOnly(Component.RecentNotes({ 
      title: "Recent Blog Posts",
      showTags: false,
      limit: 3,
      filter: (page) => {
        const tags = page.frontmatter?.tags
        if (!tags) return false
        if (typeof tags === 'string') return tags === "BLOG"
        if (Array.isArray(tags)) return tags.includes("BLOG")
        return false
      }
    })),
    Component.MobileOnly(Component.RecentNotes({
      title: "Recent Notes",
      showTags: false,
      limit: 3,
      filter: (page) => {
        const tags = page.frontmatter?.tags;
        if (!tags) return false;
        if (typeof tags === 'string') {
          return tags !== "BLOG";
        }
        if (Array.isArray(tags)) {
          return !tags.includes("BLOG");
        }
        return false;
      }
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
      showTags: false,
      filter: (page) => {
        const tags = page.frontmatter?.tags;
        if (!tags) return false;
        return true;
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
    // Mobile layout: only search, no dark mode
    Component.MobileOnly(Component.Search()),
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
    Component.Explorer(),
  ],
  right: [],
}
