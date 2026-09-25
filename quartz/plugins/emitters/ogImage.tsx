import { QuartzEmitterPlugin } from "../types"
import { i18n } from "../../i18n"
import { unescapeHTML } from "../../util/escape"
import {
  FullSlug,
  getAllSegmentPrefixes,
  getFileExtension,
  isAbsoluteURL,
  joinSegments,
  QUARTZ,
} from "../../util/path"
import {
  CARD_PADDING_Y,
  ImageOptions,
  PHOTO_MAX_WIDTH,
  SocialImageOptions,
  SocialImagePhoto,
  defaultImage,
  getSatoriFonts,
} from "../../util/og"
import { getCustomTitle } from "../../util/tagTitles"
import sharp from "sharp"
import satori, { SatoriOptions } from "satori"
import { loadEmoji, getIconCode } from "../../util/emoji"
import { Readable } from "stream"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { QuartzPluginData } from "../vfile"
import fs from "node:fs/promises"
import path from "node:path"
import chalk from "chalk"

const defaultOptions: SocialImageOptions = {
  colorScheme: "lightMode",
  width: 1200,
  height: 630,
  imageStructure: defaultImage,
  excludeRoot: false,
}

/**
 * Generates social image (OG/twitter standard) and saves it as `.webp` inside the public folder
 * @param opts options for generating image
 */
