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
  development: number
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

type SearchMatchKind = "title" | "content"

type GraphSearchResult = {
  id: SimpleSlug
  kind: SearchMatchKind
  title: string
  excerpt?: string
}

const NODE_ANIM_MS = 200
const LABEL_ANIM_MS = 100
const HOVER_DIM_ALPHA = 0.2
const HOVER_LABEL_SCALE = 1.1
const DRAG_ALPHA_TARGET = 0.2
const CLICK_DISTANCE_PX = 6
const SEARCH_DIM_ALPHA = 0.12

function normalizeGraphSearch(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function parseGraphSearch(value: string): string[] {
  return [...value.matchAll(/"([^"]+)"|(\S+)/g)]
    .map((match) => normalizeGraphSearch(match[1] ?? match[2] ?? ""))
    .filter(Boolean)
}

function escapeGraphSearchRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function matchesGraphSearch(value: string, terms: string[], wholeWords: boolean): boolean {
  const normalized = normalizeGraphSearch(value)
  return terms.every((term) => {
    if (!wholeWords) return normalized.includes(term)
    const escaped = escapeGraphSearchRegex(term)
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, "iu").test(normalized)
  })
}

function graphContentExcerpt(content: string, terms: string[]): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const normalized = plain.toLocaleLowerCase()
  const firstMatch = Math.min(
    ...terms.map((term) => normalized.indexOf(term)).filter((index) => index >= 0),
  )
  const matchIndex = Number.isFinite(firstMatch) ? firstMatch : 0
  const start = Math.max(0, matchIndex - 48)
  const end = Math.min(plain.length, matchIndex + 112)
  const excerpt = plain.slice(start, end).trim()
  return `${start > 0 ? "…" : ""}${excerpt}${end < plain.length ? "…" : ""}`
}

/** Exponential ease toward target — frame-rate independent, no tween allocations. */
function approach(current: number, target: number, dtMs: number, durationMs: number): number {
  if (durationMs <= 0) return target
  const t = 1 - Math.pow(0.001, dtMs / durationMs)
  const next = current + (target - current) * t
  return Math.abs(next - target) < 0.004 ? target : next
}

const localStorageKey = "graph-visited"
let cachedGraphData: Map<SimpleSlug, ContentDetails> | null = null
const savedGraphSearch = {
  query: "",
  wholeWords: false,
  selectedSlug: null as SimpleSlug | null,
}

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

