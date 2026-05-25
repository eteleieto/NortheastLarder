import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { resolveRelative, SimpleSlug } from "../util/path"
// @ts-ignore
import script from "./scripts/newsletter.inline"

export default (() => {
  const Footer: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    const link = (slug: string, label: string) => (
      <a href={resolveRelative(fileData.slug!, slug as SimpleSlug)}>{label}</a>
    )
    return (
      <footer class={`${displayClass ?? ""}`}>
        <div class="footer-row">
          {link("About-Us", "About")}
          <span class="footer-sep" aria-hidden="true">·</span>
          {link("For-Restaurants", "Contact")}
          <span class="footer-sep" aria-hidden="true">·</span>
          {link("Documentation", "Documentation")}
          <span class="footer-sep" aria-hidden="true">·</span>
          {link("Bookshelf", "Bookshelf")}
          <span class="footer-sep" aria-hidden="true">·</span>
          <button type="button" class="graph-open footer-link">
            Graph
          </button>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a
            href="https://www.instagram.com/northeastlarder/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="mailto:info@northeastlarder.com">info@northeastlarder.com</a>
          <span class="footer-sep footer-sep-copy" aria-hidden="true">·</span>
          <span class="footer-meta">
            © {new Date().getFullYear()} · Built with{" "}
            <a href="https://quartz.jzhao.xyz/" target="_blank" rel="noopener noreferrer">
              Quartz
            </a>
          </span>
        </div>
      </footer>
    )
  }

  Footer.afterDOMLoaded = script
  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
