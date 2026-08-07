let graphReady: Promise<void> | null = null
const graphModuleUrl = ["/", "graph", ".js"].join("")

function importGraphModule() {
  return import(graphModuleUrl)
}

// The graph bundle plus the content index it pulls in are ~320KB compressed —
// roughly half the homepage's transfer. Nothing above the fold depends on them,
// so hold off until the preview is actually near the viewport *and* the main
// thread is idle, rather than racing the article's own content.
function whenIdle(cb: () => void) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(cb, { timeout: 3000 })
  } else {
    setTimeout(cb, 300)
  }
}

function loadGraph() {
  if (!graphReady) {
    graphReady = importGraphModule().then((module) => {
      module.setupGraph()
    })
  }
  return graphReady
}

function withGraph(
  action: (module: {
    openGlobalGraph: (trigger?: HTMLElement) => Promise<void>
    toggleGlobalGraph: () => Promise<void>
  }) => void | Promise<void>,
) {
  void loadGraph().then(() => importGraphModule().then(action))
}

document.addEventListener("click", (e) => {
  const trigger = (e.target as Element | null)?.closest(".graph-open")
  if (!trigger) return
  e.preventDefault()
  withGraph((m) => m.openGlobalGraph(trigger as HTMLElement))
})

document.addEventListener("nav", () => {
  const containers = Array.from(document.querySelectorAll(".graph-container"))
  if (containers.length === 0) return

  // No IntersectionObserver (or no layout info yet): fall back to idle-only.
  if (!("IntersectionObserver" in window)) {
    whenIdle(() => void loadGraph())
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      whenIdle(() => void loadGraph())
    },
    // Start fetching just before the preview scrolls in, so it is usually
    // painted by the time it reaches the viewport.
    { rootMargin: "200px" },
  )

  for (const container of containers) {
    observer.observe(container)
  }

  window.addCleanup(() => observer.disconnect())
})

document.addEventListener("keydown", (e) => {
  if (e.key === "g" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault()
    withGraph((m) => m.toggleGlobalGraph())
  }
})
