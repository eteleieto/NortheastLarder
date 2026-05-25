import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/graph.inline"
import style from "./styles/graph.scss"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

export interface D3Config {
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

interface GraphOptions {
  preview?: boolean
  localGraph: Partial<D3Config> | undefined
  globalGraph: Partial<D3Config> | undefined
}

const defaultOptions: GraphOptions = {
  preview: false,
  localGraph: {
    drag: true,
    zoom: true,
    depth: -1,
    scale: 0.55,
    repelForce: 0.5,
    centerForce: 0.2,
    linkDistance: 30,
    fontSize: 0.6,
    opacityScale: 1,
    showTags: false,
    removeTags: [],
    focusOnHover: true,
    enableRadial: true,
    fitView: true,
  },
  globalGraph: {
    drag: true,
    zoom: true,
    depth: -1,
    scale: 0.9,
    repelForce: 0.5,
    centerForce: 0.2,
    linkDistance: 30,
    fontSize: 0.6,
    opacityScale: 1,
    showTags: false,
    removeTags: [],
    focusOnHover: true,
    enableRadial: true,
    fitView: false,
  },
}

export default ((opts?: Partial<GraphOptions>) => {
  const Graph: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const options = { ...defaultOptions, ...opts }
    const showPreview = options.preview ?? false
    const localGraph = { ...defaultOptions.localGraph, ...options.localGraph }
    const globalGraph = { ...defaultOptions.globalGraph, ...options.globalGraph }

    return (
      <div class={classNames(displayClass, "graph", showPreview && "graph--preview")}>
        {showPreview && (
          <>
            <h3>{i18n(cfg.locale).components.graph.title}</h3>
            <div class="graph-outer">
              <button
                type="button"
                class="global-graph-icon graph-open"
                aria-label="Open full graph"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
              <div class="graph-container" data-cfg={JSON.stringify(localGraph)}></div>
            </div>
          </>
        )}
        {!showPreview && (
          <div class="global-graph-outer" aria-hidden="true">
            <div class="global-graph-space">
              <div class="global-graph-panel">
                <button type="button" class="global-graph-close" aria-label="Close">
                  ×
                </button>
                <div class="global-graph-container" data-cfg={JSON.stringify(globalGraph)}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  Graph.css = style
  Graph.afterDOMLoaded = script

  return Graph
}) satisfies QuartzComponentConstructor
