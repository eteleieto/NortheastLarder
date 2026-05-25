import { pathToRoot, joinSegments } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)
  const logoPath = joinSegments(baseDir, "static/logo.png")
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir} aria-label={cfg?.pageTitle} style={{ display: "flex", alignItems: "center" }}>
        <img src={logoPath} alt="" class="site-logo" />
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);

  & > a {
    color: var(--dark);
    text-decoration: none;
    width: fit-content;
    
    &:hover {
      color: var(--secondary);
    }
  }

  .site-logo {
    height: 6.25rem;
    width: auto;
    display: block;
    object-fit: contain;
  }

  @media all and (max-width: 800px) {
    margin: 0;
    order: -1;
    flex-shrink: 0;
    display: block !important;
    
    & > a {
      display: flex;
      align-items: center;
      font-size: 0;
      padding: 0.25rem;
      
      .site-logo {
        height: 3.25rem;
        width: auto;
      }
    }
  }
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
