import type { ContentDetails } from "../../plugins/emitters/contentIndex"
import {
  SimulationNodeDatum,
  SimulationLinkDatum,
  Simulation,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide,
  forceRadial,
  zoomIdentity,
  select,
  drag,
  zoom,
} from "d3"
import { Text, Graphics, Application, Container, Circle } from "pixi.js"
import { registerEscapeHandler, removeAllChildren } from "./util"
import { FullSlug, SimpleSlug, getFullSlug, resolveRelative, simplifySlug } from "../../util/path"
import { stripWipPrefix } from "../../util/wip"

type D3Config = {
  drag: boolean
  zoom: boolean
  depth: number
  scale: number
  repelForce: number
  centerForce: number
  linkDistance: number
  fontSize: number
  opacityScale: number
  removeTags: string[]
  showTags: boolean
  focusOnHover?: boolean
  enableRadial?: boolean
  fitView?: boolean
}

type NodeData = {
  id: SimpleSlug
  text: string
  tags: string[]
} & SimulationNodeDatum

type SimpleLinkData = {
  source: SimpleSlug
  target: SimpleSlug
}

type LinkData = {
  source: NodeData
  target: NodeData
} & SimulationLinkDatum<NodeData>

type LinkRenderData = {
  simulationData: LinkData
  active: boolean
  alpha: number
  targetAlpha: number
  color: string
}

type NodeRenderData = {
  simulationData: NodeData
  gfx: Graphics
  label: Text | null
  active: boolean
  targetGfxAlpha: number
  targetLabelAlpha: number
  targetLabelScale: number
}

const NODE_ANIM_MS = 200
const LABEL_ANIM_MS = 100
const HOVER_DIM_ALPHA = 0.2
const HOVER_LABEL_SCALE = 1.1
const DRAG_ALPHA_TARGET = 0.2
const CLICK_DISTANCE_PX = 6

/** Exponential ease toward target — frame-rate independent, no tween allocations. */
function approach(current: number, target: number, dtMs: number, durationMs: number): number {
  if (durationMs <= 0) return target
  const t = 1 - Math.pow(0.001, dtMs / durationMs)
  const next = current + (target - current) * t
  return Math.abs(next - target) < 0.004 ? target : next
}

const localStorageKey = "graph-visited"
let cachedGraphData: Map<SimpleSlug, ContentDetails> | null = null

function getVisited(): Set<SimpleSlug> {
  return new Set(JSON.parse(localStorage.getItem(localStorageKey) ?? "[]"))
}

function addToVisited(slug: SimpleSlug) {
  const visited = getVisited()
  visited.add(slug)
  localStorage.setItem(localStorageKey, JSON.stringify([...visited]))
}

async function getGraphData(): Promise<Map<SimpleSlug, ContentDetails>> {
  if (!cachedGraphData) {
    const raw = await getFetchData()
    cachedGraphData = new Map(
      Object.entries<ContentDetails>(raw).map(([k, v]) => [simplifySlug(k as FullSlug), v]),
    )
  }
  return cachedGraphData
}

