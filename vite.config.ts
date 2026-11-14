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
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && (req.url === "/api/journey" || req.url.startsWith("/api/journey?"))) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Content-Type", "application/json");

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          const dbPath = path.join(process.cwd(), "data", "portfolio-db.json");
          const journeyFilePath = path.join(process.cwd(), "src", "content", "journey.ts");

          if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
            let body = "";
            for await (const chunk of req) {
              body += chunk;
            }
            try {
              const data = JSON.parse(body || "{}");
              let currentMilestones: any[] = [];
              if (fs.existsSync(dbPath)) {
                try {
                  const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
                  if (Array.isArray(parsed.journey)) currentMilestones = parsed.journey;
                } catch {}
              }

              if (data.action === "reset") {
                const contentJourney = path.join(process.cwd(), "src", "content", "journey.ts");
                if (fs.existsSync(contentJourney)) {
                  try {
                    // Reset to original default baseline from content file
                    currentMilestones = Array.isArray(data.milestones) && data.milestones.length > 0
                      ? data.milestones
                      : [];
                  } catch {}
                }
              } else if (Array.isArray(data.milestones) && data.milestones.length > 0) {
                currentMilestones = data.milestones;
              } else if (req.method === "DELETE" || data.deleteId) {
                const idToDelete = data.deleteId || data.id;
                currentMilestones = currentMilestones.filter((m: any) => m.id !== idToDelete);
              } else if (data.milestone && data.milestone.id) {
                const idx = currentMilestones.findIndex((m: any) => m.id === data.milestone.id);
                if (idx !== -1) {
                  currentMilestones[idx] = { ...currentMilestones[idx], ...data.milestone };
                } else {
                  currentMilestones.push(data.milestone);
                }
              }

              // Update data/portfolio-db.json
              if (fs.existsSync(dbPath)) {
                try {
                  const fullDb = JSON.parse(fs.readFileSync(dbPath, "utf8"));
                  fullDb.journey = currentMilestones;
                  fs.writeFileSync(dbPath, JSON.stringify(fullDb, null, 2), "utf8");
                } catch {}
              }

              // Sync to src/content/journey.ts ONLY if content has genuinely changed (avoids Vite HMR loops)
              if (fs.existsSync(journeyFilePath) && currentMilestones.length > 0) {
                try {
                  const currentContent = fs.readFileSync(journeyFilePath, "utf8");
                  const marker = "export const JOURNEY_MILESTONES: JourneyMilestone[] = ";
                  const idx = currentContent.indexOf(marker);
                  if (idx !== -1) {
                    const header = currentContent.substring(0, idx + marker.length);
                    const newContent = `${header}${JSON.stringify(currentMilestones, null, 2)};\n`;
                    if (newContent !== currentContent) {
                      fs.writeFileSync(journeyFilePath, newContent, "utf8");
                    }
                  }
                } catch {}
              }

              res.statusCode = 200;
              res.end(JSON.stringify(currentMilestones));
              return;
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid body" }));
              return;
            }
          }

          try {
            if (fs.existsSync(dbPath)) {
              const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
              if (parsed.journey && Array.isArray(parsed.journey)) {
                const query = req.url.includes("?") ? req.url.split("?")[1] : "";
                const isAll = query.includes("all=true");
                const items = isAll ? parsed.journey : parsed.journey.filter((m: any) => m.published !== false);
                res.statusCode = 200;
                res.end(JSON.stringify(items));
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
