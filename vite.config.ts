// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

function serveUploadsPlugin() {
  return {
    name: "serve-uploads-plugin",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url === "/api/journey" || req.url.startsWith("/api/journey?"))) {
          try {
            const dbPath = path.join(process.cwd(), "data", "portfolio-db.json");
            if (fs.existsSync(dbPath)) {
              const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
              if (parsed.journey && Array.isArray(parsed.journey)) {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Cache-Control", "no-cache");
                res.end(JSON.stringify(parsed.journey.filter((m: any) => m.published !== false)));
                return;
              }
            }
          } catch {}
        }

        if (req.url && req.url.startsWith("/uploads/")) {
          const cleanUrl = req.url.split("?")[0];
          const filename = path.basename(cleanUrl);

          const candidates = [
            path.join(process.cwd(), "public", "uploads", filename),
            path.join(process.cwd(), "data", "uploads", filename),
            path.join(os.tmpdir(), "akm-portfolio-data", "uploads", filename),
            path.join(process.cwd(), "src", "assets", filename),
          ];

          for (const filePath of candidates) {
            try {
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                const mimeMap: Record<string, string> = {
                  ".png": "image/png",
                  ".jpg": "image/jpeg",
                  ".jpeg": "image/jpeg",
                  ".webp": "image/webp",
                  ".gif": "image/gif",
                  ".svg": "image/svg+xml",
                };
                res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");
                res.setHeader("Cache-Control", "no-cache");
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            } catch {}
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [serveUploadsPlugin()],
  },
});
