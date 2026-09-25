/** "LACTO-FERMENT" -> "Lacto Ferment": how tags read wherever they're displayed. */
export function formatTag(tag: string): string {
  return tag
    .replace(/[-_]+/g, " ")
    .toLocaleLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

// Display titles for tag listing pages (shared by the tag pages and their OG cards).
export const getCustomTitle = (tag: string): string => {
  const customTitles: Record<string, string> = {
    PROJECT: "Projects",
    EXPERIMENT: "Experiments",
    INGREDIENT: "Ingredients",
    TECHNIQUE: "Techniques",
    BLOG: "Blogs",
    EVENT: "Events",
    RECIPE: "Recipes",
    IDEA: "Ideas",
    SOURCE: "Sources",
  }
  return customTitles[tag] || formatTag(tag)
}
