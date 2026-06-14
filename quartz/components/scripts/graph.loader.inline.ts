let graphReady: Promise<void> | null = null
const graphModuleUrl = ["/", "graph", ".js"].join("")

function importGraphModule() {
  return import(graphModuleUrl)
}

function needsGraph() {
  return !!document.querySelector(".graph-container")
}

function loadGraph() {
  if (!graphReady) {
    graphReady = importGraphModule().then((module) => {
      module.setupGraph()
    })
  }
  return graphReady
}

function withGraph(action: (module: { openGlobalGraph: () => Promise<void>; toggleGlobalGraph: () => Promise<void> }) => void | Promise<void>) {
  void loadGraph().then(() => importGraphModule().then(action))
}

document.addEventListener("click", (e) => {
  const trigger = (e.target as Element | null)?.closest(".graph-open")
  if (!trigger) return
  e.preventDefault()
  withGraph((m) => m.openGlobalGraph())
})

document.addEventListener("nav", () => {
  if (needsGraph()) {
    void loadGraph()
  }
})

document.addEventListener("keydown", (e) => {
  if (e.key === "g" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault()
    withGraph((m) => m.toggleGlobalGraph())
  }
})
