import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { JOURNEY_MILESTONES, type JourneyMilestone } from "../src/content/journey";

function getStorePaths() {
  const isServerless = Boolean(
    process.env["VERCEL"] ||
    process.env["AWS_LAMBDA_FUNCTION_NAME"] ||
    process.env["NOW_REGION"]
  );

  const baseDir = isServerless
    ? path.join(os.tmpdir(), "akm-portfolio-data")
    : path.join(process.cwd(), "data");

  const bundledDir = path.join(process.cwd(), "data");
  const tmpJourneyPath = path.join(os.tmpdir(), "akm-portfolio-data", "journey.json");
  const tmpDbPath = path.join(baseDir, "portfolio-db.json");
  const bundledDbPath = path.join(bundledDir, "portfolio-db.json");
  const contentJourneyPath = path.join(process.cwd(), "src", "content", "journey.ts");

  return {
    baseDir,
    tmpJourneyPath,
    tmpDbPath,
    bundledDbPath,
    contentJourneyPath,
  };
}

function loadPersistedMilestones(): JourneyMilestone[] {
  const { tmpJourneyPath, tmpDbPath, bundledDbPath } = getStorePaths();

  // 1. Try reading active runtime journey store in tmpdir
  try {
    if (fs.existsSync(tmpJourneyPath)) {
      const raw = fs.readFileSync(tmpJourneyPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // 2. Try reading active tmpdb in tmpdir
  try {
    if (fs.existsSync(tmpDbPath)) {
      const raw = fs.readFileSync(tmpDbPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.journey) && parsed.journey.length > 0) {
        return parsed.journey;
      }
    }
  } catch {}

  // 3. Try reading bundled portfolio-db.json
  try {
    if (fs.existsSync(bundledDbPath)) {
      const raw = fs.readFileSync(bundledDbPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.journey) && parsed.journey.length > 0) {
        return parsed.journey;
      }
    }
  } catch {}

  // 4. Canonical baseline
  return [...JOURNEY_MILESTONES];
}

function savePersistedMilestones(milestones: JourneyMilestone[]) {
  const { baseDir, tmpJourneyPath, tmpDbPath, bundledDbPath, contentJourneyPath } = getStorePaths();

  // 1. Save to tmpdir runtime store
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    fs.writeFileSync(tmpJourneyPath, JSON.stringify(milestones, null, 2), "utf8");
  } catch {}

  // 2. Save into tmpDbPath
  try {
    let dbObj: any = { journey: milestones };
    if (fs.existsSync(tmpDbPath)) {
      try {
        dbObj = JSON.parse(fs.readFileSync(tmpDbPath, "utf8"));
      } catch {}
    }
    dbObj.journey = milestones;
    fs.writeFileSync(tmpDbPath, JSON.stringify(dbObj, null, 2), "utf8");
  } catch {}

  // 3. If running in writable local filesystem, sync to data/portfolio-db.json & src/content/journey.ts
  try {
    if (fs.existsSync(bundledDbPath)) {
      const fullDb = JSON.parse(fs.readFileSync(bundledDbPath, "utf8"));
      fullDb.journey = milestones;
      fs.writeFileSync(bundledDbPath, JSON.stringify(fullDb, null, 2), "utf8");
    }
  } catch {}

  try {
    if (fs.existsSync(contentJourneyPath)) {
      const current = fs.readFileSync(contentJourneyPath, "utf8");
      const marker = "export const JOURNEY_MILESTONES: JourneyMilestone[] = ";
      const idx = current.indexOf(marker);
      if (idx !== -1) {
        const header = current.substring(0, idx + marker.length);
        const newContent = `${header}${JSON.stringify(milestones, null, 2)};\n`;
        if (newContent !== current) {
          fs.writeFileSync(contentJourneyPath, newContent, "utf8");
        }
      }
    }
  } catch {}
}

let liveMilestones: JourneyMilestone[] = loadPersistedMilestones();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Reload latest persisted state if memory is fresh
  if (!liveMilestones || liveMilestones.length === 0) {
    liveMilestones = loadPersistedMilestones();
  }

  // Handle write operations (POST, PUT, DELETE)
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    try {
      const data = JSON.parse(body || "{}");

      if (data.action === "reset") {
        liveMilestones = [...JOURNEY_MILESTONES];
      } else if (Array.isArray(data.milestones) && data.milestones.length > 0) {
        liveMilestones = data.milestones;
      } else if (req.method === "DELETE" || data.deleteId) {
        const idToDelete = data.deleteId || data.id;
        if (idToDelete) {
          liveMilestones = liveMilestones.filter((m: any) => m.id !== idToDelete);
        }
      } else if (data.milestone && data.milestone.id) {
        const idx = liveMilestones.findIndex((m: any) => m.id === data.milestone.id);
        if (idx !== -1) {
          liveMilestones[idx] = { ...liveMilestones[idx], ...data.milestone };
        } else {
          liveMilestones.push(data.milestone);
        }
      }

      savePersistedMilestones(liveMilestones);

      res.statusCode = 200;
      res.end(JSON.stringify(liveMilestones));
      return;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }
  }

  // GET: Always reload from persistent disk store if available to catch updates from admin
  const current = loadPersistedMilestones();
  if (current && current.length > 0) {
    liveMilestones = current;
  }

  res.statusCode = 200;
  res.end(JSON.stringify(liveMilestones));
}
