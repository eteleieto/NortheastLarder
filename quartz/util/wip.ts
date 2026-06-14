import path from "path"
import { QuartzPluginData } from "../plugins/vfile"

export function isWipPage(fileData: QuartzPluginData): boolean {
  const relativePath = fileData.relativePath
  if (!relativePath) return false

  const basename = path.posix.basename(relativePath)
  return basename.startsWith("(WIP)")
}
