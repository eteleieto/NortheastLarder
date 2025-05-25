import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir} style={{ display: "flex", alignItems: "center" }}>
        <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 368.58 918.34" style={{ marginRight: "10px", height: "2em", fill: "currentColor" }}>
          <path d="M140.63,147.59c-11.67,10.75-14.85,31.71-2.75,43.54,8.06,7.87,24.82,10.1,24.38-4.89-12.87,7.29-21.72-12.21-9.92-20.43,18.59-12.96,36,10.88,30.45,30.45-11.56,40.75-71.66,22.72-75.5-19.53-6.08-66.89,91.94-85.72,119.47-19.47,34.1,82.06-58.55,139.05-127.4,95.4C4.06,192.23,73.88,41.11,189.46,61.55c129.47,22.89,137.96,215.05,11.58,251.95C94.97,344.47-5.47,273.03.23,160.69,9.77-27.22,279.43-58.15,351.45,109.56c60.38,140.63-52.87,255.18-122.99,364.36-65.05,101.29-94.98,183.18-65.7,305.33,9.36,39.03,25.96,74.42,36.23,111.77,2.15,7.81,4.82,18.3-4.35,23.08-5.67,2.95-7.66-1.12-9.73-.72-1.75.34-3.15,4.44-8.14,4.9-10.54.97-13-8.92-16.25-16.8-25.62-62.08-46.98-147.56-44.3-214.79,5.52-138.3,102.81-239.04,171.46-349.54,38.71-62.3,67.15-124.75,43.85-199.68C299.32,33.88,171.57-10.93,82.96,53.42c-112.83,81.92-51.08,271.09,99.52,238.52,87.1-18.84,112.96-127.81,46.27-184.68-64.56-55.06-165.63-1.83-146.18,81.18,18.39,78.46,135.35,70.65,126.6-7.6-3.58-32.01-41.73-57.94-68.54-33.25ZM321.28,307.23c5.31-7.02,9.76-16.38,11.98-24.99l-11.98,24.99ZM278.58,374.77l-16.98,25,1.37.93,16.98-25-1.37-.93ZM228.73,447.88l-11.13,16.9,1.22.8,11.13-16.9-1.22-.8ZM185.47,516.8l-9.91,18.04,1.45.8,9.91-18.04-1.45-.8ZM171.26,878.23c-24.06-72.52-45.86-147.88-33.7-225.2,1.95-12.38,4.81-24.89,7.99-37.01,2.86-10.88,7.77-22.24,10.27-32.73.24-1.01,1.32-3.27-.55-3.04-7.71,22.8-14.85,45.94-18.7,69.81-7.24,44.83-3.67,85.98,5.15,130.22,6.08,30.47,15.63,60.12,25.52,89.48l4.01,8.48Z"/>
        </svg>
        {title}
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
    
    &:hover {
      color: var(--secondary);
    }
  }

  @media all and (max-width: 800px) {
    font-size: 0;
    
    & > a {
      display: flex;
      align-items: center;
      justify-content: center;
      
      & > svg {
        height: 2.5em !important;
        margin-right: 0 !important;
      }
      
      // Hide the text content on mobile
      & > *:not(svg) {
        display: none;
      }
    }
  }
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
