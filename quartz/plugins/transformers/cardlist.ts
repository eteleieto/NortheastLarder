import { QuartzTransformerPlugin } from "../types"
import { transformInternalLink } from "../../util/path"
import { visit } from "unist-util-visit"
// @ts-ignore
import cardListScript from "../../components/scripts/cardlist.inline"

export interface Options {
  delimiter: string
}

const defaultOptions: Options = {
  delimiter: "||",
}

export const CardListTransformer: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "CardListTransformer",
    textTransform(_ctx, src) {
      // Process the raw markdown text before parsing
      // Support both || and ||| patterns
      const cardListRegex = /^(\|\|\||\|\|)\s*\n([\s\S]*?)\n\s*(\|\|\||\|\|)$/gm
      
      return src.replace(cardListRegex, (match: string, openPipes: string, content: string, closePipes: string) => {
        // Check if both opening and closing use triple pipes (no images)
        const noImages = openPipes === "|||" && closePipes === "|||"
        
        // Extract wikilinks from the content
        const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
        const pageLinks = Array.from(content.matchAll(wikiLinkRegex))
          .map(linkMatch => linkMatch[1].trim())
          .filter(link => link.length > 0)

        if (pageLinks.length > 0) {
          // Return HTML that will be processed later
          const hiddenLinks = pageLinks.map(p => `<a href="${p}"></a>`).join("\n")
          return `<div class="grid-container" data-pages='${JSON.stringify(pageLinks)}' ${noImages ? 'data-no-images="true"' : ''}>
  <div class="card-list-loading">Loading cards...</div>
</div>

<div class="card-list-hidden-links" style="display:none">
${hiddenLinks}
</div>`
        }
        
        // If no valid links found, return original content
        return match
      })
    },
    externalResources() {
      return {
        js: [
          {
            loadTime: "afterDOMReady",
            contentType: "inline",
            script: cardListScript,
          },
        ],
      }
    },
    htmlPlugins() {
      return [
        () => {
          return (tree: any, file: any) => {
            const outgoing = new Set<string>(file.data.links ?? [])

            visit(tree, "element", (node: any) => {
              if (node.tagName === "div" && node.properties && node.properties["data-pages"]) {
                try {
                  const pagesAttr = node.properties["data-pages"] as string
                  const pages: string[] = JSON.parse(pagesAttr)
                  pages.forEach((p) => {
                    let rel = transformInternalLink(p) as string
                    // remove leading ./ if present
                    if (rel.startsWith("./")) {
                      rel = rel.slice(2)
                    }
                    // If ends with index, trim
                    if (rel.endsWith("/index")) {
                      rel = rel.slice(0, -5)
                    }
                    // remove leading slash for simple slug
                    if (rel.startsWith("/")) {
                      rel = rel.slice(1)
                    }
                    outgoing.add(rel)
                  })
                } catch (_) {
                  // ignore json parse errors
                }
              }
            })

            file.data.links = [...outgoing]
          }
        },
      ]
    }
  }
} 