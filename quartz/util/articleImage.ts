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

const displayCache = new WeakMap<BuildCtx, Map<string, string>>()

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
  const hash = createHash("sha256")
    .update(`${sourcePath}:${pixelWidth}`)
    .digest("hex")
    .slice(0, 16)
  return `/static/display/${hash}.webp`
}

export async function ensureDisplayImage(
  ctx: BuildCtx,
  pageSlug: FullSlug,
  imageSrc: string,
  displayWidth?: number,
): Promise<string | null> {
  const sourcePath = await resolveImageSourcePath(ctx, pageSlug, imageSrc)
  if (!sourcePath) return imageSrc.startsWith("/") ? imageSrc : null

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

  if (fs.existsSync(displayOut)) {
    const { size } = await fs.promises.stat(displayOut)
    if (size >= 200) {
      cache.set(cacheKey, displayUrl)
      return displayUrl
    }
    await fs.promises.unlink(displayOut)
  }

  if (!fs.existsSync(displayOut)) {
    try {
      await sharp(sourcePath)
        .rotate()
        .resize({ width: pixelWidth, withoutEnlargement: true })
        .webp({ quality: DISPLAY_QUALITY })
        .toFile(displayOut)
      const { size } = await fs.promises.stat(displayOut)
      if (size < 200) {
        await fs.promises.unlink(displayOut)
        return imageSrc.startsWith("/") ? imageSrc : null
      }
    } catch {
      return imageSrc.startsWith("/") ? imageSrc : null
    }
  }

  cache.set(cacheKey, displayUrl)
  return displayUrl
}
