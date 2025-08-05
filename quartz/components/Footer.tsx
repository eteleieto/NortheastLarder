import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { resolveRelative } from "../util/path"
// @ts-ignore
import script from "./scripts/newsletter.inline"

export default (() => {
  const Footer: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    return (
      <footer class={`${displayClass ?? ""}`}>
        <div class="footer-navigation">
          <a href={resolveRelative(fileData.slug!, "About")} class="internal">About</a>
          <a href={resolveRelative(fileData.slug!, "Contact")} class="internal">Contact</a>
          <a href={resolveRelative(fileData.slug!, "Documentation")} class="internal">Documentation</a>
          <a href={resolveRelative(fileData.slug!, "Bookshelf")} class="internal">Bookshelf</a>
        </div>
        <div class="social-links">
          <a href="https://www.instagram.com/northeastlarder/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <span>Email: </span><a href="mailto:info@northeastlarder.com">info@northeastlarder.com</a>
        </div>
        <p>
          Created with <a href="https://quartz.jzhao.xyz/" target="_blank" rel="noopener noreferrer">Quartz v4</a>,
          © {new Date().getFullYear()}
        </p>
      </footer>
    )
  }

  Footer.afterDOMLoaded = script
  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
