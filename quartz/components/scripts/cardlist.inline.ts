document.addEventListener("nav", () => {
  renderCardLists()
})

window.addEventListener("DOMContentLoaded", () => {
  renderCardLists()
})

function renderCardLists() {
  const cardListContainers = document.querySelectorAll(".grid-container[data-pages]")

  const isIndexPage =
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/index") ||
    window.location.pathname.endsWith("/index.html")

  cardListContainers.forEach((container) => {
    const pagesData = container.getAttribute("data-pages")
    const noImages = container.getAttribute("data-no-images") === "true"
    const hideDate = noImages && isIndexPage
    if (!pagesData) return

    try {
      const pageLinks = JSON.parse(pagesData)

      if (typeof (window as any).getFetchData !== "function") return

      ;(window as any)
        .getFetchData()
        .then((contentIndex: any) => {
          const lowercaseIndex: Record<string, { slug: string; data: any }> = {}
          Object.entries(contentIndex).forEach(([slug, data]: [string, any]) => {
            lowercaseIndex[slug.toLowerCase()] = { slug, data }
          })

          const matchingPages = pageLinks
            .map((pageName: string) => {
              const slug = pageName.replace(/\s+/g, "-").toLowerCase()

              let matchedSlug = slug
              let data = lowercaseIndex[slug]?.data
              if (data) {
                matchedSlug = lowercaseIndex[slug].slug
              }

              if (!data) {
                const entry = Object.entries(contentIndex).find(
                  ([, pageData]: [string, any]) => {
                    const title = pageData.title?.toLowerCase() || ""
                    const targetName = pageName.toLowerCase()
                    const filePath = pageData.filePath?.toLowerCase() || ""
                    const fileNameWithoutExt = filePath.replace(/\.md$/, "")
                    return (
                      title === targetName ||
                      title.includes(targetName) ||
                      fileNameWithoutExt === targetName.replace(/\s+/g, " ") ||
                      fileNameWithoutExt === targetName.replace(/\s+/g, "-")
                    )
                  },
                )
                if (entry) {
                  matchedSlug = entry[0]
                  data = entry[1]
                }
              }

              return [matchedSlug, data]
            })
            .filter(([, data]: [string, any]) => data)

          function formatDate(dateStr: string): string {
            if (!dateStr) return ""
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return ""

            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })
          }

          const cardsHtml = matchingPages
            .map(([slug, data]: [string, any]) => {
              const title = data.title || slug
              const description = data.description || ""
              const date = data.date ? formatDate(data.date) : ""
              const firstImage = noImages ? null : data.cardImage ?? null

              const bgHtml =
                firstImage ?
                  `<div class="grid-item-bg" style="background-image: url('${firstImage}')" aria-hidden="true"></div>`
                : ""

              const dateHtml = hideDate || !date ? "" : `<div class="grid-item-meta">${date}</div>`
              const descriptionHtml =
                description ? `<p class="grid-item-description">${description}</p>` : ""

              return `
            <a href="${slug}" class="internal grid-item-link" data-no-popover="true">
              <div class="grid-item${firstImage ? " has-bg" : ""}">
                ${bgHtml}
                <div class="grid-item-content">
                  ${dateHtml}
                  <h3 class="grid-item-title">${title}</h3>
                  ${descriptionHtml}
                </div>
              </div>
            </a>
          `
            })
            .join("")

          container.innerHTML = cardsHtml
          container.classList.add("cards-loaded")
        })
        .catch((error: any) => {
          console.warn("Failed to load card list data:", error)
          container.innerHTML = '<div class="card-list-error">Failed to load cards</div>'
        })
    } catch (error: any) {
      console.warn("Failed to parse card list data:", error)
      container.innerHTML = '<div class="card-list-error">Failed to parse card data</div>'
    }
  })
}
