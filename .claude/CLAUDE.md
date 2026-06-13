## Audience

This site is used by Japanese students and their English teachers. UI text should be simple, short, and easy to read. Where appropriate, include Japanese translations alongside English. Avoid complex vocabulary or long sentences in the UI.

## Design Rules

- No emojis.
- No em dashes (—) in normal prose / mid-sentence writing (meta descriptions, body copy, alt text). Use commas, periods, colons, or parentheses. Em dashes are fine as structural separators (page titles like `Page — TakkoTaco`) and UI placeholder glyphs. Code/CSS comments are exempt.
- Do not use gradients.
- Prefer SVG assets.
- If an image is needed, ask the user to provide one or generate one.
- Avoid generic "AI-slop" patterns; make designs feel unique and intentional.

## Tech Stack

- **Framework:** Astro 5 (SSG/SSR), deployed on Cloudflare
- **Language:** TypeScript (strict mode)
- **Styling:** Plain CSS with custom properties (`src/styles/global.css`). No Tailwind, no component library.
- **Package manager:** npm
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Cloudflare Worker deploy:** `npm run deploy:worker`
- **Source layout:** `src/components/`, `src/pages/`, `src/data/`, `src/lib/`, `src/styles/`, `src/assets/`

## Astro CSS Scoping

Astro scopes component styles by adding a unique `data-astro-cid-*` attribute to every element and appending it to every CSS selector (e.g. `.foo` → `.foo[data-astro-cid-xyz]`). A child component's root element only carries **that component's** scope attribute, never the parent's. This means styles written in a parent page/component that target a child component's element **by class name will silently not apply**.

This bites us most often when a component accepts a `class` prop for layout placement (e.g. `<TrainDivider class="train-section-divider" />`): the class lands on the SVG/element, but the parent's scoped `.train-section-divider` rule requires the parent's cid attribute, which that element doesn't have.

**Fix options — pick the right one, don't just reach for `:global()` every time:**

1. **`:global(.classname)` in the parent** — correct for one-off placement overrides (margin, width, position) that are specific to one use context. Keep the selector narrow so it doesn't leak. This is the right call when the parent genuinely owns the placement concern.
2. **Style it inside the component** — if the concern belongs to the component itself (not the specific use site), accept a prop and apply styles inside the component's own `<style>` block where scoping works correctly.
3. **CSS custom properties** — cross component boundaries naturally with no scoping issues. Right for color/size tokens the parent wants to theme.
4. **Wrapper `<div>` in the parent** — the wrapper is rendered by the parent so it carries the parent's cid. Useful when you need several rules targeting the component's context.

**The tell:** if a margin, padding, color, or display rule on a component class simply has no effect, check for the scoping mismatch before anything else. It is almost always this.

## Global CSS Reset Gotchas

`src/styles/global.css` applies a global reset including `img, picture { max-width: 100%; display: block; }`. This silently bites absolutely-positioned, no-explicit-width elements: such a box shrinks-to-fit **clamped to its containing block's width**, so its measured `offsetWidth` (and `translateX(-100%)`) reflect the container, not the real content. An off-screen slide-in animation then starts mid-container instead of fully off-screen — looks like the element "pops in."

**Fix:** give the element `width: max-content` so it sizes to its true content width.

**The tell:** an element that should start fully off-screen (transform/animation) instead appears partway on-screen, and tweaking the transform values does nothing — because the box width itself is wrong.

## SEO & Indexing

The site has a baseline SEO setup that **new pages inherit automatically** — but only if you use the layouts correctly. Be mindful of this whenever you add a page or change `astro.config.mjs`.

- **Always render pages through a layout.** `Layout.astro` (content pages) and `GameLayout.astro` (games/tools) both pull in `src/components/Seo.astro`, which emits the canonical tag, Open Graph + Twitter Card tags, and sitewide JSON-LD. A page that builds its own `<html>` without a layout gets **none** of this.
- **Set a unique `title` and `description` per page.** The layout defaults exist only as a fallback. Game pages especially tend to share the default description — give each one its own. Bilingual (EN + JA) is good where it reads naturally; the audience is JP students.
- **`site` must stay set** to `https://takkotaco.com` in `astro.config.mjs`. Canonical URLs, the sitemap, and absolute OG image URLs all break silently without it.
- **The sitemap is auto-generated** by `@astrojs/sitemap` on every build (`dist/sitemap-index.xml`). Static pages are discovered automatically; **server-rendered pages (`prerender = false`) are not** — add those to `customPages` in the sitemap config by hand (the homepage `/` is already there).
- **Internal/dev/preview pages must be hidden from search.** Pass `noindex` to the layout (e.g. `<Layout title="…" noindex>`) **and** add the route to `NOINDEX_ROUTES` in `astro.config.mjs` (keeps it out of the sitemap) **and** to `public/robots.txt`. All three, or the page leaks into search.
- **Default share image** is `/images/hero/homepage-hero.jpg`. Pass `image="/path.jpg"` to a layout to override per page (use a ~1200×630 asset).
- **After adding pages, run `npm run build`** and glance at `dist/sitemap-0.xml` to confirm the right pages are in (and dev/preview pages are out).

## Workflow Rules

- **Never commit for the user.** They write their own commit messages and run git themselves. At natural stopping points, a brief note that it's a good time to commit is fine — nothing more.
- **Never take screenshots without asking.** If visual verification would help, ask first. The user can check the dev server directly.
