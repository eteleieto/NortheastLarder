import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const UnderConstruction: QuartzComponent = ({ cfg, fileData }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname
  const pageTitle = fileData.frontmatter?.title

  return (
    <article class="popover-hint under-construction">
      <h1>{pageTitle ? `${pageTitle} is under construction` : "This page is under construction"}</h1>
      <p>
        This note is being edited right now. We&apos;ll usually update this within a day. It exists
        in the notebook and still appears in the graph, but the write-up is not ready to read yet.
      </p>
      <p>
        <a href={baseDir} class="internal">
          {i18n(cfg.locale).pages.error.home}
        </a>
      </p>
    </article>
  )
}

UnderConstruction.css = `
.under-construction {
  p {
    color: var(--dark);
  }
}
`

export default (() => UnderConstruction) satisfies QuartzComponentConstructor
