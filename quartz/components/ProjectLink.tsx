import { FullSlug, resolveRelative, slugTag } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ProjectLink: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const project = fileData.frontmatter?.project as string | undefined
  if (!project) return null

  const projectSlug = slugTag(project) as FullSlug
  const href = resolveRelative(fileData.slug!, projectSlug)

  return (
    <p class="project-ref">
      This is part of <a href={href} class="internal">{project} project</a>
    </p>
  )
}

ProjectLink.css = `
.project-ref {
  margin-top: 0;
  margin-bottom: 1rem;
}
`

export default (() => ProjectLink) satisfies QuartzComponentConstructor


