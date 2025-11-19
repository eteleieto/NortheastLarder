import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ProjectLink: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const project = fileData.frontmatter?.project as string | undefined
  if (!project) return null

  // Remove any braces (e.g., [[Tempeh]] -> Tempeh)
  const cleanProject = project.replace(/[\[\]]/g, '')

  return (
    <p class="project-ref">
      This is part of Project {cleanProject}
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


