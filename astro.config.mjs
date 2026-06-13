// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// Pages that exist for development/preview only. They stay reachable by URL
// (and carry a noindex meta tag) but must not appear in the sitemap.
const NOINDEX_ROUTES = [
  '/dev',
  '/sound-preview',
  '/vocab-preview',
  '/train-preview',
];

// https://astro.build/config
export default defineConfig({
  site: 'https://takkotaco.com',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '') || '/';
        return !NOINDEX_ROUTES.includes(path);
      },
      // The homepage is server-rendered (prerender = false) so the sitemap
      // integration can't auto-discover it. Inject it explicitly.
      customPages: ['https://takkotaco.com/'],
    }),
  ],
});