async function generateSocialImage(
  { cfg, description, fonts, title, fileData }: ImageOptions,
  userOpts: SocialImageOptions,
  outputDir: string,
): Promise<Readable> {
  const { width, height } = userOpts
  const logoPath = joinSegments(QUARTZ, "static", "ornament-j.png")
  let logoBase64: string | undefined = undefined
  try {
    const logoData = await fs.readFile(logoPath)
    logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`
  } catch (err) {
    console.warn(chalk.yellow(`Warning: Could not find current site logo at ${logoPath}`))
  }

  let photo: SocialImagePhoto | undefined
  const cardImage = fileData.cardImage
  if (cardImage?.startsWith("/")) {
    try {
      const imagePath = path.join(outputDir, cardImage.replace(/^\/+/, ""))
      const imageData = await fs.readFile(imagePath)
      // Satori's objectFit handling is unreliable, so size the photo to fit
      // the panel here (whole image, never cropped) and hand Satori a PNG
      // with exact intrinsic dimensions.
      const { data, info } = await sharp(imageData)
        .resize({
          width: PHOTO_MAX_WIDTH,
          height: height - CARD_PADDING_Y * 2,
          fit: "inside",
        })
        .png()
        .toBuffer({ resolveWithObject: true })
      photo = {
        src: `data:image/png;base64,${data.toString("base64")}`,
        width: info.width,
        height: info.height,
      }
    } catch {
      // Pages without a readable card image get the text-only card.
    }
  }

  const imageComponent = userOpts.imageStructure({
    cfg,
    userOpts,
    title,
    description,
    fonts,
    fileData,
    iconBase64: logoBase64,
    photo,
  })

  const svg = await satori(imageComponent, {
    width,
    height,
    fonts,
    loadAdditionalAsset: async (languageCode: string, segment: string) => {
      if (languageCode === "emoji") {
        return await loadEmoji(getIconCode(segment))
      }

      return languageCode
    },
  })

  return sharp(Buffer.from(svg)).webp({ quality: 70 })
}

async function processOgImage(
  ctx: BuildCtx,
  fileData: QuartzPluginData,
  fonts: SatoriOptions["fonts"],
  fullOptions: SocialImageOptions,
) {
  const cfg = ctx.cfg.configuration
  const slug = fileData.slug!
  // The home card would otherwise just repeat the wordmark; use the tagline.
  const title =
    slug === "index"
      ? (siteTagline(cfg.pageTitleSuffix) ?? cfg.pageTitle)
      : (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title)
  const description =
    fileData.frontmatter?.socialDescription ??
    fileData.frontmatter?.description ??
    unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

  const stream = await generateSocialImage(
    {
      title,
      description,
      fonts,
      cfg,
      fileData,
    },
    fullOptions,
    ctx.argv.output,
  )

  return write({
    ctx,
    content: stream,
    slug: `${slug}-og-image` as FullSlug,
    ext: ".webp",
  })
}

// " | Northeast Larder - Fermentation & Regional Food Lab" -> "Fermentation & Regional Food Lab"
function siteTagline(suffix: string | undefined): string | undefined {
  const tagline = suffix?.split(" - ").slice(1).join(" - ").trim()
  return tagline || undefined
}

const DEFAULT_CARD_SLUG = "static/og-image"

/**
 * Cards for pages that have no source file: one per tag listing, plus a
 * site-wide default used by folder listings and anything else virtual.
 */
async function* processVirtualOgImages(
  ctx: BuildCtx,
  allFiles: QuartzPluginData[],
  fonts: SatoriOptions["fonts"],
  fullOptions: SocialImageOptions,
) {
  const cfg = ctx.cfg.configuration
  const tags = new Set(
    allFiles.flatMap((data) => data.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes),
  )
  const cards: { slug: string; title: string }[] = [
    { slug: DEFAULT_CARD_SLUG, title: siteTagline(cfg.pageTitleSuffix) ?? cfg.pageTitle },
    { slug: "tags/index", title: i18n(cfg.locale).pages.tagContent.tagIndex },
    ...[...tags].map((tag) => ({ slug: joinSegments("tags", tag), title: getCustomTitle(tag) })),
  ]

  for (const card of cards) {
    const fileData = { slug: card.slug } as QuartzPluginData
    const stream = await generateSocialImage(
      { title: card.title, description: "", fonts, cfg, fileData },
      fullOptions,
      ctx.argv.output,
    )
    yield write({
      ctx,
      content: stream,
      slug: (card.slug === DEFAULT_CARD_SLUG ? card.slug : `${card.slug}-og-image`) as FullSlug,
      ext: ".webp",
    })
  }
}

export const CustomOgImagesEmitterName = "CustomOgImages"
export const CustomOgImages: QuartzEmitterPlugin<Partial<SocialImageOptions>> = (userOpts) => {
  const fullOptions = { ...defaultOptions, ...userOpts }

  return {
    name: CustomOgImagesEmitterName,
    getQuartzComponents() {
      return []
    },
    async *emit(ctx, content, _resources) {
      const cfg = ctx.cfg.configuration
      const headerFont = cfg.theme.typography.header
      const bodyFont = cfg.theme.typography.body
      const fonts = await getSatoriFonts(headerFont, bodyFont)

      for (const [_tree, vfile] of content) {
        if (vfile.data.frontmatter?.socialImage !== undefined) continue
        yield processOgImage(ctx, vfile.data, fonts, fullOptions)
      }

      yield* processVirtualOgImages(
        ctx,
        content.map(([_tree, vfile]) => vfile.data),
        fonts,
        fullOptions,
      )
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      const cfg = ctx.cfg.configuration
      const headerFont = cfg.theme.typography.header
      const bodyFont = cfg.theme.typography.body
      const fonts = await getSatoriFonts(headerFont, bodyFont)

      // find all slugs that changed or were added
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        if (changeEvent.file.data.frontmatter?.socialImage !== undefined) continue
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield processOgImage(ctx, changeEvent.file.data, fonts, fullOptions)
        }
      }
    },
    externalResources: (ctx) => {
      if (!ctx.cfg.configuration.baseUrl) {
        return {}
      }

      const baseUrl = ctx.cfg.configuration.baseUrl
      return {
        additionalHead: [
          (pageData) => {
            const isRealFile = pageData.filePath !== undefined
            let userDefinedOgImagePath = pageData.frontmatter?.socialImage

            if (userDefinedOgImagePath) {
              userDefinedOgImagePath = isAbsoluteURL(userDefinedOgImagePath)
                ? userDefinedOgImagePath
                : `https://${baseUrl}/static/${userDefinedOgImagePath}`
            }

            const isTagPage = pageData.slug?.startsWith("tags/") ?? false
            const generatedOgImagePath =
              isRealFile || isTagPage
                ? `https://${baseUrl}/${pageData.slug!}-og-image.webp`
                : undefined
            const defaultOgImagePath = `https://${baseUrl}/${DEFAULT_CARD_SLUG}.webp`
            const ogImagePath = userDefinedOgImagePath ?? generatedOgImagePath ?? defaultOgImagePath
            const ogImageMimeType = `image/${(getFileExtension(ogImagePath) ?? ".png").slice(1)}`
            return (
              <>
                {!userDefinedOgImagePath && (
                  <>
                    <meta property="og:image:width" content={fullOptions.width.toString()} />
                    <meta property="og:image:height" content={fullOptions.height.toString()} />
                  </>
                )}

                <meta property="og:image" content={ogImagePath} />
                <meta property="og:image:url" content={ogImagePath} />
                <meta name="twitter:image" content={ogImagePath} />
                <meta property="og:image:type" content={ogImageMimeType} />
              </>
            )
          },
        ],
      }
    },
  }
}
