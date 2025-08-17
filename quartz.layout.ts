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
      component: Component.ArticleTitle(),
      condition: (page) => !["index", "About", "Contact", "Documentation"].includes(page.fileData.slug!),
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => !["index", "About", "Contact", "Documentation"].includes(page.fileData.slug!),
    }),
    Component.TagList(),
    Component.ProjectLink(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    // Mobile layout: hamburger menu with recent notes, and search only
    Component.MobileOnly(Component.HamburgerMenu({
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
            const allowedTags = ["PROJECT", "LARDER", "RECIPE", "BLOG", "IDEA"];
            
            if (!tags) return false;
            
            if (typeof tags === 'string') {
              return allowedTags.includes(tags);
            }
            
            if (Array.isArray(tags)) {
              return tags.some(tag => allowedTags.includes(tag));
            }
            
            return false;
          }
        }),
      ]
    })),
    // Mobile layout: search (center)
    Component.MobileOnly(Component.Search()),
    // Mobile layout: dark mode toggle (before hamburger)
    Component.MobileOnly(Component.Darkmode()),
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
        const allowedTags = ["PROJECT", "LARDER", "RECIPE", "BLOG", "IDEA"];
        
        if (!tags) return false;
        
        if (typeof tags === 'string') {
          return allowedTags.includes(tags);
        }
        
        if (Array.isArray(tags)) {
          return tags.some(tag => allowedTags.includes(tag));
        }
        
        return false;
      }
    })),
  ],
  right: [
    Component.Graph(),
    Component.ConditionalRender({
      component: Component.CategoryLinks(),
      condition: (page) => ["index", "About", "Contact", "Documentation"].includes(page.fileData.slug!),
    }),
    Component.ConditionalRender({
      component: Component.Newsletter(),
      condition: (page) => ["index", "About", "Contact", "Documentation"].includes(page.fileData.slug!),
    }),
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.TableOfContents()),
      condition: (page) => !["index", "About", "Contact", "Documentation"].includes(page.fileData.slug!),
    }),
    Component.ConditionalRender({
      component: Component.Backlinks(),
      condition: (page) => !["index", "About", "Contact", "Documentation"].includes(page.fileData.slug!),
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    // Mobile layout: hamburger menu with recent notes, and search only
    Component.MobileOnly(Component.HamburgerMenu({
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
            const allowedTags = ["PROJECT", "LARDER", "RECIPE", "BLOG", "IDEA"];
            
            if (!tags) return false;
            
            if (typeof tags === 'string') {
              return allowedTags.includes(tags);
            }
            
            if (Array.isArray(tags)) {
              return tags.some(tag => allowedTags.includes(tag));
            }
            
            return false;
          }
        }),
      ]
    })),
    Component.MobileOnly(Component.Search()),
    // Mobile layout: dark mode toggle
    Component.MobileOnly(Component.Darkmode()),
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
        const allowedTags = ["PROJECT", "LARDER", "RECIPE", "BLOG", "IDEA"];
        
        if (!tags) return false;
        
        if (typeof tags === 'string') {
          return allowedTags.includes(tags);
        }
        
        if (Array.isArray(tags)) {
          return tags.some(tag => allowedTags.includes(tag));
        }
        
        return false;
      }
    })),
  ],
  right: [],
}
