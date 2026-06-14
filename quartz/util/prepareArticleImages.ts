import { Root } from "hast"
import { visit } from "unist-util-visit"
import { BuildCtx } from "./ctx"
import { FullSlug } from "./path"
import { ensureDisplayImage } from "./articleImage"
import { ProcessedContent } from "../plugins/vfile"

function parseDisplayWidth(value: unknown): number | undefined {
  if (typeof value === "number" && value > 0) return value
  if (typeof value === "string" && value !== "auto") {
    const parsed = parseInt(value, 10)
    if (parsed > 0) return parsed
  }
  return undefined
}

async function optimizeImagesInTree(ctx: BuildCtx, slug: FullSlug, tree: Root) {
  const tasks: Promise<void>[] = []

  visit(tree, "element", (node) => {
    if (node.tagName !== "img") return
    const src = node.properties?.src
    if (typeof src !== "string" || src.startsWith("http") || /\.svg(\?|$)/i.test(src)) return

    const displayWidth = parseDisplayWidth(node.properties?.width)
    tasks.push(
      ensureDisplayImage(ctx, slug, src, displayWidth).then((optimized) => {
        if (optimized) {
          node.properties = { ...node.properties, src: optimized }
        }
      }),
    )
  })

  await Promise.all(tasks)
}

export async function prepareArticleImages(ctx: BuildCtx, content: ProcessedContent[]) {
  for (const [tree, file] of content) {
    if (!file.data.slug) continue
    await optimizeImagesInTree(ctx, file.data.slug, tree as Root)
  }
}
