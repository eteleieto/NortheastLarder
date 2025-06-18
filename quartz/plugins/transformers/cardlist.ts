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
        css: [
          {
            content: `
              .grid-container {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2rem;
                margin-top: 2rem;
              }
              
              @media all and (max-width: 1200px) {
                .grid-container {
                  grid-template-columns: repeat(2, 1fr);
                  gap: 1.5rem;
                }
              }
              
              @media all and (max-width: 800px) {
                .grid-container {
                  grid-template-columns: 1fr;
                  gap: 1rem;
                }
              }
              
              .grid-item-link {
                text-decoration: none;
                color: inherit;
                background-color: transparent;
                display: block;
              }
              
              .grid-item {
                border-radius: 8px 8px 0 0;
                overflow: hidden;
                background-color: var(--light);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                cursor: pointer;
                height: 100%;
                box-shadow: -4px 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid var(--darkgray);
              }
              
              .grid-item-link:hover .grid-item {
                transform: translateY(-2px);
                box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.1);
              }
              
              .grid-item-image-placeholder {
                height: 150px;
                background-color: var(--lightgray);
                position: relative;
                overflow: hidden;
                margin: 0;
                padding: 0;
                line-height: 0;
              }
              
              .grid-item-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
                display: block;
                margin: 0;
                padding: 0;
                border: none;
                vertical-align: top;
                transition: transform 0.2s ease;
              }
              
              .image-placeholder {
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, var(--lightgray) 0%, var(--gray) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--dark);
                font-size: 0.9rem;
                opacity: 0.6;
              }
              
              .image-placeholder::before {
                content: "🖼️";
                font-size: 1.5rem;
              }
              
              .grid-item-content {
                padding: 1rem;
              }
              
              .grid-item-meta {
                color: var(--gray);
                font-size: 0.75rem;
                margin-bottom: 0.5rem;
              }
              
              .grid-item-title {
                margin: 0 0 0.5rem 0;
                font-size: 1rem;
                line-height: 1.3;
                color: var(--dark);
              }
              
              .grid-item-link:hover .grid-item-title {
                color: var(--secondary);
              }
              
              .grid-item-description {
                color: var(--darkgray);
                font-size: 0.8rem;
                line-height: 1.4;
                margin: 0;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
              }
              
              .card-list-loading {
                text-align: center;
                padding: 2rem;
                color: var(--gray);
                grid-column: 1 / -1;
              }
              
              .grid-item-link.internal {
                background-color: transparent;
                padding: 0;
                border-radius: 0;
              }
              
              .grid-item-link.internal:hover {
                background-color: transparent;
              }
              
              .card-list-error {
                text-align: center;
                padding: 2rem;
                color: var(--darkgray);
                background-color: var(--lightgray);
                border-radius: 8px;
                grid-column: 1 / -1;
              }
              
              /* No-images layout styles */
              .grid-container[data-no-images="true"] .grid-item {
                border-radius: 8px;
                border: 1px solid var(--darkgray);
              }
              
              .grid-container[data-no-images="true"] .grid-item-image-placeholder {
                display: none;
              }
              
              .grid-container[data-no-images="true"] .grid-item-content {
                padding: 1.5rem;
              }
            `,
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