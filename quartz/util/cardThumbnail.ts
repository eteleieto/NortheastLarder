import { createHash } from "crypto"
import fs from "fs"
import path from "path"
import sharp from "sharp"
import { BuildCtx } from "./ctx"
import { FilePath, FullSlug, slugifyFilePath } from "./path"

const THUMB_WIDTH = 640
const THUMB_QUALITY = 80

const sourcePathIndex = new WeakMap<BuildCtx, Map<string, string>>()
const thumbCache = new WeakMap<BuildCtx, Map<string, string>>()

function getThumbCache(ctx: BuildCtx) {
  let cache = thumbCache.get(ctx)
  if (!cache) {
    cache = new Map()
    thumbCache.set(ctx, cache)
  }
  return cache
}

export function thumbPathForSource(sourcePath: string): string {
  const hash = createHash("sha256").update(sourcePath).digest("hex").slice(0, 16)
  return `/static/thumbs/${hash}.webp`
}

async function buildSourcePathIndex(ctx: BuildCtx): Promise<Map<string, string>> {
  const existing = sourcePathIndex.get(ctx)
  if (existing) return existing

  const index = new Map<string, string>()
  const contentRoot = path.isAbsolute(ctx.argv.directory)
    ? ctx.argv.directory
    : path.join(process.cwd(), ctx.argv.directory)
  const imageExt = /\.(png|jpe?g|webp|gif|heic|avif)$/i

  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        const stats = await fs.promises.stat(full)
        if (stats.isDirectory()) {
          await walk(full)
          continue
        }
      }
      if (imageExt.test(entry.name)) {
        const rel = path.relative(contentRoot, full).replace(/\\/g, "/") as FilePath
        index.set(slugifyFilePath(rel), full)
      }
    }
  }

  await walk(contentRoot)
  sourcePathIndex.set(ctx, index)
  return index
}

function slugFromImageSrc(pageSlug: FullSlug, imageSrc: string): string {
  if (imageSrc.startsWith("/")) {
    return imageSrc.slice(1)
  }
  if (imageSrc.startsWith("../") || imageSrc.startsWith("./")) {
    return imageSrc.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "")
  }
  return imageSrc
}

export async function resolveImageSourcePath(
  ctx: BuildCtx,
  pageSlug: FullSlug,
  imageSrc: string,
): Promise<string | null> {
  const index = await buildSourcePathIndex(ctx)
  const key = slugFromImageSrc(pageSlug, imageSrc)
  return index.get(key) ?? null
}

export async function ensureCardThumbnail(
  ctx: BuildCtx,
  pageSlug: FullSlug,
  imageSrc: string,
): Promise<string | null> {
  const sourcePath = await resolveImageSourcePath(ctx, pageSlug, imageSrc)
  if (!sourcePath) return imageSrc.startsWith("/") ? imageSrc : null

  const cache = getThumbCache(ctx)
  const cached = cache.get(sourcePath)
  if (cached) return cached

  const thumbUrl = thumbPathForSource(sourcePath)
  const outputRoot = path.isAbsolute(ctx.argv.output)
    ? ctx.argv.output
    : path.join(process.cwd(), ctx.argv.output)
  const thumbOut = path.join(outputRoot, thumbUrl.replace(/^\//, ""))

  await fs.promises.mkdir(path.dirname(thumbOut), { recursive: true })

  if (!fs.existsSync(thumbOut)) {
    try {
      await sharp(sourcePath)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbOut)
    } catch {
      return imageSrc.startsWith("/") ? imageSrc : `/${slugFromImageSrc(pageSlug, imageSrc)}`
    }
  }

  cache.set(sourcePath, thumbUrl)
  return thumbUrl
}
