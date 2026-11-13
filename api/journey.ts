import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { JOURNEY_MILESTONES } from "../src/content/journey";

export default async function handler(
  req: IncomingMessage & { method?: string; body?: any; query?: any },
  res: ServerResponse & {
    status?: (code: number) => any;
    json?: (data: any) => any;
    setHeader: (name: string, value: string) => any;
    end: (chunk?: any) => any;
  },
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (req.method === "OPTIONS") {
    if (res.status) return res.status(200).end();
    res.statusCode = 200;
    return res.end();
  }

  // Try reading fresh from portfolio-db.json if available
  let milestones = JOURNEY_MILESTONES;
  try {
    const dbPath = path.join(process.cwd(), "data", "portfolio-db.json");
    if (fs.existsSync(dbPath)) {
      const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      if (parsed.journey && Array.isArray(parsed.journey) && parsed.journey.length > 0) {
        milestones = parsed.journey;
      }
    }
  } catch {}

  const published = milestones
    .filter((m: any) => m.published !== false)
    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (res.json) {
    return res.json(published);
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(published));
}
