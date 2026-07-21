import sharp from "sharp"
import { joinSegments, QUARTZ, FullSlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"

export const Favicon: QuartzEmitterPlugin = () => ({
  name: "Favicon",
  async *emit({ argv }) {
    const iconPath = joinSegments(QUARTZ, "static", "logo.png")
    const faviconSize = 48
    const markSize = 28
    const faviconBackground = "#fefdfb"

    const mark = await sharp(iconPath)
      .resize(markSize, markSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    const backgroundCircle = Buffer.from(
      `<svg width="${faviconSize}" height="${faviconSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${faviconSize / 2}" cy="${faviconSize / 2}" r="${faviconSize / 2}" fill="${faviconBackground}" />
      </svg>`,
    )

    const faviconContent = sharp({
      create: {
        width: faviconSize,
        height: faviconSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: backgroundCircle, left: 0, top: 0 },
        {
          input: mark,
          left: Math.round((faviconSize - markSize) / 2),
          top: Math.round((faviconSize - markSize) / 2),
        },
      ])
      .toFormat("png")

    yield write({
      ctx: { argv } as BuildCtx,
      slug: "favicon" as FullSlug,
      ext: ".ico",
      content: faviconContent,
    })
  },
  async *partialEmit() {},
})
