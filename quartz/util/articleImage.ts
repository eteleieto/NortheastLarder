import { createHash } from "crypto"
import fs from "fs"
import path from "path"
import sharp from "sharp"
import { BuildCtx } from "./ctx"
import { FullSlug } from "./path"
import { resolveImageSourcePath } from "./cardThumbnail"

const DEFAULT_DISPLAY_WIDTH = 800
const RETINA_FACTOR = 2
const MAX_OUTPUT_WIDTH = 1200
const DISPLAY_QUALITY = 82

/**
 * The emitted image plus its intrinsic pixel size. Callers need the dimensions
 * to write real `width`/`height` attributes, which is what lets the browser
 * reserve the right box before a lazy image decodes.
 */
export interface DisplayImage {
  url: string
  width?: number
  height?: number
}

const displayCache = new WeakMap<BuildCtx, Map<string, DisplayImage>>()

function getDisplayCache(ctx: BuildCtx) {
  let cache = displayCache.get(ctx)
  if (!cache) {
    cache = new Map()
    displayCache.set(ctx, cache)
  }
  return cache
}

function targetPixelWidth(displayWidth: number): number {
  const width = displayWidth > 0 ? displayWidth : DEFAULT_DISPLAY_WIDTH
  return Math.min(Math.round(width * RETINA_FACTOR), MAX_OUTPUT_WIDTH)
}

export function displayPathForSource(sourcePath: string, pixelWidth: number): string {
  const hash = createHash("sha256").update(`${sourcePath}:${pixelWidth}`).digest("hex").slice(0, 16)
  return `/static/display/${hash}.webp`
}

// Fall back to the untouched source when we cannot produce a display variant;
// no dimensions are known in that case, so callers leave the attributes alone.
function passthrough(imageSrc: string): DisplayImage | null {
  return imageSrc.startsWith("/") ? { url: imageSrc } : null
}

export async function ensureDisplayImage(
  ctx: BuildCtx,
  pageSlug: FullSlug,
  imageSrc: string,
  displayWidth?: number,
): Promise<DisplayImage | null> {
  const sourcePath = await resolveImageSourcePath(ctx, pageSlug, imageSrc)
  if (!sourcePath) return passthrough(imageSrc)

  const pixelWidth = targetPixelWidth(displayWidth ?? DEFAULT_DISPLAY_WIDTH)
  const cacheKey = `${sourcePath}:${pixelWidth}`
  const cache = getDisplayCache(ctx)
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const displayUrl = displayPathForSource(sourcePath, pixelWidth)
  const outputRoot = path.isAbsolute(ctx.argv.output)
    ? ctx.argv.output
    : path.join(process.cwd(), ctx.argv.output)
  const displayOut = path.join(outputRoot, displayUrl.replace(/^\//, ""))

  await fs.promises.mkdir(path.dirname(displayOut), { recursive: true })

  let result: DisplayImage | null = null

  if (fs.existsSync(displayOut)) {
    const { size } = await fs.promises.stat(displayOut)
    if (size >= 200) {
      // Reused from a previous build — read the dimensions back off disk.
      try {
        const { width, height } = await sharp(displayOut).metadata()
        result = { url: displayUrl, width, height }
      } catch {
        result = { url: displayUrl }
      }
    } else {
      await fs.promises.unlink(displayOut)
    }
  }

  if (!result) {
    try {
      // `.rotate()` bakes in EXIF orientation, so the output dimensions can be
      // transposed relative to the source. Trust what sharp actually wrote.
      const info = await sharp(sourcePath)
        .rotate()
        .resize({ width: pixelWidth, withoutEnlargement: true })
        .webp({ quality: DISPLAY_QUALITY })
        .toFile(displayOut)
      const { size } = await fs.promises.stat(displayOut)
      if (size < 200) {
        await fs.promises.unlink(displayOut)
        return passthrough(imageSrc)
      }
      result = { url: displayUrl, width: info.width, height: info.height }
    } catch {
      return passthrough(imageSrc)
    }
  }

  cache.set(cacheKey, result)
  return result
}