async function renderGraph(graph: HTMLElement, fullSlug: FullSlug) {
  const slug = simplifySlug(fullSlug)
  const visited = getVisited()
  removeAllChildren(graph)

  let {
    drag: enableDrag,
    zoom: enableZoom,
    depth,
    scale,
    repelForce,
    centerForce,
    linkDistance,
    fontSize,
    opacityScale,
    removeTags,
    showTags,
    focusOnHover,
    enableRadial,
    fitView,
  } = JSON.parse(graph.dataset["cfg"]!) as D3Config

  const data = await getGraphData()
  const links: SimpleLinkData[] = []
  const tags: SimpleSlug[] = []
  const validLinks = new Set(data.keys())
  const unresolvedNodes = new Set<SimpleSlug>()

  for (const [source, details] of data.entries()) {
    const outgoing = details.links ?? []

    for (const dest of outgoing) {
      links.push({ source: source, target: dest })
      if (!validLinks.has(dest)) {
        unresolvedNodes.add(dest)
      }
    }

    if (showTags) {
      const localTags = details.tags
        .filter((tag) => !removeTags.includes(tag))
        .map((tag) => simplifySlug(("tags/" + tag) as FullSlug))

      tags.push(...localTags.filter((tag) => !tags.includes(tag)))

      for (const tag of localTags) {
        links.push({ source: source, target: tag })
      }
    }
  }

  const neighbourhood = new Set<SimpleSlug>()
  const wl: (SimpleSlug | "__SENTINEL")[] = [slug, "__SENTINEL"]
  if (depth >= 0) {
    const linksBySource = new Map<SimpleSlug, SimpleSlug[]>()
    const linksByTarget = new Map<SimpleSlug, SimpleSlug[]>()
    for (const l of links) {
      if (!linksBySource.has(l.source)) linksBySource.set(l.source, [])
      linksBySource.get(l.source)!.push(l.target)
      if (!linksByTarget.has(l.target)) linksByTarget.set(l.target, [])
      linksByTarget.get(l.target)!.push(l.source)
    }

    while (depth >= 0 && wl.length > 0) {
      const cur = wl.shift()!
      if (cur === "__SENTINEL") {
        depth--
        wl.push("__SENTINEL")
      } else {
        neighbourhood.add(cur)
        wl.push(...(linksBySource.get(cur) ?? []), ...(linksByTarget.get(cur) ?? []))
      }
    }
  } else {
    validLinks.forEach((id) => neighbourhood.add(id))
    unresolvedNodes.forEach((id) => neighbourhood.add(id))
    if (showTags) tags.forEach((tag) => neighbourhood.add(tag))
  }

  const nodes = [...neighbourhood].map((url) => {
    const text = url.startsWith("tags/") ? "#" + url.substring(5) : stripWipPrefix(data.get(url)?.title ?? url)
    return { id: url, text, tags: data.get(url)?.tags ?? [] }
  })

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const graphData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes,
    links: links
      .filter((l) => neighbourhood.has(l.source) && neighbourhood.has(l.target))
      .map((l) => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
      })),
  }

  const linkDegree = new Map<SimpleSlug, number>()
  for (const l of graphData.links) {
    linkDegree.set(l.source.id, (linkDegree.get(l.source.id) ?? 0) + 1)
    linkDegree.set(l.target.id, (linkDegree.get(l.target.id) ?? 0) + 1)
  }

  function nodeRadius(d: NodeData) {
    const numLinks = linkDegree.get(d.id) ?? 0
    return 2 + Math.sqrt(numLinks) + (d.id === slug ? 4 : 0)
  }

  const width = graph.offsetWidth
  const height = fitView ? graph.offsetHeight : Math.max(graph.offsetHeight, 250)

  const simulation: Simulation<NodeData, LinkData> = forceSimulation<NodeData>(graphData.nodes)
    .force("charge", forceManyBody().strength(-100 * repelForce))
    .force("center", forceCenter().strength(centerForce))
    .force("link", forceLink(graphData.links).distance(linkDistance))
    .force("collide", forceCollide<NodeData>((n) => nodeRadius(n)).iterations(1))

  const radius = (Math.min(width, height) / 2) * 0.8
  if (enableRadial) simulation.force("radial", forceRadial(radius).strength(0.2))

  const cssVars = [
    "--secondary",
    "--tertiary",
    "--gray",
    "--light",
    "--lightgray",
    "--dark",
    "--darkgray",
    "--bodyFont",
  ] as const
  const computedStyleMap = cssVars.reduce(
    (acc, key) => {
      acc[key] = getComputedStyle(document.documentElement).getPropertyValue(key)
      return acc
    },
    {} as Record<(typeof cssVars)[number], string>,
  )

  const color = (d: NodeData) => {
    if (d.id === slug) return computedStyleMap["--secondary"]
    if (visited.has(d.id) || d.id.startsWith("tags/")) return computedStyleMap["--tertiary"]
    return computedStyleMap["--gray"]
  }

  let hoveredNodeId: string | null = null
  let hoveredNeighbours: Set<string> = new Set()
  let currentScaleOpacity = 0
  let dragging = false
  let dragStartPointer: { x: number; y: number } | null = null
  let maxDragDistanceSq = 0
  const linkRenderData: LinkRenderData[] = []
  const nodeRenderData: NodeRenderData[] = []

  const app = new Application()
  await app.init({
    width,
    height,
    antialias: true,
    autoStart: false,
    autoDensity: true,
    backgroundAlpha: 0,
    preference: "webgl",
    resolution: Math.min(window.devicePixelRatio, 2),
    eventMode: "static",
  })
  graph.appendChild(app.canvas)

  const stage = app.stage
  stage.interactive = false

  const linksGfx = new Graphics({ eventMode: "none" })
  const nodesContainer = new Container<Graphics>()
  const labelsContainer = new Container<Text>()
  stage.addChild(linksGfx, nodesContainer, labelsContainer)

  let stopAnimation = false
  let animFrameId: number | null = null
  let renderPending = false
  let visualAnimating = false
  let lastFrameTime = performance.now()

  function requestRender() {
    if (renderPending || stopAnimation) return
    renderPending = true
    if (animFrameId === null) {
      animFrameId = requestAnimationFrame(animate)
    }
  }

  function ensureLabel(node: NodeRenderData): Text {
    if (node.label) return node.label

    const nodeId = node.simulationData.id
    const isUnresolved = unresolvedNodes.has(nodeId)
    const label = new Text({
      interactive: false,
      eventMode: "none",
      text: node.simulationData.text,
      alpha: 0,
      anchor: { x: 0.5, y: 1.2 },
      style: {
        fontSize: fontSize * 15,
        fill: isUnresolved ? computedStyleMap["--gray"] : computedStyleMap["--dark"],
        fontFamily: computedStyleMap["--bodyFont"],
      },
      resolution: window.devicePixelRatio * 4,
    })
    label.scale.set(1 / scale)

    // position immediately — the simulation may already be settled, in which
    // case syncNodePositions will not run again to place this label
    const { x, y } = node.simulationData
    label.position.set((x ?? 0) + width / 2, (y ?? 0) + height / 2)

    labelsContainer.addChild(label)
    node.label = label
    return label
  }

  function syncNodePositions() {
    for (const n of nodeRenderData) {
      const { x, y } = n.simulationData
      if (x === undefined || y === undefined) continue
      const px = x + width / 2
      const py = y + height / 2
      n.gfx.position.set(px, py)
      if (n.label) {
        n.label.position.set(px, py)
      }
    }
  }

  function drawLinks() {
    linksGfx.clear()

    for (const l of linkRenderData) {
      const { source, target } = l.simulationData
      if (source.x === undefined || source.y === undefined) continue
      if (target.x === undefined || target.y === undefined) continue
      linksGfx
        .moveTo(source.x + width / 2, source.y + height / 2)
        .lineTo(target.x + width / 2, target.y + height / 2)
        .stroke({ width: 1, color: l.color, alpha: l.alpha })
    }
  }

  function setVisualTargets() {
    const defaultScale = 1 / scale
    const activeScale = defaultScale * HOVER_LABEL_SCALE

    for (const n of nodeRenderData) {
      const nodeId = n.simulationData.id

      n.targetGfxAlpha =
        hoveredNodeId !== null && focusOnHover ? (n.active ? 1 : HOVER_DIM_ALPHA) : 1

      if (hoveredNodeId === nodeId) {
        n.targetLabelAlpha = 1
        n.targetLabelScale = activeScale
      } else if (hoveredNodeId !== null && hoveredNeighbours.has(nodeId)) {
        n.targetLabelAlpha = 1
        n.targetLabelScale = defaultScale
      } else if (hoveredNodeId !== null) {
        n.targetLabelAlpha = 0
        n.targetLabelScale = defaultScale
      } else {
        n.targetLabelAlpha = currentScaleOpacity
        n.targetLabelScale = defaultScale
      }
    }

    for (const l of linkRenderData) {
      l.targetAlpha = hoveredNodeId ? (l.active ? 1 : HOVER_DIM_ALPHA) : 1
      l.color = l.active ? computedStyleMap["--gray"] : computedStyleMap["--lightgray"]
    }

    visualAnimating = true
    requestRender()
  }

  function stepVisualAnimation(dtMs: number): boolean {
    let stillAnimating = false

    for (const n of nodeRenderData) {
      n.gfx.alpha = approach(n.gfx.alpha, n.targetGfxAlpha, dtMs, NODE_ANIM_MS)
      if (Math.abs(n.gfx.alpha - n.targetGfxAlpha) > 0.004) stillAnimating = true

      if (n.targetLabelAlpha > 0.004 || n.label) {
        const label = n.targetLabelAlpha > 0.004 ? ensureLabel(n) : n.label
        if (label) {
          label.alpha = approach(label.alpha, n.targetLabelAlpha, dtMs, LABEL_ANIM_MS)
          const nextScale = approach(label.scale.x, n.targetLabelScale, dtMs, LABEL_ANIM_MS)
          label.scale.set(nextScale)
          if (
            Math.abs(label.alpha - n.targetLabelAlpha) > 0.004 ||
            Math.abs(nextScale - n.targetLabelScale) > 0.002
          ) {
            stillAnimating = true
          }
        }
      }
    }

    for (const l of linkRenderData) {
      l.alpha = approach(l.alpha, l.targetAlpha, dtMs, NODE_ANIM_MS)
      if (Math.abs(l.alpha - l.targetAlpha) > 0.004) stillAnimating = true
    }

    drawLinks()
    return stillAnimating
  }

  function updateHoverInfo(newHoveredId: string | null) {
    hoveredNodeId = newHoveredId

    if (newHoveredId === null) {
      hoveredNeighbours = new Set()
      for (const n of nodeRenderData) n.active = false
      for (const l of linkRenderData) l.active = false
    } else {
      hoveredNeighbours = new Set()
      for (const l of linkRenderData) {
        const linkData = l.simulationData
        if (linkData.source.id === newHoveredId || linkData.target.id === newHoveredId) {
          hoveredNeighbours.add(linkData.source.id)
          hoveredNeighbours.add(linkData.target.id)
        }
        l.active = linkData.source.id === newHoveredId || linkData.target.id === newHoveredId
      }
      for (const n of nodeRenderData) {
        n.active = hoveredNeighbours.has(n.simulationData.id)
      }
    }
  }

  for (const n of graphData.nodes) {
    const nodeId = n.id
    const isTagNode = nodeId.startsWith("tags/")
    const isUnresolved = unresolvedNodes.has(nodeId)

    const gfx = new Graphics({
      interactive: true,
      label: nodeId,
      eventMode: "static",
      hitArea: new Circle(0, 0, nodeRadius(n)),
      cursor: isUnresolved ? "default" : "pointer",
    })
      .circle(0, 0, nodeRadius(n))
      .fill({
        color: isTagNode ? computedStyleMap["--light"] : color(n),
        alpha: isUnresolved ? 0 : 1,
      })

    if (isTagNode) {
      gfx.stroke({ width: 2, color: computedStyleMap["--tertiary"] })
    } else if (n.id === slug) {
      gfx.stroke({ width: 3, color: computedStyleMap["--secondary"] })
    } else if (isUnresolved) {
      gfx.stroke({ width: 1.5, color: computedStyleMap["--gray"] })
    }

    gfx.on("pointerover", (e) => {
      if (dragging) return
      updateHoverInfo(e.target.label)
      setVisualTargets()
    })
    gfx.on("pointerleave", () => {
      if (dragging) return
      updateHoverInfo(null)
      setVisualTargets()
    })

    nodesContainer.addChild(gfx)
    nodeRenderData.push({
      simulationData: n,
      gfx,
      label: null,
      active: false,
      targetGfxAlpha: 1,
      targetLabelAlpha: 0,
      targetLabelScale: 1 / scale,
    })
  }

  for (const l of graphData.links) {
    linkRenderData.push({
      simulationData: l,
      active: false,
      alpha: 1,
      targetAlpha: 1,
      color: computedStyleMap["--lightgray"],
    })
  }

  let currentTransform = zoomIdentity
  let zoomBehavior: ReturnType<typeof zoom<HTMLCanvasElement, NodeData>> | null = null

  function applyTransform(k: number, tx: number, ty: number) {
    currentTransform = zoomIdentity.translate(tx, ty).scale(k)
    if (zoomBehavior) {
      select<HTMLCanvasElement, NodeData>(app.canvas).call(zoomBehavior.transform, currentTransform)
    } else {
      stage.scale.set(k, k)
      stage.position.set(tx, ty)
    }
  }

  function applyFitView() {
    if (nodeRenderData.length === 0) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const n of nodeRenderData) {
      const { x, y } = n.simulationData
      if (x === undefined || y === undefined) continue
      const screenX = x + width / 2
      const screenY = y + height / 2
      const r = nodeRadius(n.simulationData) + 4
      minX = Math.min(minX, screenX - r)
      minY = Math.min(minY, screenY - r)
      maxX = Math.max(maxX, screenX + r)
      maxY = Math.max(maxY, screenY + r)
    }

    if (!Number.isFinite(minX)) return

    const graphWidth = Math.max(maxX - minX, 1)
    const graphHeight = Math.max(maxY - minY, 1)
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    const padding = 12
    const k = Math.min((width - padding * 2) / graphWidth, (height - padding * 2) / graphHeight)
    const clampedK = Math.max(0.08, Math.min(k, 1))
    const tx = width / 2 - clampedK * midX
    const ty = height / 2 - clampedK * midY
    applyTransform(clampedK, tx, ty)
  }

  if (enableDrag) {
    select<HTMLCanvasElement, NodeData | undefined>(app.canvas).call(
      drag<HTMLCanvasElement, NodeData | undefined>()
        .container(() => app.canvas)
        .subject(() => graphData.nodes.find((n) => n.id === hoveredNodeId))
        .on("start", function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(DRAG_ALPHA_TARGET).restart()
          event.subject.fx = event.subject.x
          event.subject.fy = event.subject.y
          event.subject.__initialDragPos = {
            x: event.subject.x,
            y: event.subject.y,
            fx: event.subject.fx,
            fy: event.subject.fy,
          }
          dragStartPointer = { x: event.x, y: event.y }
          maxDragDistanceSq = 0
          dragging = true
          requestRender()
        })
        .on("drag", function dragged(event) {
          const initPos = event.subject.__initialDragPos
          if (dragStartPointer) {
            const dx = event.x - dragStartPointer.x
            const dy = event.y - dragStartPointer.y
            maxDragDistanceSq = Math.max(maxDragDistanceSq, dx * dx + dy * dy)
          }
          event.subject.fx = initPos.x + (event.x - initPos.x) / currentTransform.k
          event.subject.fy = initPos.y + (event.y - initPos.y) / currentTransform.k
        })
        .on("end", function dragended(event) {
          if (!event.active) simulation.alphaTarget(0)
          event.subject.fx = null
          event.subject.fy = null
          dragging = false

          const isClick = maxDragDistanceSq <= CLICK_DISTANCE_PX * CLICK_DISTANCE_PX
          dragStartPointer = null
          maxDragDistanceSq = 0

          if (!isClick) {
            updateHoverInfo(null)
            setVisualTargets()
            return
          }

          const node = graphData.nodes.find((n) => n.id === event.subject.id) as NodeData
          if (unresolvedNodes.has(node.id)) return
          const targ = resolveRelative(fullSlug, node.id)
          window.spaNavigate(new URL(targ, window.location.toString()))
        }),
    )
  } else {
    for (const node of nodeRenderData) {
      if (unresolvedNodes.has(node.simulationData.id)) continue
      node.gfx.on("click", () => {
        const targ = resolveRelative(fullSlug, node.simulationData.id)
        window.spaNavigate(new URL(targ, window.location.toString()))
      })
    }
  }

  if (enableZoom) {
    zoomBehavior = zoom<HTMLCanvasElement, NodeData>()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0.08, 4])
      .on("zoom", ({ transform }) => {
        currentTransform = transform
        stage.scale.set(transform.k, transform.k)
        stage.position.set(transform.x, transform.y)

        const zoomScale = transform.k * opacityScale
        currentScaleOpacity = Math.max((zoomScale - 1) / 3.75, 0)
        if (hoveredNodeId === null) {
          setVisualTargets()
        } else {
          for (const n of nodeRenderData) {
            if (!n.active && n.label) {
              n.targetLabelAlpha = currentScaleOpacity
            }
          }
          visualAnimating = true
          requestRender()
        }
      })

    select<HTMLCanvasElement, NodeData>(app.canvas).call(zoomBehavior)
  }

  if (fitView) {
    app.canvas.style.visibility = "hidden"
  }

  function animate(time: number) {
    animFrameId = null
    renderPending = false

    if (stopAnimation) return

    const dtMs = Math.min(time - lastFrameTime, 48)
    lastFrameTime = time

    const simulationActive = simulation.alpha() > simulation.alphaMin()

    if (simulationActive || dragging) {
      syncNodePositions()
      drawLinks()
    } else if (visualAnimating) {
      visualAnimating = stepVisualAnimation(dtMs)
    }

    app.renderer.render(stage)

    if (simulationActive || dragging || visualAnimating) {
      requestRender()
    }
  }

  simulation.on("tick", () => requestRender())

  if (fitView) {
    simulation.stop()
    while (simulation.alpha() > simulation.alphaMin()) {
      simulation.tick()
    }
    syncNodePositions()
    drawLinks()
    applyFitView()
    app.renderer.render(stage)
    app.canvas.style.visibility = "visible"
  } else {
    requestRender()
  }

  return () => {
    stopAnimation = true
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    simulation.stop()
    app.destroy()
  }
}

