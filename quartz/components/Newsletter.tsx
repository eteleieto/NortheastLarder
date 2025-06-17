import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/newsletter.scss"
// @ts-ignore
import script from "./scripts/newsletter.inline"

export default (() => {
  const Newsletter: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={`newsletter-signup ${displayClass ?? ""}`}>
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
            <button type="submit" id="submit-btn" aria-label="Subscribe">→</button>
          </div>
          <div id="form-message" class="form-message"></div>
        </form>
      </div>
    )
  }

  Newsletter.afterDOMLoaded = script
  Newsletter.css = style
  return Newsletter
}) satisfies QuartzComponentConstructor 