import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    
    // Create SEO-optimized titles
    const baseTitle = fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title
    const tags = fileData.frontmatter?.tags || []
    
    let title: string
    if (fileData.slug === "index") {
      title = "Northeast Larder - Open Source Food Research Notebook"
    } else {
      // Create descriptive titles based on content type and tags
      let titleContext = ""
      
      if (tags.includes('RECIPE')) {
        titleContext = "Recipe"
      } else if (tags.includes('PROJECT')) {
        titleContext = "Project"
      } else if (tags.includes('LARDER')) {
        titleContext = "Ingredient Guide"
      } else if (tags.includes('TECHNIQUE')) {
        titleContext = "Technique"
      } else if (tags.includes('BLOG')) {
        titleContext = "Blog"
      }
      
      if (titleContext) {
        title = `${baseTitle} ${titleContext}${titleSuffix}`
      } else {
        title = `${baseTitle}${titleSuffix}`
      }
      
      // Ensure title is within optimal SEO length (50-60 chars) while being descriptive
      if (title.length > 60) {
        title = baseTitle + titleSuffix
      }
    }
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/logo.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    // (svgFavicon removed — we now use an external file)

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
            <link rel="canonical" href={socialUrl} />
          </>
        )}

        {/* Favicon file (external SVG) */}
        <link rel="icon" href={iconPath} type="image/png" />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* Structured Data for Recipes */}
        {(() => {
          const tags = fileData.frontmatter?.tags || []
          const isRecipe = tags.includes('RECIPE')
          
          if (!isRecipe) return null

          const frontmatter = fileData.frontmatter || {} as any
          const recipeData = {
            "@context": "https://schema.org/",
            "@type": "Recipe",
            "name": title,
            "description": description,
            "author": {
              "@type": "Organization",
              "name": "Northeast Larder",
              "url": "https://northeastlarder.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Northeast Larder",
              "url": "https://northeastlarder.com"
            },
            "datePublished": frontmatter.date || new Date().toISOString().split('T')[0],
            "recipeCategory": frontmatter.category || "Fermentation",
            "keywords": frontmatter.keywords || tags.join(', '),
            ...(frontmatter.prep_time && { "prepTime": `PT${frontmatter.prep_time}` }),
            ...(frontmatter.cook_time && { "cookTime": `PT${frontmatter.cook_time}` }),
            ...(frontmatter.servings && { "recipeYield": frontmatter.servings }),
            ...(frontmatter.difficulty && { "difficulty": frontmatter.difficulty })
          }

          return (
            <script 
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeData, null, 2) }}
            />
          )
        })()}

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
