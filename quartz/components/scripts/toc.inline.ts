const TOC_SCROLL_OFFSET = 120

function setTocHighlight(activeId: string | null) {
  document.querySelectorAll(".toc-content a[data-for]").forEach((link) => {
    const isActive = activeId !== null && link.getAttribute("data-for") === activeId
    link.classList.toggle("in-view", isActive)
  })
}

function updateTocHighlight() {
  const headers = [
    ...document.querySelectorAll(
      "article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]",
    ),
  ].filter((header) => header.id)

  if (headers.length === 0) {
    setTocHighlight(null)
    return
  }

  let activeId = headers[0].id
  for (const header of headers) {
    const { top } = header.getBoundingClientRect()
    if (top <= TOC_SCROLL_OFFSET) {
      activeId = header.id
    }
  }

  setTocHighlight(activeId)
}

function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as HTMLElement | undefined
  if (!content) return
  content.classList.toggle("collapsed")
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector(".toc-header")
    const content = toc.querySelector(".toc-content")
    if (!button || !content) continue
    button.addEventListener("click", toggleToc)
    window.addCleanup(() => button.removeEventListener("click", toggleToc))
  }
}

let onScroll: (() => void) | null = null

document.addEventListener("nav", () => {
  setupToc()

  if (onScroll) {
    window.removeEventListener("scroll", onScroll)
    onScroll = null
  }

  onScroll = () => updateTocHighlight()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addCleanup(() => {
    if (onScroll) {
      window.removeEventListener("scroll", onScroll)
      onScroll = null
    }
  })

  requestAnimationFrame(() => {
    updateTocHighlight()
  })
})
