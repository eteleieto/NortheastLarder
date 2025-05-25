import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

export default (() => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <footer class={`${displayClass ?? ""}`}>
        <div class="social-links">
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">Twitter</a>
        </div>
        <p>
          Created with <a href="https://quartz.jzhao.xyz/" target="_blank" rel="noopener noreferrer">Quartz v4</a>,
          © {new Date().getFullYear()}
        </p>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
