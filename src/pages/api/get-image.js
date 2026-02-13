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

export async function GET(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // 'giphy-cat' or 'unsplash'
  const query = url.searchParams.get("query"); // e.g. 'fruit'

  // Access Cloudflare environment variables correctly
  const runtimeEnv = context.locals?.runtime?.env || {};

  // Load keys from Cloudflare 'env' object (production) or process.env (local/node)
  const GIPHY_KEY = runtimeEnv.GIPHY_KEY || import.meta.env.GIPHY_KEY || process.env.GIPHY_KEY;
  const UNSPLASH_KEY = runtimeEnv.UNSPLASH_KEY || import.meta.env.UNSPLASH_KEY || process.env.UNSPLASH_KEY;

  if (type === "giphy-cat" && !GIPHY_KEY) {
    console.error("Giphy API call failed: GIPHY_KEY is missing in the current environment.");
  }
  if (type === "unsplash" && !UNSPLASH_KEY) {
    console.error("Unsplash API call failed: UNSPLASH_KEY is missing in the current environment.");
  }

  try {
    if (type === "giphy-cat") {
      if (!GIPHY_KEY) throw new Error("Missing Giphy Key");
      const tag = url.searchParams.get("tag") || "funny cat";
      // Use a random offset to get more variety from the search endpoint instead of just 'random'
      const offset = Math.floor(Math.random() * 50);
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${tag}&limit=1&offset=${offset}&rating=g`
      );
      const data = await res.json();
      return new Response(JSON.stringify({ url: data.data?.[0]?.images?.original?.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } 
    
    else if (type === "unsplash") {
      if (!UNSPLASH_KEY) throw new Error("Missing Unsplash Key");
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${query}&orientation=squarish&content_filter=high&featured=true&client_id=${UNSPLASH_KEY}`,
        {
          headers: {
            "Accept-Version": "v1",
          },
        }
      );
      const data = await res.json();
      return new Response(JSON.stringify({
        source: "unsplash",
        url: data.urls?.small,
        attribution: {
          photographerName: data.user?.name || "Unknown",
          photographerUrl: withUnsplashReferral(data.user?.links?.html),
          photoUrl: withUnsplashReferral(data.links?.html),
          unsplashUrl: withUnsplashReferral("https://unsplash.com/"),
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
