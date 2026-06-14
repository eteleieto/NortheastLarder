# Documentation

This site is our open lab notebook. Every page can link to others, and together they form a web of recipes, experiments, ingredients, and projects.

## Getting around

- **Search**: find anything on the site
- **Browse** (right sidebar): Recipes, Blogs, Experiments, Projects, and the **Graph**, a full map of every page and how they connect
- **Left sidebar**: recent blog posts and notes
- **Contents** and **Backlinks** (right sidebar, on article pages): jump within a page or see what links here

## What's on the site

Pages are mostly experiments, recipes, blog posts, and larger projects. Each page is tagged so you can browse by type:

- **Experiments** — individual tests, trials, and iterations
- **Projects** — broader research threads that group related experiments
- **Recipes** — finished or in-development dishes
- **Blogs** — longer notes and write-ups

## Projects and experiments

**Project pages** (`PROJECT` tag) are overview pages for a line of research. At the bottom of each project page, the site automatically shows a scrollable gallery of related experiments — no need to add card blocks by hand.

To include an experiment in a project's gallery, set `project` in that experiment's frontmatter to a wikilink pointing at the project page:

```yaml
project: "[[Tempeh]]"
```

The link can use the project's title, filename, or slug (e.g. `"[[Amazake Project]]"` or `"[[Umami]]"`). Experiments are sorted newest-first in the gallery.

## Work in progress

Pages whose filename starts with `(WIP)` show an under-construction notice until the write-up is ready. They still appear in the graph and can be linked to normally.

## Contact

Email [info@northeastlarder.com](mailto:info@northeastlarder.com).
