import { QuartzTransformerPlugin } from "../types"
import { Root } from "hast"
import { visit } from "unist-util-visit"

export const ImageSEO: QuartzTransformerPlugin = () => {
  return {
    name: "ImageSEO",
    htmlPlugins() {
      return [
        () => {
          return (tree: Root) => {
            visit(tree, "element", (node) => {
              if (node.tagName === "img") {
                // Add lazy loading for performance
                if (!node.properties?.loading) {
                  node.properties = { ...node.properties, loading: "lazy" }
                }
                
                // Improve alt text if it's generic or missing
                const alt = node.properties?.alt as string
                const src = node.properties?.src as string
                
                if (!alt || alt === "" || alt === "image") {
                  // Generate better alt text from filename
                  const filename = src?.split('/').pop()?.split('.')[0]
                  if (filename) {
                    const betterAlt = filename
                      .replace(/[-_]/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                    node.properties = { ...node.properties, alt: betterAlt }
                  }
                }
                
                // Add decoding="async" for better performance
                node.properties = { ...node.properties, decoding: "async" }
              }
            })
          }
        }
      ]
    }
  }
}
