import { FullSlug, resolveRelative, slugTag } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ProjectLink: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const project = fileData.frontmatter?.project as string | undefined
  if (!project) return null

  // Remove any braces (e.g., [[Tempeh]] -> Tempeh)
  const cleanProject = project.replace(/[\[\]]/g, '')
  
  // Use cleaned project name (without braces) to generate the link
  const projectSlug = slugTag(cleanProject) as FullSlug
  const href = resolveRelative(fileData.slug!, projectSlug)

  return (
    <p class="project-ref">
      This is part of Project <a href={href} class="internal">{cleanProject}</a>
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


