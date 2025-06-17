import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
// @ts-ignore
import script from "./scripts/newsletter.inline"

export default (() => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <footer class={`${displayClass ?? ""}`}>
        <div class="social-links">
          <a href="https://www.instagram.com/northeastlarder/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <span>Email: </span><a href="mailto:info@northeastlarder.com">info@northeastlarder.com</a>
        </div>
        <div class="newsletter-signup">
          <h3>Join the Larder</h3>
          <form id="newsletter-form" class="email-form">
            <div class="form-group">
              <input 
                type="email" 
                id="email-input" 
                placeholder="Enter your email" 
                required 
                aria-label="Email address"
              />
              <button type="submit" id="submit-btn">Subscribe</button>
            </div>
            <div id="form-message" class="form-message"></div>
          </form>
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
