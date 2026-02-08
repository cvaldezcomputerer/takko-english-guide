export const prerender = false;

export async function GET({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // 'giphy-cat' or 'unsplash'
  const query = url.searchParams.get("query"); // e.g. 'fruit'

  // Load keys from Cloudflare 'env' object (production) or process.env (local)
  const GIPHY_KEY = env?.GIPHY_KEY || import.meta.env.GIPHY_KEY;
  const UNSPLASH_KEY = env?.UNSPLASH_KEY || import.meta.env.UNSPLASH_KEY;

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
        `https://api.unsplash.com/photos/random?query=${query}&orientation=squarish&content_filter=high&featured=true&client_id=${UNSPLASH_KEY}`
      );
      const data = await res.json();
      return new Response(JSON.stringify({ url: data.urls?.small }), {
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
