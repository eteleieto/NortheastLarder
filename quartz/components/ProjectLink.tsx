import { FullSlug, resolveRelative, slugTag } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { stripWipPrefix } from "../util/wip"

const ProjectLink: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const project = fileData.frontmatter?.project as string | undefined
  if (!project) return null

  // Remove any braces (e.g., [[Tempeh]] -> Tempeh)
  const cleanProject = project.replace(/[\[\]]/g, "")
  const displayProject = stripWipPrefix(cleanProject)

  // Use cleaned project name (without braces) to generate the link
  const projectSlug = slugTag(cleanProject) as FullSlug
  const href = resolveRelative(fileData.slug!, projectSlug)

  return (
    <p class="project-ref">
      This is part of Project{" "}
      <a href={href} class="internal">
        {displayProject}
      </a>
    </p>
  )
}

ProjectLink.css = `
.project-ref {
  margin-top: 0;
  margin-bottom: 0.75rem;
}
`

export default (() => ProjectLink) satisfies QuartzComponentConstructor
