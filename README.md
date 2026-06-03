# dog_SITE

Classroom activity site for Japanese students and their English teachers.

Built with [Astro](https://astro.build) and deployed on Cloudflare.

## Styling

All design tokens (colors and fonts) live in a single `:root` block in
[`src/styles/global.css`](src/styles/global.css). This is the **single source of
truth** — consume tokens with `var(--token)`, and add any new shared value there.

**Do not redefine `--color-*` or `--font-*` inside a page or component.** Earlier
versions did this, and the values drifted (the games section ended up a different
green from the rest of the site). If you find a per-page token override, fold it
back into `global.css`.

Brand palette: green `--color-primary`, tan `--color-secondary`, terracotta
`--color-accent`, shrine red `--color-torii`, dialect purple `--color-dialect`,
warm off-white `--color-bg`. Fonts: `--font-main` (Fredoka) for headings,
`--font-hand` (Patrick Hand) for handwritten accents, `--font-body` (Andika) for
body text.

### Avoiding the "AI-generated" look

This site was originally AI-scaffolded and is being deliberately steered away from
generic "AI-slop" patterns. When adding UI, avoid the tells and keep it intentional:

- **No gradients, no emojis.** Prefer hand-made SVG over stock/AI imagery. (See also
  the design rules in [`CLAUDE.md`](CLAUDE.md).)
- **Don't use the default floating-card pattern** — uniform 16px radius + soft drop
  shadow + `translateY(-4px)` hover. Cards use the site's tactile "sticker" style
  instead: a hard offset shadow that the element presses into on hover (see
  `.site-card` and the CTA buttons in [`src/pages/index.astro`](src/pages/index.astro)).
- **Stay specific and local.** The personality comes from real Takko content
  (dialect, shrines, local weather) and custom SVGs — not generic filler.

## TODO

- **TakkoMap** (`src/components/TakkoMap.astro`) — interactive map component, built but not yet wired up to a page. Planned for future use.
