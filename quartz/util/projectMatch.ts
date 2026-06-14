import { QuartzPluginData } from "../plugins/vfile"
import { slugifyFilePath, FilePath } from "./path"

export function normalizeProjectRef(project: unknown): string | null {
  if (typeof project !== "string") return null
  const cleaned = project.replace(/[\[\]]/g, "").trim()
  return cleaned.length > 0 ? cleaned : null
}

function getProjectIdentifiers(projectPage: QuartzPluginData): Set<string> {
  const ids = new Set<string>()
  const add = (value: string | undefined) => {
    if (!value) return
    ids.add(value.trim().toLowerCase())
  }

  add(projectPage.frontmatter?.title)
  add(projectPage.slug)
  add(projectPage.relativePath?.split("/").pop()?.replace(/\.md$/, ""))

  const basename = projectPage.relativePath?.split("/").pop()?.replace(/\.md$/, "")
  if (basename) {
    add(slugifyFilePath(basename as FilePath, true))
  }

  return ids
}

export function pageBelongsToProject(
  page: QuartzPluginData,
  projectPage: QuartzPluginData,
): boolean {
  const projectRef = normalizeProjectRef(page.frontmatter?.project)
  if (!projectRef) return false

  const identifiers = getProjectIdentifiers(projectPage)
  return identifiers.has(projectRef.toLowerCase())
}

export function getProjectPages(
  projectPage: QuartzPluginData,
  allFiles: QuartzPluginData[],
): QuartzPluginData[] {
  return allFiles.filter((page) => {
    if (page.slug === projectPage.slug) return false
    if (page.slug?.startsWith("tags/")) return false
    return pageBelongsToProject(page, projectPage)
  })
}

export function isProjectPage(fileData: QuartzPluginData): boolean {
  const tags = fileData.frontmatter?.tags
  if (!tags) return false
  if (typeof tags === "string") return tags === "PROJECT"
  if (Array.isArray(tags)) return tags.includes("PROJECT")
  return false
}
