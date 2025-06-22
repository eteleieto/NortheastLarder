document.addEventListener("nav", () => {
  renderCardLists()
})

window.addEventListener("DOMContentLoaded", () => {
  renderCardLists()
})

function renderCardLists() {
  const cardListContainers = document.querySelectorAll(".grid-container[data-pages]")
  
  // Detect if we are on the site index page (/, /index, or /index.html)
  const isIndexPage =
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/index") ||
    window.location.pathname.endsWith("/index.html")
  
  cardListContainers.forEach(container => {
    const pagesData = container.getAttribute("data-pages")
    const noImages = container.getAttribute("data-no-images") === "true"
    // New: hide dates for no‐image card lists that appear on the index page only
    const hideDate = noImages && isIndexPage
    if (!pagesData) return

    try {
      const pageLinks = JSON.parse(pagesData)
      
      if (!(window as any).fetchData) return
      
      (window as any).fetchData.then((contentIndex: any) => {
        // Convert page names to slugs and find matching pages
        const matchingPages = pageLinks
          .map((pageName: string) => {
            // Convert page name to slug format (spaces to hyphens, lowercase)
            const slug = pageName.replace(/\s+/g, '-').toLowerCase()
            
            // Try direct slug lookup first
            let data = contentIndex[slug]
            let matchedSlug = slug
            
            // If not found, try to find by title matching
            if (!data) {
              const entry = Object.entries(contentIndex).find(([entrySlug, pageData]: [string, any]) => {
                const title = pageData.title?.toLowerCase() || ""
                const targetName = pageName.toLowerCase()
                const filePath = pageData.filePath?.toLowerCase() || ""
                const fileNameWithoutExt = filePath.replace(/\.md$/, '')
                return title === targetName || title.includes(targetName)
                  || fileNameWithoutExt === targetName.replace(/\s+/g, ' ')
                  || fileNameWithoutExt === targetName.replace(/\s+/g, '-')
              })
              if (entry) {
                matchedSlug = entry[0]
                data = entry[1]
              }
            }
            
            return [matchedSlug, data]
          })
          .filter(([slug, data]: [string, any]) => data)

        // Helper function to format dates like the Date component
        function formatDate(dateStr: string): string {
          if (!dateStr) return ""
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return ""
          
          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }
          
          return date.toLocaleDateString('en-US', options)
        }

        // Render the cards
        const cardsHtml = matchingPages.map(([slug, data]: [string, any]) => {
          const title = data.title || slug
          const description = data.description || ""
          const date = data.date ? formatDate(data.date) : ""
          
          // Extract first image from page content exactly like GridPageList
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
                  
                  // Keep the original case structure (Assets/Attachments) to match actual file location
                  // Don't convert case - the files are actually stored as Assets/Attachments
                  
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
          
          // First try to get image from HTML AST (processed content)
          const firstImageFromAST = extractFirstImageFromAST(data.htmlAst)
          
          // Fallback to searching raw text content
          const rawContent = data.content || ""
          const firstImageFromText = firstImageFromAST ? null : extractFirstImageFromText(rawContent)
          
          const firstImage = firstImageFromAST || firstImageFromText
          
          const imageHtml = !noImages ? `
            <div class="grid-item-image-placeholder">
              ${firstImage ? `<img src="${firstImage}" alt="${title}" class="grid-item-image" loading="lazy" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : ''}
              <div class="image-placeholder" style="${firstImage ? 'display: none;' : ''}"></div>
            </div>
          ` : ''
          
          const dateHtml = (hideDate || !date) ? "" : `<div class="grid-item-meta">${date}</div>`
          const descriptionHtml = description ? `<p class="grid-item-description">${description}</p>` : ""
          
          return `
            <a href="${slug}" class="internal grid-item-link" data-no-popover="true">
              <div class="grid-item">
                ${imageHtml}
                <div class="grid-item-content">
                  ${dateHtml}
                  <h3 class="grid-item-title">${title}</h3>
                  ${descriptionHtml}
                </div>
              </div>
            </a>
          `
        }).join("")
        
        // Replace the loading message with the cards
        container.innerHTML = cardsHtml
        container.classList.add("cards-loaded")
      }).catch((error: any) => {
        console.warn("Failed to load card list data:", error)
        container.innerHTML = '<div class="card-list-error">Failed to load cards</div>'
      })
    } catch (error: any) {
      console.warn("Failed to parse card list data:", error)
      container.innerHTML = '<div class="card-list-error">Failed to parse card data</div>'
    }
  })
} 