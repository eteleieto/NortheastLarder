import { SimpleSlug } from "../../util/path"
import { parsePairings } from "../../util/pairings"
import { QuartzTransformerPlugin } from "../types"

export const PairingLinks: QuartzTransformerPlugin = () => {
  return {
    name: "PairingLinks",
    htmlPlugins() {
      return [
        () => {
          return (_tree, file) => {
            const outgoing = new Set<SimpleSlug>(file.data.links ?? [])
            for (const pairing of parsePairings(file.data.frontmatter?.pairing)) {
              outgoing.add(pairing.slug)
            }
            file.data.links = [...outgoing]
          }
        },
      ]
    },
  }
}