let localGraphCleanups: (() => void)[] = []
let globalGraphCleanups: (() => void)[] = []
let localRenderGeneration = 0
const pendingObservers = new Set<IntersectionObserver>()

function cleanupLocalGraphs() {
  localRenderGeneration++
  for (const observer of pendingObservers) {
    observer.disconnect()
  }
  pendingObservers.clear()
  for (const cleanup of localGraphCleanups) {
    cleanup()
  }
  localGraphCleanups = []
}

function cleanupGlobalGraphs() {
  for (const cleanup of globalGraphCleanups) {
    cleanup()
  }
  globalGraphCleanups = []
}

function getGlobalGraphContainers() {
  return [...document.getElementsByClassName("global-graph-outer")] as HTMLElement[]
}

const GRAPH_PANEL_MS = 150
let hideGlobalGraphTimer: ReturnType<typeof setTimeout> | null = null

function hideGlobalGraph() {
  for (const container of getGlobalGraphContainers()) {
    container.classList.remove("active")
    container.setAttribute("aria-hidden", "true")
  }
  document.body.classList.remove("global-graph-active")

  if (hideGlobalGraphTimer) clearTimeout(hideGlobalGraphTimer)
  hideGlobalGraphTimer = setTimeout(() => {
    cleanupGlobalGraphs()
    hideGlobalGraphTimer = null
  }, GRAPH_PANEL_MS)
}

