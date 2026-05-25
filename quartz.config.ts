import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { CustomOgImages } from "./quartz/plugins/emitters/ogImage"

const isDev = process.env.QUARTZ_DEV === "1"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Northeast Larder",
    pageTitleSuffix: " | Northeast Larder - Fermentation & Regional Food Lab",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "google",
      tagId: "G-2SG4LGTEHC",
    },
    locale: "en-US",
    baseUrl: "northeastlarder.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      // Font hierarchy: header ("JetBrains Mono"), body ("Roboto"), and code ("IBM Plex Mono")
      typography: {
        header: "JetBrains Mono",
        body: "Roboto",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#fffefa",
          lightgray: "#f8f5ef",
          gray: "#d8cbb8",
          darkgray: "#3f3a33",
          dark: "#171512",
          secondary: "#473d33",
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
      Plugin.MultiColumnTransformer(),
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
      Plugin.CardListTransformer(),
      Plugin.ImageSEO(),
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
      Plugin.NotFoundPage(),
      Plugin.Favicon(),

      // OG images are slow to generate (~12s for this site). Skip in local dev.
      ...(isDev
        ? []
        : [
            CustomOgImages({
              colorScheme: "lightMode",
              width: 1200,
              height: 630,
              excludeRoot: false,
            }),
          ]),
    ],
  },
}

export default config
