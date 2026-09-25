import { promises as fs } from "fs"
import { FontWeight, SatoriOptions } from "satori/wasm"
import { GlobalConfiguration } from "../cfg"
import { QuartzPluginData } from "../plugins/vfile"
import { JSXInternal } from "preact/src/jsx"
import { FontSpecification, getFontSpecificationName, ThemeKey } from "./theme"
import path from "path"
import { QUARTZ } from "./path"
import chalk from "chalk"

const defaultHeaderWeight = [700]
const defaultBodyWeight = [400]

export async function getSatoriFonts(headerFont: FontSpecification, bodyFont: FontSpecification) {
  // Get all weights for header and body fonts
  const headerWeights: FontWeight[] = (
    typeof headerFont === "string"
      ? defaultHeaderWeight
      : (headerFont.weights ?? defaultHeaderWeight)
  ) as FontWeight[]
  const bodyWeights: FontWeight[] = (
    typeof bodyFont === "string" ? defaultBodyWeight : (bodyFont.weights ?? defaultBodyWeight)
  ) as FontWeight[]

  const headerFontName = typeof headerFont === "string" ? headerFont : headerFont.name
  const bodyFontName = typeof bodyFont === "string" ? bodyFont : bodyFont.name

  // Fetch fonts for all weights and convert to satori format in one go
  const headerFontPromises = headerWeights.map(async (weight) => {
    const data = await fetchTtf(headerFontName, weight)
    if (!data) return null
    return {
      name: headerFontName,
      data,
      weight,
      style: "normal" as const,
    }
  })

  const bodyFontPromises = bodyWeights.map(async (weight) => {
    const data = await fetchTtf(bodyFontName, weight)
    if (!data) return null
    return {
      name: bodyFontName,
      data,
      weight,
      style: "normal" as const,
    }
  })

  const [headerFonts, bodyFonts] = await Promise.all([
    Promise.all(headerFontPromises),
    Promise.all(bodyFontPromises),
  ])

  // Filter out any failed fetches and combine header and body fonts
  const fonts: SatoriOptions["fonts"] = [
    ...headerFonts.filter((font): font is NonNullable<typeof font> => font !== null),
    ...bodyFonts.filter((font): font is NonNullable<typeof font> => font !== null),
  ]

  return fonts
}

/**
 * Get the `.ttf` file of a google font
 * @param fontName name of google font
 * @param weight what font weight to fetch font
 * @returns `.ttf` file of google font
 */