export async function openGlobalGraph() {
  const containers = getGlobalGraphContainers()
  if (containers.length === 0) return

  if (hideGlobalGraphTimer) {
    clearTimeout(hideGlobalGraphTimer)
    hideGlobalGraphTimer = null
    cleanupGlobalGraphs()
  }

  const currentSlug = getFullSlug(window)
  document.body.classList.add("global-graph-active")
  globalGraphCleanups.push(() => document.body.classList.remove("global-graph-active"))

  for (const container of containers) {
    container.classList.add("active")
    container.setAttribute("aria-hidden", "false")

    const graphContainer = container.querySelector(".global-graph-container") as HTMLElement
    const closeButton = container.querySelector(".global-graph-close") as HTMLElement
    registerEscapeHandler(container, hideGlobalGraph)

    if (closeButton) {
      closeButton.addEventListener("click", hideGlobalGraph)
      globalGraphCleanups.push(() => closeButton.removeEventListener("click", hideGlobalGraph))
    }

    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        hideGlobalGraph()
      }
    }

    container.addEventListener("click", onBackdropClick)
    globalGraphCleanups.push(() => container.removeEventListener("click", onBackdropClick))

    if (graphContainer) {
      globalGraphCleanups.push(await renderGraph(graphContainer, currentSlug))
    }
  }
}

