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
        <nav class="footer-row footer-nav" aria-label="Site">
          {link("About-Us", "About Us")}
          <span class="footer-sep" aria-hidden="true">·</span>
          {link("For-Restaurants", "For Restaurants")}
          <span class="footer-sep" aria-hidden="true">·</span>
          {link("Documentation", "Documentation")}
          <span class="footer-sep" aria-hidden="true">·</span>
          {link("Bookshelf", "Bookshelf")}
          <span class="footer-sep" aria-hidden="true">·</span>
          <button type="button" class="graph-open footer-link">
            Graph
          </button>
        </nav>
        <div class="footer-row footer-meta-row">
          <a
            class="footer-icon-link"
            href="https://www.instagram.com/northeastlarder/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <path d="M17.5 6.5h.01"></path>
            </svg>
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
