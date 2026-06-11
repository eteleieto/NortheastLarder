import { Root } from "hast"
import { BuildCtx } from "./ctx"
import { getCardImage } from "./cardImage"
import { ensureCardThumbnail } from "./cardThumbnail"
import { ProcessedContent } from "../plugins/vfile"

export async function prepareCardThumbnails(ctx: BuildCtx, content: ProcessedContent[]) {
  for (const [tree, file] of content) {
    if (!file.data.slug) continue

    const imageSrc = getCardImage({
      htmlAst: tree as Root,
      content: file.data.text,
      description: file.data.description,
    })
    if (!imageSrc) continue

    const thumb = await ensureCardThumbnail(ctx, file.data.slug, imageSrc)
    if (thumb) {
      file.data.cardImage = thumb
    }
  }
}

declare module "vfile" {
  interface DataMap {
    cardImage?: string
  }
}
