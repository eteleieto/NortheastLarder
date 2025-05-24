import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Northeast Larder",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "JetBrains Mono",
        body: "Inconsolata",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#fff8ed",
          lightgray: "#f0e7db",
          gray: "#d8cbb8",
          darkgray: "#7a6c5d",
          dark: "#2a2620", // Made body text darker
          secondary: "#5c4f42",
          tertiary: "#a1887f",
          highlight: "rgba(188, 174, 153, 0.3)",
          textHighlight: "#fffacd88",
        },
        darkMode: {
          light: "#2c261e",
          lightgray: "#4a3f34",
          gray: "#68594a",
          darkgray: "#bcae99",
          dark: "#e5e0d6", // Made body text darker (less bright)
          secondary: "#a1887f",
          tertiary: "#bcae99",
          highlight: "rgba(122, 108, 93, 0.3)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