export async function fetchTtf(
  rawFontName: string,
  weight: FontWeight,
): Promise<Buffer<ArrayBufferLike> | undefined> {
  const fontName = rawFontName.replaceAll(" ", "+")
  const cacheKey = `${fontName}-${weight}`
  const cacheDir = path.join(QUARTZ, ".quartz-cache", "fonts")
  const cachePath = path.join(cacheDir, cacheKey)

  // Check if font exists in cache
  try {
    await fs.access(cachePath)
    return fs.readFile(cachePath)
  } catch (error) {
    // ignore errors and fetch font
  }

  // Get css file from google fonts
  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}`,
  )
  const css = await cssResponse.text()

  // Extract .ttf url from css file
  const urlRegex = /url\((https:\/\/fonts.gstatic.com\/s\/.*?.ttf)\)/g
  const match = urlRegex.exec(css)

  if (!match) {
    console.log(
      chalk.yellow(
        `\nWarning: Failed to fetch font ${rawFontName} with weight ${weight}, got ${cssResponse.statusText}`,
      ),
    )
    return
  }

  // fontData is an ArrayBuffer containing the .ttf file data
  const fontResponse = await fetch(match[1])
  const fontData = Buffer.from(await fontResponse.arrayBuffer())
  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(cachePath, fontData)

  return fontData
}

export type SocialImageOptions = {
  /**
   * What color scheme to use for image generation (uses colors from config theme)
   */
  colorScheme: ThemeKey
  /**
   * Height to generate image with in pixels (should be around 630px)
   */
  height: number
  /**
   * Width to generate image with in pixels (should be around 1200px)
   */
  width: number
  /**
   * Whether to use the auto generated image for the root path ("/", when set to false) or the default og image (when set to true).
   */
  excludeRoot: boolean
  /**
   * JSX to use for generating image. See satori docs for more info (https://github.com/vercel/satori)
   */
  imageStructure: (
    options: ImageOptions & {
      userOpts: UserOpts
      iconBase64?: string
      photo?: SocialImagePhoto
    },
  ) => JSXInternal.Element
}

export type UserOpts = Omit<SocialImageOptions, "imageStructure">

/** A page photo already resized (never cropped) to fit the card's photo panel. */
export type SocialImagePhoto = {
  src: string
  width: number
  height: number
}

export type ImageOptions = {
  /**
   * what title to use as header in image
   */
  title: string
  /**
   * what description to use as body in image
   */
  description: string
  /**
   * header + body font to be used when generating satori image (as promise to work around sync in component)
   */
  fonts: SatoriOptions["fonts"]
  /**
   * `GlobalConfiguration` of quartz (used for theme/typography)
   */
  cfg: GlobalConfiguration
  /**
   * full file data of current page
   */
  fileData: QuartzPluginData
}

// Card geometry shared by the template and the emitter (which sizes photos to
// fit the panel before Satori sees them).
export const CARD_PADDING_X = 64
export const CARD_PADDING_Y = 56
export const PHOTO_MAX_WIDTH = 400
const PHOTO_GAP = 48

// Newsreader's average advance width is ~0.43em; a little headroom keeps the
// estimate from under-counting lines on wide-letter titles.
const AVG_CHAR_WIDTH_EM = 0.46
const TITLE_SIZES = [80, 68, 60]

function estimateLines(text: string, fontSize: number, width: number): number {
  const maxChars = Math.max(1, Math.floor(width / (fontSize * AVG_CHAR_WIDTH_EM)))
  let lines = 1
  let current = 0
  for (const word of text.split(/\s+/)) {
    const needed = current === 0 ? word.length : current + 1 + word.length
    if (needed <= maxChars) {
      current = needed
    } else {
      lines += 1
      current = word.length
    }
  }
  return lines
}

/** One title size for nearly every card; step down only when it can't fit. */
export function pickTitleSize(title: string, width: number, maxLines: number): number {
  return (
    TITLE_SIZES.find((size) => estimateLines(title, size, width) <= maxLines) ??
    TITLE_SIZES[TITLE_SIZES.length - 1]
  )
}

// Social cards intentionally stay quieter than the page metadata: the card
// should be recognizable at a glance when it is reduced inside a link preview.
export const defaultImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  userOpts,
  title,
  iconBase64: logoBase64,
  photo,
}) => {
  const { colorScheme, width } = userOpts
  const colors = cfg.theme.colors[colorScheme]
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)
  const headerFont = getFontSpecificationName(cfg.theme.typography.header)

  const contentWidth = width - CARD_PADDING_X * 2
  const titleWidth = photo ? contentWidth - photo.width - PHOTO_GAP : contentWidth
  const maxLines = photo ? 3 : 2
  const titleSize = pickTitleSize(title, titleWidth, maxLines)

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        backgroundColor: colors.light,
        padding: `${CARD_PADDING_Y}px ${CARD_PADDING_X}px`,
        fontFamily: bodyFont,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: titleWidth,
        }}
      >
        {/* Site mark and wordmark, large enough to read in a reduced preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {logoBase64 && (
            <img src={logoBase64} width={96} height={60} style={{ objectFit: "contain" }} />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: colors.dark,
              fontFamily: headerFont,
              fontSize: 38,
              lineHeight: 0.95,
            }}
          >
            <span>Northeast</span>
            <span>Larder</span>
          </div>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: titleSize,
            fontFamily: bodyFont,
            fontWeight: 500,
            color: colors.dark,
            lineHeight: 1.08,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: maxLines,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Page photo in its own panel, shown whole at its natural aspect ratio */}
      {photo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginLeft: PHOTO_GAP,
            width: photo.width,
          }}
        >
          <img
            src={photo.src}
            width={photo.width}
            height={photo.height}
            style={{ borderRadius: 6, border: `1px solid ${colors.lightgray}` }}
          />
        </div>
      )}
    </div>
  )
}
