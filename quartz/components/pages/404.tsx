import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // If baseUrl contains a pathname after the domain, use this as the home link
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint">
      <h1>This page has not been made yet.</h1>
      <p>It will still appear in the graph view.</p>
      <p>
        <a href={baseDir} class="internal">{i18n(cfg.locale).pages.error.home}</a>
      </p>
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
