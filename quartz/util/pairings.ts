import { FilePath, FullSlug, SimpleSlug, simplifySlug, slugifyFilePath } from "./path"

export type Pairing = {
  label: string
  slug: SimpleSlug
}

const wikilinkPattern = /^\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]$/

export function parsePairings(value: unknown): Pairing[] {
  const entries = Array.isArray(value) ? value : value == null ? [] : [value]
  const pairings = new Map<SimpleSlug, Pairing>()

  for (const entry of entries) {
    if (typeof entry !== "string") continue

    const raw = entry.trim()
    if (!raw) continue

    const match = raw.match(wikilinkPattern)
    const target = (match?.[1] ?? raw).trim()
    const label = (match?.[2] ?? target).trim()
    if (!target || !label) continue

    const slug = simplifySlug(slugifyFilePath(target as FilePath) as FullSlug)
    pairings.set(slug, { label, slug })
  }

  return [...pairings.values()]
}
