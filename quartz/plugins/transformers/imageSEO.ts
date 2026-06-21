import { QuartzTransformerPlugin } from "../types"
import { Root } from "hast"
import { visit } from "unist-util-visit"
import fs from "fs"
import path from "path"
import { BuildCtx } from "../util/ctx"
import { FilePath, slugifyFilePath } from "../../util/path"
import { stripWipMarkers } from "../../util/wip"

function contentRoot(ctx: BuildCtx): string {
  return path.isAbsolute(ctx.argv.directory)
    ? ctx.argv.directory
    : path.join(process.cwd(), ctx.argv.directory)
}

function buildPosterIndex(ctx: BuildCtx): Set<string> {
  const index = new Set<string>()
  const root = contentRoot(ctx)

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith(".poster.webp")) {
        const rel = path.relative(root, full).replace(/\\/g, "/") as FilePath
        index.add(slugifyFilePath(rel))
      }
    }
  }

  walk(root)
  return index
}

export const ImageSEO: QuartzTransformerPlugin = () => {
  return {
    name: "ImageSEO",
    htmlPlugins(ctx) {
      const posterIndex = buildPosterIndex(ctx)

      return [
        () => {
          return (tree: Root) => {
            visit(tree, "element", (node) => {
              if (node.tagName === "img") {
                // Add lazy loading for performance
                if (!node.properties?.loading) {
                  node.properties = { ...node.properties, loading: "lazy" }
                }

                // Improve alt text if it's generic or missing
                const alt = node.properties?.alt as string
                const src = node.properties?.src as string

                if (!alt || alt === "" || alt === "image") {
                  // Generate better alt text from filename
                  const filename = src?.split("/").pop()?.split(".")[0]
                  if (filename) {
                    const betterAlt = stripWipMarkers(filename)
                      .replace(/[-_]/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                    node.properties = { ...node.properties, alt: betterAlt }
                  }
                }

                // Add decoding="async" for better performance
                node.properties = { ...node.properties, decoding: "async" }
              }

              if (node.tagName === "video") {
                if (!node.properties?.preload) {
                  node.properties = { ...node.properties, preload: "none" }
                }
                const src = node.properties?.src as string | undefined
                if (src && !node.properties?.poster) {
                  const assetSlug = src.replace(/^\.\//, "").replace(/^\//, "")
                  const posterSlug = assetSlug.replace(/\.(web\.)?(mp4|webm|ogv|mov|mkv)$/i, ".poster.webp")
                  if (posterIndex.has(posterSlug as FilePath)) {
                    node.properties = {
                      ...node.properties,
                      poster: src.startsWith("/")
                        ? `/${posterSlug}`
                        : `./${posterSlug}`,
                    }
                  }
                }
              }
            })
          }
        },
      ]
    },
  }
}
