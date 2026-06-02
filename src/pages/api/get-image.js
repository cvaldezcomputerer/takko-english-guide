export const prerender = false;

const UTM_SOURCE = "dog_site";

function withUnsplashReferral(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", UTM_SOURCE);
    parsed.searchParams.set("utm_medium", "referral");
    return parsed.toString();
  } catch {
    return url;
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Read API keys from Cloudflare env (production) or process.env (local/node).
function getKeys(context) {
  const runtimeEnv = context.locals?.runtime?.env || {};
  return {
    GIPHY_KEY: runtimeEnv.GIPHY_KEY || import.meta.env.GIPHY_KEY || process.env.GIPHY_KEY,
    UNSPLASH_KEY: runtimeEnv.UNSPLASH_KEY || import.meta.env.UNSPLASH_KEY || process.env.UNSPLASH_KEY,
  };
}

async function fetchGiphyCat(url, key) {
  if (!key) throw new Error("Missing Giphy Key");
  const tag = url.searchParams.get("tag") || "funny cat";
  // Random offset gives more variety than the 'random' endpoint.
  const offset = Math.floor(Math.random() * 50);
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${tag}&limit=1&offset=${offset}&rating=g`
  );
  const data = await res.json();
  return { url: data.data?.[0]?.images?.original?.url };
}

async function fetchUnsplash(url, key) {
  if (!key) throw new Error("Missing Unsplash Key");
  const query = url.searchParams.get("query");
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${query}&orientation=squarish&content_filter=high&featured=true&client_id=${key}`,
    { headers: { "Accept-Version": "v1" } }
  );
  const data = await res.json();
  return {
    source: "unsplash",
    url: data.urls?.small,
    attribution: {
      photographerName: data.user?.name || "Unknown",
      photographerUrl: withUnsplashReferral(data.user?.links?.html),
      photoUrl: withUnsplashReferral(data.links?.html),
      unsplashUrl: withUnsplashReferral("https://unsplash.com/"),
    },
  };
}

export async function GET(context) {
  const url = new URL(context.request.url);
  const type = url.searchParams.get("type"); // 'giphy-cat' or 'unsplash'
  const { GIPHY_KEY, UNSPLASH_KEY } = getKeys(context);

  try {
    if (type === "giphy-cat") return json(await fetchGiphyCat(url, GIPHY_KEY));
    if (type === "unsplash") return json(await fetchUnsplash(url, UNSPLASH_KEY));
    return json({ error: "Invalid type" }, 400);
  } catch (error) {
    console.error("API Error:", error);
    return json({ error: error.message }, 500);
  }
}
