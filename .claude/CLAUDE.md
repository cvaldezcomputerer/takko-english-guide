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

## Workflow Rules

- **Never commit for the user.** They write their own commit messages and run git themselves. At natural stopping points, a brief note that it's a good time to commit is fine — nothing more.
- **Never take screenshots without asking.** If visual verification would help, ask first. The user can check the dev server directly.