function noteDevelopmentScore(details: ContentDetails | undefined): number {
  if (!details?.content) return 0

  const content = details.content.trim()
  if (!content) return 0

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const headingCount = content.match(/^#{1,6}\s+\S+/gm)?.length ?? 0
  const mediaCount =
    (content.match(/!\[[^\]]*\]\([^)]+\)/g)?.length ?? 0) +
    (content.match(/!\[\[[^\]]+\]\]/g)?.length ?? 0)

  const wordScore = Math.min(Math.log1p(wordCount) / Math.log1p(1200), 1)
  const headingScore = Math.min(headingCount / 6, 1)
  const mediaScore = Math.min(mediaCount / 3, 1)

  return wordScore * 0.75 + headingScore * 0.15 + mediaScore * 0.1
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
    const details = data.get(url)
    const text = url.startsWith("tags/")
      ? "#" + url.substring(5)
      : stripWipPrefix(details?.title ?? url)
    return { id: url, text, tags: details?.tags ?? [], development: noteDevelopmentScore(details) }
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
    const developmentRadius = d.id.startsWith("tags/") ? 0 : d.development * 5
    return 2 + Math.sqrt(numLinks) * 0.7 + developmentRadius + (d.id === slug ? 4 : 0)
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
    "--graph-title-match",
    "--graph-content-match",
  ] as const
  const computedStyleMap = cssVars.reduce(
    (acc, key) => {
      acc[key] = getComputedStyle(graph).getPropertyValue(key)
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
  let searchMatches: Map<string, SearchMatchKind> | null = null
  let searchResults: GraphSearchResult[] = []
  let selectedSearchIndex = -1
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
    const activeSearchMatches = searchMatches
    const hasSearch = activeSearchMatches !== null

    for (const n of nodeRenderData) {
      const nodeId = n.simulationData.id
      const isSearchMatch = activeSearchMatches?.has(nodeId) ?? false

      if (hasSearch) {
        n.targetGfxAlpha = isSearchMatch ? 1 : SEARCH_DIM_ALPHA
      } else {
        n.targetGfxAlpha =
          hoveredNodeId !== null && focusOnHover ? (n.active ? 1 : HOVER_DIM_ALPHA) : 1
      }

      if (hasSearch) {
        n.targetLabelAlpha = isSearchMatch ? 1 : 0
        n.targetLabelScale = isSearchMatch ? activeScale : defaultScale
      } else if (hoveredNodeId === nodeId) {
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
      if (hasSearch) {
        const sourceMatches = activeSearchMatches.has(l.simulationData.source.id)
        const targetMatches = activeSearchMatches.has(l.simulationData.target.id)
        l.targetAlpha =
          sourceMatches && targetMatches ? 0.55 : sourceMatches || targetMatches ? 0.18 : 0.05
      } else {
        l.targetAlpha = hoveredNodeId ? (l.active ? 1 : HOVER_DIM_ALPHA) : 1
      }
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

  function drawNode(node: NodeRenderData, matchKind?: SearchMatchKind) {
    const nodeData = node.simulationData
    const isTagNode = nodeData.id.startsWith("tags/")
    const isUnresolved = unresolvedNodes.has(nodeData.id)
    const matchColor =
      matchKind === "title"
        ? computedStyleMap["--graph-title-match"]
        : computedStyleMap["--graph-content-match"]

    node.gfx
      .clear()
      .circle(0, 0, nodeRadius(nodeData))
      .fill({
        color: matchKind ? matchColor : isTagNode ? computedStyleMap["--light"] : color(nodeData),
        alpha: isUnresolved ? 0 : 1,
      })

    if (matchKind) {
      node.gfx.stroke({ width: 2.5, color: matchColor })
    } else if (isTagNode) {
      node.gfx.stroke({ width: 2, color: computedStyleMap["--tertiary"] })
    } else if (nodeData.id === slug) {
      node.gfx.stroke({ width: 3, color: computedStyleMap["--secondary"] })
    } else if (isUnresolved) {
      node.gfx.stroke({ width: 1.5, color: computedStyleMap["--gray"] })
    }
  }

  for (const n of graphData.nodes) {
    const nodeId = n.id
    const isUnresolved = unresolvedNodes.has(nodeId)

    const gfx = new Graphics({
      interactive: true,
      label: nodeId,
      eventMode: "static",
      hitArea: new Circle(0, 0, nodeRadius(n)),
      cursor: isUnresolved ? "default" : "pointer",
    })

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
    const nodeRenderDatum: NodeRenderData = {
      simulationData: n,
      gfx,
      label: null,
      active: false,
      targetGfxAlpha: 1,
      targetLabelAlpha: 0,
      targetLabelScale: 1 / scale,
    }
    drawNode(nodeRenderDatum)
    nodeRenderData.push(nodeRenderDatum)
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

  const graphOverlay = graph.closest(".global-graph-outer")
  const searchInput = graphOverlay?.querySelector<HTMLInputElement>(".global-graph-search-input")
  const searchClear = graphOverlay?.querySelector<HTMLButtonElement>(".global-graph-search-clear")
  const searchStatus = graphOverlay?.querySelector<HTMLElement>(".global-graph-search-status")
  const searchLegend = graphOverlay?.querySelector<HTMLElement>(".global-graph-search-legend")
  const titleCountLabel = graphOverlay?.querySelector<HTMLElement>(".global-graph-title-count")
  const contentCountLabel = graphOverlay?.querySelector<HTMLElement>(".global-graph-content-count")
  const resultsPanel = graphOverlay?.querySelector<HTMLElement>(".global-graph-search-results")
  const resultsTotal = graphOverlay?.querySelector<HTMLElement>(".global-graph-results-total")
  const resultsList = graphOverlay?.querySelector<HTMLElement>(".global-graph-results-list")
  const resultPosition = graphOverlay?.querySelector<HTMLElement>(".global-graph-result-position")
  const previousResult = graphOverlay?.querySelector<HTMLButtonElement>(".global-graph-result-prev")
  const nextResult = graphOverlay?.querySelector<HTMLButtonElement>(".global-graph-result-next")
  const wholeWordsButton = graphOverlay?.querySelector<HTMLButtonElement>(
    ".global-graph-whole-words",
  )
  const resetSearch = graphOverlay?.querySelector<HTMLButtonElement>(".global-graph-search-reset")

  function renderSearchResults() {
    if (!resultsList) return
    removeAllChildren(resultsList)

    if (resultsTotal) {
      resultsTotal.textContent = `${searchResults.length} ${searchResults.length === 1 ? "result" : "results"}`
    }
    if (resultPosition) {
      resultPosition.textContent =
        selectedSearchIndex >= 0
          ? `${selectedSearchIndex + 1} of ${searchResults.length}`
          : searchResults.length > 0
            ? "Enter to browse"
            : "No results"
    }
    if (previousResult) previousResult.disabled = searchResults.length === 0
    if (nextResult) nextResult.disabled = searchResults.length === 0

    if (searchResults.length === 0) {
      const empty = document.createElement("p")
      empty.className = "global-graph-results-empty"
      empty.textContent = "No matching pages"
      resultsList.appendChild(empty)
      return
    }

    for (const kind of ["title", "content"] as const) {
      const group = searchResults.filter((result) => result.kind === kind)
      if (group.length === 0) continue

      const label = document.createElement("p")
      label.className = "global-graph-result-group-label"
      label.textContent = `${kind === "title" ? "Title" : "Content"} matches · ${group.length}`
      resultsList.appendChild(label)

      for (const result of group) {
        const index = searchResults.indexOf(result)
        const button = document.createElement("button")
        button.type = "button"
        button.className = "global-graph-result-item"
        button.dataset.searchIndex = index.toString()
        if (index === selectedSearchIndex) {
          button.classList.add("active")
          button.setAttribute("aria-current", "true")
        }

        const title = document.createElement("span")
        title.className = "global-graph-result-title"
        title.textContent = result.title
        button.appendChild(title)

        if (result.excerpt) {
          const excerpt = document.createElement("span")
          excerpt.className = "global-graph-result-excerpt"
          excerpt.textContent = result.excerpt
          button.appendChild(excerpt)
        }

        resultsList.appendChild(button)
      }
    }

    if (selectedSearchIndex >= 0) {
      resultsList
        .querySelector<HTMLElement>(".global-graph-result-item.active")
        ?.scrollIntoView({ block: "nearest" })
    }
  }

  function focusGraphNode(nodeId: SimpleSlug) {
    const node = graphData.nodes.find((candidate) => candidate.id === nodeId)
    if (!node || node.x === undefined || node.y === undefined) return

    const nodeX = node.x + width / 2
    const nodeY = node.y + height / 2
    const panelWidth = resultsPanel?.offsetWidth ?? 0
    const panelHeight = resultsPanel?.offsetHeight ?? 0
    const panelIsBelow = panelWidth > width * 0.7
    const centerX = panelIsBelow ? width / 2 : (width - panelWidth) / 2
    const centerY = panelIsBelow ? (height - panelHeight) / 2 : height / 2
    const focusScale = Math.max(1.05, Math.min(currentTransform.k, 1.5))
    applyTransform(focusScale, centerX - focusScale * nodeX, centerY - focusScale * nodeY)
  }

  function selectSearchResult(direction: 1 | -1, requestedIndex?: number) {
    if (searchResults.length === 0) return
    selectedSearchIndex =
      requestedIndex ??
      (selectedSearchIndex < 0
        ? direction === 1
          ? 0
          : searchResults.length - 1
        : (selectedSearchIndex + direction + searchResults.length) % searchResults.length)
    const result = searchResults[selectedSearchIndex]
    savedGraphSearch.selectedSlug = result.id
    renderSearchResults()
    focusGraphNode(result.id)
    if (searchStatus) {
      searchStatus.textContent = `${selectedSearchIndex + 1} of ${searchResults.length}: ${result.title}`
    }
  }

  const applySearch = (preserveSelection = false) => {
    if (!searchInput) return

    const terms = parseGraphSearch(searchInput.value)
    const hasQuery = terms.length > 0
    const previousSelection = preserveSelection ? savedGraphSearch.selectedSlug : null
    savedGraphSearch.query = searchInput.value
    searchMatches = hasQuery ? new Map<string, SearchMatchKind>() : null
    const titleResults: GraphSearchResult[] = []
    const contentResults: GraphSearchResult[] = []

    if (hasQuery && searchMatches) {
      for (const node of graphData.nodes) {
        const details = data.get(node.id)
        if (!details) continue

        if (matchesGraphSearch(details.title, terms, savedGraphSearch.wholeWords)) {
          searchMatches.set(node.id, "title")
          titleResults.push({ id: node.id, kind: "title", title: details.title })
        } else if (matchesGraphSearch(details.content, terms, savedGraphSearch.wholeWords)) {
          searchMatches.set(node.id, "content")
          contentResults.push({
            id: node.id,
            kind: "content",
            title: details.title,
            excerpt: graphContentExcerpt(details.content, terms),
          })
        }
      }
    }

    const byTitle = (a: GraphSearchResult, b: GraphSearchResult) => a.title.localeCompare(b.title)
    searchResults = [...titleResults.sort(byTitle), ...contentResults.sort(byTitle)]
    selectedSearchIndex = previousSelection
      ? searchResults.findIndex((result) => result.id === previousSelection)
      : -1
    savedGraphSearch.selectedSlug =
      selectedSearchIndex >= 0 ? searchResults[selectedSearchIndex].id : null

    for (const node of nodeRenderData) {
      drawNode(node, searchMatches?.get(node.simulationData.id))
    }

    if (searchClear) searchClear.hidden = searchInput.value.length === 0
    if (searchLegend) searchLegend.hidden = !hasQuery
    if (resultsPanel) resultsPanel.hidden = !hasQuery
    if (wholeWordsButton) {
      wholeWordsButton.setAttribute("aria-pressed", savedGraphSearch.wholeWords.toString())
    }
    const titleCount = titleResults.length
    const contentCount = contentResults.length
    if (titleCountLabel) titleCountLabel.textContent = titleCount.toString()
    if (contentCountLabel) contentCountLabel.textContent = contentCount.toString()
    if (searchStatus) {
      searchStatus.textContent = hasQuery
        ? `${titleCount} title ${titleCount === 1 ? "match" : "matches"} and ${contentCount} content ${contentCount === 1 ? "match" : "matches"}`
        : ""
    }

    renderSearchResults()
    setVisualTargets()
  }

  const clearSearch = () => {
    if (!searchInput) return
    searchInput.value = ""
    savedGraphSearch.query = ""
    savedGraphSearch.selectedSlug = null
    applySearch()
    searchInput.focus()
  }

  const handleSearchKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && searchInput?.value) {
      event.preventDefault()
      event.stopPropagation()
      clearSearch()
    } else if (event.key === "Enter" && searchResults.length > 0) {
      event.preventDefault()
      selectSearchResult(event.shiftKey ? -1 : 1)
    }
  }

  const handleWholeWords = () => {
    savedGraphSearch.wholeWords = !savedGraphSearch.wholeWords
    applySearch(true)
  }

  const handleSearchInput = () => applySearch()
  const handlePreviousResult = () => selectSearchResult(-1)
  const handleNextResult = () => selectSearchResult(1)

  const handleResultClick = (event: MouseEvent) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
      ".global-graph-result-item",
    )
    if (!button?.dataset.searchIndex) return
    selectSearchResult(1, Number(button.dataset.searchIndex))
  }

  searchInput?.addEventListener("input", handleSearchInput)
  searchInput?.addEventListener("keydown", handleSearchKeydown)
  searchClear?.addEventListener("click", clearSearch)
  resetSearch?.addEventListener("click", clearSearch)
  wholeWordsButton?.addEventListener("click", handleWholeWords)
  previousResult?.addEventListener("click", handlePreviousResult)
  nextResult?.addEventListener("click", handleNextResult)
  resultsList?.addEventListener("click", handleResultClick)

  searchInput && (searchInput.value = savedGraphSearch.query)
  applySearch(true)

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
        if (hoveredNodeId === null || searchMatches !== null) {
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
    }

    if (visualAnimating) {
      visualAnimating = stepVisualAnimation(dtMs)
    } else if (simulationActive || dragging) {
      drawLinks()
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
    searchInput?.removeEventListener("input", handleSearchInput)
    searchInput?.removeEventListener("keydown", handleSearchKeydown)
    searchClear?.removeEventListener("click", clearSearch)
    resetSearch?.removeEventListener("click", clearSearch)
    wholeWordsButton?.removeEventListener("click", handleWholeWords)
    previousResult?.removeEventListener("click", handlePreviousResult)
    nextResult?.removeEventListener("click", handleNextResult)
    resultsList?.removeEventListener("click", handleResultClick)
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
let graphReturnFocus: HTMLElement | null = null

function hideGlobalGraph() {
  for (const container of getGlobalGraphContainers()) {
    container.classList.remove("active")
    container.setAttribute("aria-hidden", "true")
  }
  document.body.classList.remove("global-graph-active")
  graphReturnFocus?.focus()
  graphReturnFocus = null

  if (hideGlobalGraphTimer) clearTimeout(hideGlobalGraphTimer)
  hideGlobalGraphTimer = setTimeout(() => {
    cleanupGlobalGraphs()
    hideGlobalGraphTimer = null
  }, GRAPH_PANEL_MS)
}

export async function openGlobalGraph(trigger?: HTMLElement) {
  const containers = getGlobalGraphContainers()
  if (containers.length === 0) return

  if (hideGlobalGraphTimer) {
    clearTimeout(hideGlobalGraphTimer)
    hideGlobalGraphTimer = null
    cleanupGlobalGraphs()
  }

  const currentSlug = getFullSlug(window)
  graphReturnFocus =
    trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
  document.body.classList.add("global-graph-active")
  globalGraphCleanups.push(() => document.body.classList.remove("global-graph-active"))

  for (const container of containers) {
    container.classList.add("active")
    container.setAttribute("aria-hidden", "false")

    const graphContainer = container.querySelector(".global-graph-container") as HTMLElement
    const closeButton = container.querySelector(".global-graph-close") as HTMLElement
    const searchInput = container.querySelector(".global-graph-search-input") as HTMLInputElement
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

    window.setTimeout(() => (searchInput ?? closeButton)?.focus(), 250)
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
