import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { GlobalConfiguration } from "../cfg"

// Helper function to extract first image from HTML AST
function extractFirstImageFromAST(htmlAst: any): string | null {
  if (!htmlAst || !htmlAst.children) return null
  
  // Recursively search for img elements in the AST
  function findImageInNode(node: any): string | null {
    if (!node) return null
    
    // Check if this node is an img element
    if (node.type === 'element' && node.tagName === 'img') {
      const src = node.properties?.src
      if (src) {
        // Fix the path to be absolute from site root, preserving original case
        let fixedSrc = src
        
        // Remove leading ./ if present
        if (fixedSrc.startsWith('./')) {
          fixedSrc = fixedSrc.substring(2)
        }
        
        // Ensure it starts with / for absolute path from site root
        if (!fixedSrc.startsWith('/')) {
          fixedSrc = '/' + fixedSrc
        }
        
        return fixedSrc
      }
    }
    
    // Recursively check children
    if (node.children) {
      for (const child of node.children) {
        const result = findImageInNode(child)
        if (result) return result
      }
    }
    
    return null
  }
  
  return findImageInNode(htmlAst)
}

// Helper function to extract first image from content (fallback)
function extractFirstImageFromText(content: string): string | null {
  // Try to find markdown images: ![alt](src)
  const markdownImageRegex = /!\[.*?\]\(([^)]+)\)/
  const markdownMatch = content.match(markdownImageRegex)
  if (markdownMatch) {
    let src = markdownMatch[1]
    // Normalize path like in extractFirstImageFromAST
    if (src.startsWith('./')) {
      src = src.substring(2)
    }
    if (!src.startsWith('/')) {
      src = '/' + src
    }
    return src
  }

  // Try to find HTML img tags: <img src="...">
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i
  const htmlMatch = content.match(htmlImageRegex)
  if (htmlMatch) {
    let src = htmlMatch[1]
    // Normalize path like in extractFirstImageFromAST
    if (src.startsWith('./')) {
      src = src.substring(2)
    }
    if (!src.startsWith('/')) {
      src = '/' + src
    }
    return src
  }

  return null
}

type Props = {
  pages: string[] // Array of page slugs/titles to render
} & QuartzComponentProps

export const CardList: QuartzComponent = ({ cfg, fileData, allFiles, pages }: Props) => {
  // Filter allFiles to only include the specified pages
  const filteredPages = allFiles.filter(page => {
    const title = page.frontmatter?.title?.toLowerCase()
    const slug = page.slug?.toLowerCase()
    
    return pages.some(targetPage => {
      const target = targetPage.toLowerCase()
      return title === target || slug === target || 
             title?.includes(target) || slug?.includes(target)
    })
  })

  // Sort by date if available, then alphabetically
  const sortedPages = filteredPages.sort((f1, f2) => {
    if (f1.dates && f2.dates) {
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  })

  return (
    <div class="card-list-container">
      {sortedPages.map((page) => {
        const title = page.frontmatter?.title
        const description = page.frontmatter?.description || page.description || ""
        
        // Extract first image from page content
        const firstImageFromAST = extractFirstImageFromAST((page as any).htmlAst)
        
        // Fallback to searching raw text content
        const rawContent = (page as any).text || 
                          (page as any).content || 
                          page.description || 
                          ""
        const firstImageFromText = firstImageFromAST ? null : extractFirstImageFromText(rawContent)
        
        const firstImage = firstImageFromAST || firstImageFromText

        return (
          <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal card-item-link" data-no-popover="true">
            <div class="card-item">
              <div class="card-item-image-placeholder">
                {firstImage ? (
                  <img 
                    src={firstImage} 
                    alt={title || "Post image"} 
                    class="card-item-image"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div class="image-placeholder" style={firstImage ? "display: none;" : ""}></div>
              </div>
              <div class="card-item-content">
                <div class="card-item-meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </div>
                <h3 class="card-item-title">
                  {title}
                </h3>
                {description && (
                  <p class="card-item-description">{description}</p>
                )}
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}

CardList.css = `
.card-list-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin: 2rem 0;
}

@media all and (max-width: 1200px) {
  .card-list-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media all and (max-width: 800px) {
  .card-list-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.card-item-link {
  text-decoration: none;
  color: inherit;
  background-color: transparent;
  display: block;
}

.card-item {
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  background-color: var(--light);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
  box-shadow: -4px 4px 6px rgba(0, 0, 0, 0.05);
}

.card-item-link:hover .card-item {
  transform: translateY(-2px);
  box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.1);
}

.card-item-image-placeholder {
  height: 200px;
  background-color: var(--lightgray);
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
  line-height: 0;
}

.card-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  margin: 0;
  padding: 0;
  border: none;
  vertical-align: top;
  transition: transform 0.2s ease;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--lightgray) 0%, var(--gray) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dark);
  font-size: 0.9rem;
  opacity: 0.6;
}

.image-placeholder::before {
  content: "";
  display: block;
  width: 60px;
  height: 60px;
  background-image: url('/static/logo.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: auto;
}

.card-item-content {
  padding: 1.5rem;
}

.card-item-meta {
  color: var(--gray);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.card-item-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  line-height: 1.3;
  color: var(--dark);
}

.card-item-link:hover .card-item-title {
  color: var(--secondary);
}

.card-item-description {
  color: var(--darkgray);
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
` 