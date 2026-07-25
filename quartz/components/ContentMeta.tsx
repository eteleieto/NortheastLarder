import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"
import style from "./styles/contentMeta.scss"

function normalizeTags(tags: unknown): string[] {
  if (!tags) return []
  if (typeof tags === "string") return [tags]
  if (Array.isArray(tags)) return tags.filter((tag): tag is string => typeof tag === "string")
  return []
}

function formatTag(tag: string): string {
  return tag
    .replace(/[-_]+/g, " ")
    .toLocaleLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

export default (() => {
  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const date = fileData.dates ? getDate(cfg, fileData) : undefined
    const author = fileData.frontmatter?.author
    const tags = normalizeTags(fileData.frontmatter?.tags)

    if (!date && !author && tags.length === 0) {
      return null
    }

    return (
      <div class={classNames(displayClass, "content-meta")}>
        {date && <Date date={date} locale={cfg.locale} />}
        {author && typeof author === "string" && (
          <span class="content-meta-author">by {author}</span>
        )}
        {tags.length > 0 && (
          <div class="content-meta-taxonomy">
            <span class="content-meta-taxonomy-label">Filed under</span>
            <ul class="tags" aria-label="Page categories">
              {tags.map((tag) => (
                <li>
                  <a
                    href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                    class="internal tag-link"
                  >
                    {formatTag(tag)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  ContentMetadata.css = style

  return ContentMetadata
}) satisfies QuartzComponentConstructor
