import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import path from "path"
import fs from "fs"
import { Root } from "hast"
import { visit } from "unist-util-visit"
import { glob } from "../../util/glob"
import { Argv } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"
import { ProcessedContent } from "../vfile"

// Raster sources are the only things we prune. By the time emitters run,
// prepareArticleImages/prepareCardThumbnails have already rewritten the trees to
// point at the resized `/static/display` and `/static/thumbs` variants, so the
// multi-megabyte camera originals they were derived from are dead weight in the
// deploy. Anything else (PDFs, video, SVG, fonts) is copied as before.
const RASTER_EXT = /\.(png|jpe?g|webp|gif|heic|avif)$/i

// Attributes that can point at a copied asset.
const URL_PROPS = ["src", "href", "poster"] as const

const filesToCopy = async (argv: Argv, cfg: QuartzConfig) => {
  // glob all non MD files in content folder and copy it over
  return await glob("**", argv.directory, ["**/*.md", ...cfg.configuration.ignorePatterns])
}

/** Normalize a markup URL to the same shape as a slugified content path. */
function normalizeRef(value: string): string | undefined {
  if (!value || /^[a-z]+:/i.test(value) || value.startsWith("#")) return undefined

  let ref = value.split("#")[0].split("?")[0]
  try {
    ref = decodeURIComponent(ref)
  } catch {
    // leave malformed escapes as-is
  }

  ref = ref
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
  ref = ref.replace(/^content\//i, "")
  return ref.length > 0 ? ref : undefined
}

/**
 * Every asset path still reachable from the rendered output, in slugified form.
 * Built from the final trees, so an image that was swapped for a resized variant
 * correctly drops out of the set.
 */
function collectReferencedAssets(content: ProcessedContent[]): Set<string> {
  const referenced = new Set<string>()

  const add = (value: unknown) => {
    if (typeof value !== "string") return
    const ref = normalizeRef(value)
    if (ref) referenced.add(ref)
  }

  for (const [tree, file] of content) {
    visit(tree as Root, "element", (node) => {
      for (const prop of URL_PROPS) {
        add(node.properties?.[prop])
      }

      const srcset = node.properties?.srcSet ?? node.properties?.srcset
      if (typeof srcset === "string") {
        for (const candidate of srcset.split(",")) {
          add(candidate.trim().split(/\s+/)[0])
        }
      }
    })

    // cardImage falls back to the untouched original when a thumbnail could not
    // be produced, so it has to be treated as a live reference.
    add(file.data.cardImage)
  }

  return referenced
}

const copyFile = async (argv: Argv, fp: FilePath) => {
  const src = joinSegments(argv.directory, fp) as FilePath

  const name = slugifyFilePath(fp)
  const dest = joinSegments(argv.output, name) as FilePath

  // ensure dir exists
  const dir = path.dirname(dest) as FilePath
  await fs.promises.mkdir(dir, { recursive: true })

  await fs.promises.copyFile(src, dest)
  return dest
}

export const Assets: QuartzEmitterPlugin = () => {
  return {
    name: "Assets",
    async *emit({ argv, cfg }, content) {
      const fps = await filesToCopy(argv, cfg)
      const referenced = collectReferencedAssets(content)

      for (const fp of fps) {
        if (RASTER_EXT.test(fp) && !referenced.has(slugifyFilePath(fp))) continue
        yield copyFile(argv, fp)
      }
    },
    async *partialEmit(ctx, content, _resources, changeEvents) {
      const referenced = collectReferencedAssets(content)

      for (const changeEvent of changeEvents) {
        const ext = path.extname(changeEvent.path)
        if (ext === ".md") continue

        if (changeEvent.type === "add" || changeEvent.type === "change") {
          if (
            RASTER_EXT.test(changeEvent.path) &&
            !referenced.has(slugifyFilePath(changeEvent.path))
          )
            continue
          yield copyFile(ctx.argv, changeEvent.path)
        } else if (changeEvent.type === "delete") {
          const name = slugifyFilePath(changeEvent.path)
          const dest = joinSegments(ctx.argv.output, name) as FilePath
          await fs.promises.rm(dest, { force: true })
        }
      }
    },
  }
}
