export const prerender = false;

// Live weather for the home page card. We proxy Open-Meteo through our own
// edge endpoint so every visitor is served from Cloudflare's cache instead of
// hitting Open-Meteo directly — one real upstream call per ~15 min per edge,
// not one per student.
const API =
  'https://api.open-meteo.com/v1/forecast?latitude=40.32&longitude=141.20&current=temperature_2m,weathercode,apparent_temperature&timezone=Asia/Tokyo';

const TTL = 900; // 15 minutes, in seconds

export async function GET() {
  try {
    // cacheEverything + cacheTtl tells the Cloudflare edge to cache this
    // upstream response for TTL seconds and reuse it for all later requests.
    const upstream = await fetch(API, {
      cf: { cacheTtl: TTL, cacheEverything: true },
    });
    if (!upstream.ok) throw new Error('HTTP ' + upstream.status);

    const body = await upstream.text();
    return new Response(body, {
      headers: {
        'content-type': 'application/json',
        // Tell browsers/CDN they may reuse this response for TTL seconds too.
        'cache-control': `public, max-age=${TTL}, s-maxage=${TTL}`,
      },
    });
  } catch (err) {
    // Keep the failure shape simple — the browser widget falls back to its
    // own cached reading (or the error card) when this isn't a 200.
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
