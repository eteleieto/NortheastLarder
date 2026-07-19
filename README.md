# Developing w/ Northeast Larder

Based on Quartz

Install dependencies: **npm i**

Run locally: **npm run dev** (fast rebuilds; skips OG image generation)

Production build: **npx quartz build**

## Card image overrides

Cards normally use the first image in a page. To choose a different cover without moving images in the article, set `cardImage` in the page frontmatter:

```yaml
cardImage: Assets/Attachments/Example.webp
```

The path is relative to `content`. This controls homepage, project, and list-card thumbnails; it does not insert an image into the article.

https://northeastlarder.com/
