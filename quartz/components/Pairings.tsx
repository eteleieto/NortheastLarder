import { resolveRelative } from "../util/path"
import { parsePairings } from "../util/pairings"
import { classNames } from "../util/lang"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/pairings.scss"

const Pairings: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const pairings = parsePairings(fileData.frontmatter?.pairing)
  if (pairings.length === 0) return null

  return (
    <aside class={classNames(displayClass, "pairings")} aria-labelledby="pairings-title">
      <h2 id="pairings-title">Pairs well with</h2>
      <ul>
        {pairings.map(({ label, slug }) => (
          <li>
            <a href={resolveRelative(fileData.slug!, slug)} class="internal">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

Pairings.css = style

export default (() => Pairings) satisfies QuartzComponentConstructor
