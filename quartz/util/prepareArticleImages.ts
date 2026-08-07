import { Properties, Root } from "hast"
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

    const declaredWidth = parseDisplayWidth(node.properties?.width)
    const declaredHeight = parseDisplayWidth(node.properties?.height)
    tasks.push(
      ensureDisplayImage(ctx, slug, src, declaredWidth).then((optimized) => {
        const properties: Properties = { ...node.properties }
        if (optimized) {
          properties.src = optimized.url
        }

        // Obsidian embeds carry at most a width (`![[img|250]]`), and the wikilink
        // transformer fills the rest with the string "auto". `auto` is not a valid
        // value for the HTML width/height attributes, so browsers drop it and derive
        // no aspect-ratio — the image then occupies zero height until it decodes and
        // shoves the rest of the page down. Substitute the real intrinsic ratio.
        const intrinsicWidth = optimized?.width
        const intrinsicHeight = optimized?.height
        if (intrinsicWidth && intrinsicHeight) {
          const width = declaredWidth ?? intrinsicWidth
          const height = declaredHeight ?? Math.round((width * intrinsicHeight) / intrinsicWidth)
          properties.width = width
          properties.height = height
        } else {
          // Intrinsic size unknown (unresolvable source, or a degenerate declared
          // width that produced no usable variant). Emit no dimension rather than
          // an invalid one — "auto" is not a legal width/height attribute value.
          if (properties.width === "auto") delete properties.width
          if (properties.height === "auto") delete properties.height
        }

        node.properties = properties
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
