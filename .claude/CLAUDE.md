## Audience

This site is used by Japanese students and their English teachers. UI text should be simple, short, and easy to read. Where appropriate, include Japanese translations alongside English. Avoid complex vocabulary or long sentences in the UI.

## Design Rules

- No emojis.
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

## Workflow Rules

- **Never commit for the user.** They write their own commit messages and run git themselves. At natural stopping points, a brief note that it's a good time to commit is fine — nothing more.
- **Never take screenshots without asking.** If visual verification would help, ask first. The user can check the dev server directly.
