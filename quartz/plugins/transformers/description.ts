import { Root as HTMLRoot } from "hast"
import { QuartzTransformerPlugin } from "../types"
import { escapeHTML } from "../../util/escape"
import { cleanDescriptionText, extractBodyText } from "../../util/descriptionText"

export interface Options {
  descriptionLength: number
  maxDescriptionLength: number
  replaceExternalLinks: boolean
}

const defaultOptions: Options = {
  descriptionLength: 155, // Optimal for Google snippets
  maxDescriptionLength: 160, // Hard limit for SEO
  replaceExternalLinks: true,
}

const urlRegex = new RegExp(
  /(https?:\/\/)?(?<domain>([\da-z\.-]+)\.([a-z\.]{2,6})(:\d+)?)(?<path>[\/\w\.-]*)(\?[\/\w\.=&;-]*)?/,
  "g",
)

export const Description: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "Description",
    htmlPlugins() {
      return [
        () => {
          return async (tree: HTMLRoot, file) => {
            let frontMatterDescription = file.data.frontmatter?.description
            const pageTitle = file.data.frontmatter?.title as string | undefined
            let text = escapeHTML(extractBodyText(tree))

            if (opts.replaceExternalLinks) {
              frontMatterDescription = frontMatterDescription?.replace(
                urlRegex,
                "$<domain>" + "$<path>",
              )
              text = text.replace(urlRegex, "$<domain>" + "$<path>")
            }

            if (frontMatterDescription) {
              file.data.description = frontMatterDescription
              file.data.text = text
              return
            }

            const desc = cleanDescriptionText(text, pageTitle, opts.maxDescriptionLength)
            if (!desc) {
              file.data.text = text
              return
              // Leave description unset so Head uses i18n default
            }

            file.data.description = desc
            file.data.text = text
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    description: string
    text: string
  }
}