function renderLocalGraph(slug: FullSlug) {
  cleanupLocalGraphs()
  const generation = localRenderGeneration
  const localGraphContainers = document.getElementsByClassName("graph-container")

  for (const container of localGraphContainers) {
    const el = container as HTMLElement

    const start = async () => {
      if (generation !== localRenderGeneration) return
      const cleanup = await renderGraph(el, slug)
      if (generation !== localRenderGeneration) {
        cleanup()
        return
      }
      localGraphCleanups.push(cleanup)
    }

    // defer offscreen previews until they come into view
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
      void start()
      continue
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          pendingObservers.delete(observer)
          void start()
        }
      },
      { rootMargin: "120px" },
    )
    observer.observe(el)
    pendingObservers.add(observer)
  }
}

export async function toggleGlobalGraph() {
  const anyGlobalGraphOpen = getGlobalGraphContainers().some((container) =>
    container.classList.contains("active"),
  )
  if (anyGlobalGraphOpen) {
    hideGlobalGraph()
  } else {
    await openGlobalGraph()
  }
}

function handlePage(slug: FullSlug) {
  addToVisited(simplifySlug(slug))
  renderLocalGraph(slug)

  const handleThemeChange = () => {
    cachedGraphData = null
    const anyOpen = getGlobalGraphContainers().some((container) =>
      container.classList.contains("active"),
    )
    if (anyOpen) {
      hideGlobalGraph()
      void openGlobalGraph()
    } else {
      renderLocalGraph(slug)
    }
  }

  document.addEventListener("themechange", handleThemeChange)
  window.addCleanup(() => {
    document.removeEventListener("themechange", handleThemeChange)
    cleanupLocalGraphs()
    cleanupGlobalGraphs()
  })
}

function onNav(e: CustomEventMap["nav"]) {
  handlePage(e.detail.url)
}

let graphSetup = false

export function setupGraph() {
  if (graphSetup) return
  graphSetup = true

  // this listener must persist for the lifetime of the page — per-page teardown
  // is handled via window.addCleanup inside handlePage
  document.addEventListener("nav", onNav)

  // the nav event that triggered loading this module has already fired by the
  // time the dynamic import resolves, so render for the current page now
  handlePage(getFullSlug(window))
}
