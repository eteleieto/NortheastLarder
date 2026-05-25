const TOC_COLLAPSE_THRESHOLD = 5

function setBrowseCollapsed(header: HTMLElement, collapsed: boolean) {
  header.classList.toggle("collapsed", collapsed)
  header.setAttribute("aria-expanded", collapsed ? "false" : "true")

  const content = header.nextElementSibling as HTMLElement | undefined
  content?.classList.toggle("collapsed", collapsed)

  const nav = header.closest(".category-links")
  nav?.classList.toggle("collapsed", collapsed)
}

function toggleBrowse(header: HTMLElement) {
  setBrowseCollapsed(header, !header.classList.contains("collapsed"))
}

function shouldAutoCollapseBrowse(sidebar: HTMLElement): boolean {
  const toc = sidebar.querySelector(".toc")
  if (!toc) return false

  const tocEntries = toc.querySelectorAll(".toc-content > li:not(.overflow-end)").length
  if (tocEntries >= TOC_COLLAPSE_THRESHOLD) return true

  return sidebar.scrollHeight > sidebar.clientHeight + 1
}

function autoCollapseBrowseIfNeeded() {
  if (!window.matchMedia("(min-width: 1200px)").matches) return

  const sidebar = document.querySelector(".sidebar.right") as HTMLElement | null
  const header = sidebar?.querySelector(
    ".category-links .category-links-header",
  ) as HTMLElement | null
  if (!sidebar || !header) return

  setBrowseCollapsed(header, false)

  if (shouldAutoCollapseBrowse(sidebar)) {
    setBrowseCollapsed(header, true)
  }
}

function setupCategoryLinks() {
  for (const nav of document.getElementsByClassName("category-links")) {
    const header = nav.querySelector(".category-links-header") as HTMLElement | null
    if (!header) continue

    const onClick = () => toggleBrowse(header)
    header.addEventListener("click", onClick)
    window.addCleanup(() => header.removeEventListener("click", onClick))
  }

  requestAnimationFrame(() => {
    autoCollapseBrowseIfNeeded()
  })
}

document.addEventListener("nav", () => {
  setupCategoryLinks()
})
