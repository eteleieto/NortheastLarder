import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/graph.loader.inline"
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
    drag: false,
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
      <div class={classNames(displayClass, "graph", showPreview ? "graph--preview" : "")}>
        {showPreview && (
          <>
            <div class="rail-label">{i18n(cfg.locale).components.graph.title}</div>
            <div class="graph-outer">
              <button
                type="button"
                class="global-graph-icon graph-open"
                aria-label="Open full graph"
              >
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M15 3h6v6"></path>
                  <path d="M9 21H3v-6"></path>
                  <path d="m21 3-7 7"></path>
                  <path d="m3 21 7-7"></path>
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
                <div class="panel-header global-graph-header">
                  <span class="panel-header-title">{i18n(cfg.locale).components.graph.title}</span>
                  <button type="button" class="global-graph-close" aria-label="Close">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
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
