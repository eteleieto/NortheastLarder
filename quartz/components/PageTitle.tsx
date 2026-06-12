import { pathToRoot, joinSegments } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)
  const logoPath = joinSegments(baseDir, "static/ornament-j.png")
  const isHomePage = fileData.slug === "index"

  return (
    <div class={classNames(displayClass, "page-title", isHomePage ? "home-mark" : "wordmark-mark")}>
      <a href={baseDir} aria-label={cfg?.pageTitle} class="site-logo-link">
        <span class="site-logo-wrap">
          <img src={logoPath} alt="" class="site-logo" />
        </span>
        <span class="site-wordmark" aria-hidden="true">
          <span>Northeast</span>
          <span>Larder</span>
        </span>
      </a>
    </div>
  )
}

PageTitle.css = `
.page-title {
  /* Ornament + wordmark scale together — text size derived from compact mark height */
  --site-mark-size-home: 4.75rem;
  --site-mark-size-compact: 2.75rem;
  --site-mark-text-ratio: 0.682;
  --site-mark-gap-ratio: 0.164;
  --site-mark-size: var(--site-mark-size-home);
  --site-mark-height: calc(var(--site-mark-size-home) + 0.5rem);
  --site-wordmark-font-size: calc(var(--site-mark-size-compact) * var(--site-mark-text-ratio));
  --site-wordmark-max-width: calc(8rem * var(--site-mark-size-compact) / 2.75rem);
  --logo-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --logo-shrink-duration: 0.2s;
  --wordmark-fade-duration: 0.15s;
  --wordmark-fade-delay: 0.05s;

  font-size: var(--site-wordmark-font-size);
  margin: 0;
  font-family: var(--titleFont);
  min-height: var(--site-mark-height);

  .site-logo-link {
    display: flex;
    align-items: center;
    gap: calc(var(--site-mark-size-compact) * var(--site-mark-gap-ratio));
    color: var(--dark);
    text-decoration: none;
    width: fit-content;
    min-height: var(--site-mark-height);
    transition: gap var(--logo-shrink-duration) var(--logo-ease);

    &:hover {
      color: var(--secondary);
    }
  }

  .site-logo-wrap {
    display: block;
    flex-shrink: 0;
    height: var(--site-mark-size);
    line-height: 0;
    transition: height var(--logo-shrink-duration) var(--logo-ease);
  }

  .site-logo {
    display: block;
    height: 100%;
    width: auto;
    max-height: 100%;
    margin: 0;
    object-fit: contain;
  }

  .site-wordmark {
    display: flex;
    flex-direction: column;
    gap: 0.05em;
    font-family: var(--titleFont);
    font-weight: 400;
    font-size: var(--site-wordmark-font-size);
    line-height: 0.95;
    letter-spacing: 0;
    max-width: var(--site-wordmark-max-width);
    overflow: hidden;
    opacity: 1;
    visibility: visible;
    transition: opacity var(--wordmark-fade-duration) var(--logo-ease) var(--wordmark-fade-delay);
    white-space: nowrap;
  }

  &.home-mark .site-logo-link {
    gap: 0;
  }

  &.wordmark-mark {
    min-height: 0;

    .site-logo-link {
      align-items: flex-start;
      min-height: 0;
    }
  }

  &.home-mark .site-wordmark {
    max-width: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.12s var(--logo-ease);
  }

  &.wordmark-mark .site-logo-wrap {
    height: var(--site-mark-size-compact);
  }

  @media (prefers-reduced-motion: reduce) {
    & > a,
    .site-logo-wrap,
    .site-wordmark {
      transition: none;
    }
  }

  @media all and (max-width: 800px) {
    --site-mark-size-home: 2.45rem;
    --site-mark-size-compact: 1.8rem;

    margin: 0;
    order: -1;
    flex-shrink: 0;
    display: block !important;

    .site-logo-link {
      display: flex;
      align-items: center;
      font-size: 0;
      padding: 0.25rem;
    }
  }
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
