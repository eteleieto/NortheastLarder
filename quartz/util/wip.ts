import { QuartzPluginData } from "../plugins/vfile"

export function stripWipPrefix(value: string): string {
  return value.replace(/^\s*\(WIP\)[\s-]*/i, "").trim()
}

export function stripWipMarkers(value: string): string {
  return value.replace(/\(WIP\)[\s-]*/gi, "").trim()
}

export function isWipPage(fileData: QuartzPluginData): boolean {
  const relativePath = fileData.relativePath
  if (!relativePath) return false

  const basename = relativePath.split("/").pop() ?? ""
  return basename.startsWith("(WIP)")
}
