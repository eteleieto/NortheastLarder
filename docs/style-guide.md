# Northeast Larder — Style Guide & Brand Reference

This document describes the visual language, layout system, and interaction patterns for [northeastlarder.com](https://northeastlarder.com). It reflects the site as built on **Quartz 4** with custom SCSS in `quartz/styles/` and `quartz/components/styles/`.

Use this guide when authoring content, adding components, or extending the theme so new work stays consistent with what is already on the site.

---

## Brand identity

**Northeast Larder** is an independent food lab and open-source research notebook. The site should feel like a **quiet, scholarly workspace** — not a marketing site or a social feed.

| Principle | What it means in practice |
|-----------|---------------------------|
| **Readable first** | Body copy is sans (DM Sans), generous line-height, minimal decoration. |
| **Structure without shouting** | Display titles use Newsreader at regular weight; UI labels use DM Sans. Sidebars use `.rail-label`, not heading tags. |
| **Warm neutrals** | Earthy browns and creams — not cold grays or high-contrast tech palettes. |
| **Links are honest** | In-article wikilinks are underlined text, not pills or buttons. Cards and nav are the exceptions. |
| **Hierarchy through tone** | Titles are dark; dates, metadata, and previews are muted gray — never competing with titles. |

**Logo:** Fern mark (`static/logo.png` / `logo.svg`), linked home from the left rail. No wordmark in the header — the logo alone is the brand lockup.

**Voice (content):** Direct, research-oriented, first-person plural where appropriate. The home intro sets the tone: *“We're an independent food lab… This is our open source notebook.”*

---

## Color palette

Colors are defined in [`quartz.config.ts`](../quartz.config.ts) and exposed as CSS variables (`--light`, `--dark`, etc.). Light mode is the primary design target.

### Light mode

| Token | Hex | Role |
|-------|-----|------|
| `--light` | `#ffffff` | Page background, card fill, drawer background |
| `--lightgray` | `#f8f5ef` | Panel tint, borders, subtle fills |
| `--gray` | `#d8cbb8` | **Muted text** — dates, metadata, card borders, separators |
| `--darkgray` | `#3a3430` | Secondary body tone, tag links, footnotes |
| `--dark` | `#000000` | Primary text, headings, nav links |
| `--secondary` | `#473d33` | **Interactive accent** — hover states, active graph node, blockquote border |
| `--tertiary` | `#a1887f` | Visited graph nodes, softer accent |
| `--highlight` | `rgba(188, 174, 153, 0.3)` | Search match highlight |
| `--textHighlight` | `#fffacd88` | Text selection / mark highlight |

### Dark mode

Dark mode inverts the warm palette (deep brown backgrounds, cream text). Typography and component rules are shared; only token values change. Syntax highlighting uses `github-dark`.

### Semantic / special colors

| Use | Value | Where |
|-----|-------|-------|
| Card description | `color-mix(in srgb, var(--darkgray) 65%, var(--light))` | Tag grid previews (~`#7f7a77` in light mode) |
| Hamburger overlay | `rgba(0, 0, 0, 0.5)` | Mobile menu backdrop |
| Card shadow | `0 1px 4px rgba(0,0,0,0.07)` | Default; stronger on hover |

---

## Typography

### Font families

| Role | Family | Weights | Usage |
|------|--------|---------|--------|
| **Body** | DM Sans | 400, 500 (+ italic) | Paragraphs, lists, footer, sidebar links, `h3`–`h6`, card titles |
| **Display headings** | Newsreader | 400, 500, 600 (+ italic) | `h1`, `h2`, article titles |
| **UI labels** | DM Sans | 500 | `.rail-label`, mobile drawer section headers |
| **Title / logo area** | DM Sans | 400, 500 | `.page-title` (logo container) |
| **Code** | IBM Plex Mono | — | `pre`, inline code, code block titles |

Loaded via Google Fonts (`fontOrigin: "googleFonts"`).

### Type scale (content column)

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Body | `1.0625rem` (~17px) | 400 | Line-height `1.72`; antialiased |
| **Home intro** (`.home-intro`) | `1.35rem` (mobile `1.25rem`) | 400 | Between title and body scale |
| **h1** | `1.875rem` | 400 | Newsreader; home h1 same size |
| **h2** | `1.375rem` | 400 | Newsreader section headers |
| **h3** | `1.125rem` | 500 | DM Sans subsections |
| **h4–h6** | `1rem` | 500 | DM Sans |
| **Footnotes** | `0.95rem` | 400 | `--darkgray` |
| **strong** | inherit | **500** | Inline emphasis |

### Muted / meta text

Always use **`@include meta-muted`** (or the equivalent `color-mix`) for dates and low-priority metadata:

- `.content-meta` (article header)
- `.recent-notes .meta` (sidebar)
- `.grid-item-meta` / `.card-item-meta`
- `.section .meta` (list rows on tag pages)

Preview/description text uses the mid-gray mix (see above), not `--darkgray` alone.

### Sidebar typography (CSS variables)

Set on `.sidebar` in [`base.scss`](../quartz/styles/base.scss):

| Variable | Desktop | Mobile sidebar |
|----------|---------|----------------|
| `--sidebar-section-size` | `1.12rem` | `1.05rem` |
| `--sidebar-link-size` | `1.05rem` | `1rem` |
| `--sidebar-meta-size` | `0.875rem` | `0.8125rem` |
| `--sidebar-link-line-height` | `1.55` | `1.55` |
| `--sidebar-section-gap` | `0.75rem` | — |
| `--sidebar-item-gap` | `0.55rem` | — |

**Mobile full-screen drawer** overrides these for larger tap targets (`--sidebar-link-size: 1.15rem`; Pages links at `1.45rem` header font).

---

## Layout

### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| **Mobile** | ≤ 800px | Single column; top bar (logo + search icon + hamburger); graph full-width above footer |
| **Tablet** | 801px – 1199px | Left rail + center; right rail stacks below content |
| **Desktop** | ≥ 1200px | **Three columns:** 240px \| fluid center \| 240px |

Defined in [`variables.scss`](../quartz/styles/variables.scss).

### Page grid (desktop)

```
┌─────────────┬──────────────────────────┬─────────────┐
│  Left rail  │         Center           │ Right rail  │
│  (240px)    │    (article / cards)     │  (240px)    │
│             │                          │             │
│  Logo       │                          │  Search     │
│  Recents    │                          │  Browse     │
│             │                          │  TOC / etc. │
├─────────────┴──────────────────────────┴─────────────┤
│                      Footer                         │
└─────────────────────────────────────────────────────┘
```

- Sidebars are **sticky** (`height: 100vh`) on desktop with `$topSpacing` (`3.5rem`) top padding.
- Center column gets `$topSpacing` top padding when the title lives inside `<article>` (landing pages).
- Page horizontal margin: `2rem` on desktop; centered on smaller viewports.

### Card grids

`.grid-container` / `.card-list-container`:

- **3 columns** ≥ 1200px (gap `2rem`)
- **2 columns** 801–1199px (gap `1.5rem`)
- **1 column** ≤ 800px (gap `1rem`)

Used on the home page (Current Projects), tag listing pages, and anywhere `GridPageList` or card-list markdown is used.

---

## Navigation

Navigation is **distributed**, not a single top bar. Know which surface owns which links.

### Desktop & tablet

| Location | Contents |
|----------|----------|
| **Left rail** | Logo, Recent Blog Posts, Recent Notes |
| **Right rail** | Search, Browse (Recipes / Blogs / Experiments / Projects [+ Graph on non-home pages]), Table of Contents, Backlinks; **Graph preview on home only** |
| **Home intro** | Inline links: about us, for restaurants, the documentation |
| **Footer (row 1)** | About Us · For Restaurants · Documentation · Bookshelf · Graph |
| **Footer (row 2)** | Instagram · email · copyright |

Browse is **hidden on mobile** below the content (drawer only).

### Mobile (≤ 800px)

| Location | Contents |
|----------|----------|
| **Top bar** | Logo · search icon · hamburger |
| **Full-screen drawer** | **Pages** → About Us, For Restaurants, Documentation, Bookshelf · **Browse** → tag categories · **Recent Blog Posts** · **Recent Notes** |
| **Below content** | Graph preview (full width, ~16rem tall) — no Browse panel |
| **Footer** | Same two-row structure as desktop |

Drawer sections are separated by `1px solid var(--lightgray)` dividers. Close control: fixed ✕ top-right.

### Rail labels vs headings

Sidebar section titles use **`<div class="rail-label">`** (or `<span>` inside toggle buttons), **not** `h2`/`h3`. This keeps one clear document outline in the center column.

Applies to: Recent Blog Posts, Recent Notes, Browse, Graph, Contents, Backlinks.

---

## Links & interactive text

Four link treatments — do not mix them up.

### 1. Article wikilinks

**Scope:** `article`, `.preview-inner`, `.popover-inner` — internal links except card wrappers.

- Color: `var(--darkgray)`
- **Underlined** (`1px`, offset `0.15em`, muted underline color)
- Hover: `var(--secondary)` + underline matches
- **No** background pill, padding, or bold weight

### 2. Sidebar & footer nav

- No underline
- Color: `var(--dark)` → hover `var(--secondary)`
- Body font (DM Sans), normal weight

### 3. Card links

- Entire card is clickable; **no underline**
- Border `1px solid var(--gray)` → hover `var(--secondary)` + light shadow
- Title hover: `var(--secondary)`

### 4. Default / external links

Base [`base.scss`](../quartz/styles/base.scss): `color: var(--secondary)`, no underline unless `.internal`. External links show a small inline icon.

### Tags

- In content meta: `#` prefix via CSS, `0.82rem`, `var(--darkgray)`, no pill

---

## Components

### Home page

Structure in [`content/index.md`](../content/index.md):

1. **h1** — Welcome title (HTML in markdown)
2. **`.home-intro`** paragraphs — two short lines + one line with inline nav links
3. **h2** — “Current Projects”
4. **Card grid** — project pages only (no nav-as-cards)

On desktop, the home article spans grid rows 1–2 so the title aligns with the logo row.

### Content cards

| Part | Style |
|------|--------|
| Container | White fill, `$radius-md` (4px), gray border, light shadow |
| Optional image | Background at 45% opacity + 72% white overlay (`::after`) |
| Date | `0.85rem`, `var(--gray)` |
| Title | DM Sans, `1.0625rem`, weight 500 |
| Description | `0.9rem`, mid-gray mix, max 3 lines clamped |

### Article header

`.content-meta`: date, optional author, tags — single row, `0.9rem`, `var(--gray)`, middots between segments.

### Search modal

- Split pane on desktop: results list | preview
- Preview pane padding: `1.5rem 2rem 2rem`
- Preview wikilinks follow **article link** rules (underlined)
- Match highlight: `--highlight` / `--tertiary` blend

### Graph

- **Preview** (right rail / mobile footer): 200px height desktop, 16rem mobile full width
- **Global overlay:** fit-all-nodes on open (`fitView: true`)
- **Unresolved wikilinks:** hollow gray circles, **not clickable** (no 404 navigation)
- Current page node: `--secondary` fill; visited: `--tertiary`

### Footer

Two rows, left-aligned, `opacity: 0.75`, top border `var(--lightgray)`:

1. **Nav row** — primary site links + Graph button
2. **Meta row** — `0.875rem`, `var(--darkgray)` — social, email, copyright

Separators: middle dot `·` in `var(--gray)`.

### 404 page

Same **three-column layout and sidebars** as other pages; center shows custom not-found copy with link home.

### Blockquotes

Left border `3px solid var(--secondary)`; standard body typography.

### Code

- Blocks: IBM Plex Mono, `var(--lightgray)` border, `$radius-sm`
- Shiki themes: `github-light` / `github-dark`

---

## Spacing & shape

| Token | Value | Use |
|-------|-------|-----|
| `$topSpacing` | `3.5rem` | Sidebar top padding; article top (when applicable) |
| `$sidePanelWidth` | `240px` | Left/right rails |
| `$meta-sm` | `0.875rem` | Sidebar meta, footer meta, card dates, content tags |
| `$meta-md` | `0.9rem` | Content meta, card descriptions, footer base |
| `$radius-sm` | `3px` | Code blocks, small controls |
| `$radius-md` | `4px` | Cards, search button, graph panels |
| `$shadow-sm` / `$shadow-md` / `$shadow-overlay` | — | Cards; search/graph overlay panels |
| `$transition-fast` / `$transition-base` / `$transition-panel` | 0.15–0.25s | Links, cards, panels |

Corners are **subtle** — almost square. No heavy rounding or glassmorphism.

---

## Motion

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Link / nav color | 0.15–0.2s | ease |
| Card border/shadow | 0.2s | ease |
| Sidebar section fold | 0.3s | ease (chevron rotate) |
| Mobile drawer | 0.25s | opacity fade |
| Heading anchor links | 0.2s | opacity (show on hover) |
| Graph hover | 200ms | tween alpha |

Avoid bouncy or large-scale motion; the site should feel stable.

---

## Content authoring conventions

### Markdown / Obsidian

- Use **`[[wikilinks]]`** for internal references; unresolved links appear in the graph as hollow nodes.
- Tag pages drive Browse categories: `RECIPE`, `BLOG`, `EXPERIMENT`, `PROJECT`, etc.
- Card rows in markdown: `||` (with images) or `|||` (no images) — see home page projects grid.
- Landing pages (`index`, About-Us, For-Restaurants, Documentation, Bookshelf): provide own h1 in body; auto title suppressed.

### Home intro links

Use plain HTML with `class="internal"` inside `.home-intro` for inline navigation prose.

### Dates

Frontmatter dates flow to all meta surfaces automatically; no extra styling needed in markdown.

---

## File map (for maintainers)

| Concern | Primary files |
|---------|----------------|
| Theme colors & fonts | [`quartz.config.ts`](../quartz.config.ts) |
| Breakpoints, grid, type base, meta mixin | [`quartz/styles/variables.scss`](../quartz/styles/variables.scss), [`base.scss`](../quartz/styles/base.scss) |
| Overlay panel chrome | [`panels.scss`](../quartz/styles/panels.scss) |
| Site-specific overrides | [`custom.scss`](../quartz/styles/custom.scss) |
| Sidebar & rails | [`sidebar.scss`](../quartz/styles/sidebar.scss) |
| Layout wiring | [`quartz.layout.ts`](../quartz.layout.ts) |
| Cards | [`components/styles/cards.scss`](../quartz/components/styles/cards.scss) |
| Footer | [`components/styles/footer.scss`](../quartz/components/styles/footer.scss) |
| Search | [`components/styles/search.scss`](../quartz/components/styles/search.scss) |
| Mobile menu | [`components/styles/hamburgerMenu.scss`](../quartz/components/styles/hamburgerMenu.scss) |
| Article meta | [`components/styles/contentMeta.scss`](../quartz/components/styles/contentMeta.scss) |
| Graph | [`components/styles/graph.scss`](../quartz/components/styles/graph.scss), [`graph.inline.ts`](../quartz/components/scripts/graph.inline.ts) |

Compiled output: `public/index.css` (single bundle).

---

## Audit notes (known patterns & consistency)

These were reviewed during the style audit; keep them in mind when extending the site.

1. **Link styles are context-specific** — article underlines ≠ sidebar plain links ≠ cards. Do not apply global `a { underline }` without scoping.
2. **Dates use `@include meta-muted`** — raw `--gray` alone is too faint; the mixin mixes gray + darkgray for readable metadata.
3. **Descriptions need the mid-gray mix** — raw `--darkgray` is too strong next to card titles.
4. **Document headings live in the center column only** — rails use `.rail-label` for accessibility and outline clarity.
5. **Mobile Browse lives in the drawer only** — right-rail Browse is `DesktopOnly`; Backlinks is also `DesktopOnly`.
6. **Graph unresolved nodes** — intentional Obsidian-style “future pages”; styled hollow and non-navigable.
7. **Folder and tag listings both use card grids** — `GridPageList` everywhere; row list (`PageList`) is legacy.
8. **Overlay panels share one chrome** — search, graph, and popovers use `panels.scss` mixins (white fill, warm shadow, `$radius-md`).

---

## Quick reference — “what do I use for…?”

| I need to… | Use |
|------------|-----|
| Muted date | `@include meta-muted` in SCSS |
| Card preview text | `color-mix(in srgb, var(--darkgray) 65%, var(--light))` |
| Nav / hover accent | `var(--secondary)` |
| Section label in sidebar | `.rail-label` + DM Sans |
| In-article link | underlined, `var(--darkgray)` |
| Primary body text | DM Sans 1.0625rem / 1.72 |
| Subtle border | `1px solid var(--lightgray)` or `var(--gray)` on cards |
| WIP tag | `#c47a7a`, no pill |

---

*Last updated to reflect the site after navigation, typography, graph, search, and 404 layout work. Regenerate or extend this doc when changing `quartz.config.ts` or the custom SCSS layer.*
