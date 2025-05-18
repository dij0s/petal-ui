// @ts-expect-error: Bun APIs are not fully supported in TypeScript tooling yet
import { serve } from "bun";
import { join } from "path";

// @ts-expect-error: Bun extension, not in standard TS types
const DIST_DIR = join(import.meta.dir, "../dist");
const BACKEND_API_URL = "http://localhost:8000";

serve({
  async fetch(req) {
    const url = new URL(req.url);

    // proxy API requests to Python backend
    if (url.pathname.startsWith("/api/")) {
      const apiUrl = BACKEND_API_URL + url.pathname.replace("/api", "");
      const apiReq = new Request(apiUrl, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const apiRes = await fetch(apiReq);
      return new Response(apiRes.body, {
        status: apiRes.status,
        headers: apiRes.headers,
      });
    }

    // serve static files from Vite build
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    try {
      // @ts-expect-error: Bun global
      const file = Bun.file(DIST_DIR + filePath);
      if (await file.exists()) {
        return new Response(file);
      }
      // fallback to index.html for SPA routing
      // @ts-expect-error: Bun global
      const indexFile = Bun.file(DIST_DIR + "/index.html");
      return new Response(indexFile);
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
  port: 3000,
});
console.log("[LOG] Serving frontend build");
