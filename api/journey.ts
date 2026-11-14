import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export type JourneyStage =
  | "start"
  | "learning"
  | "building"
  | "hackathons"
  | "projects"
  | "growth"
  | "future";

export type JourneyMilestone = {
  id: string;
  slug: string;
  stage: JourneyStage;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  dateRange: string;
  category: string;
  iconName: string;
  status: "completed" | "in-progress" | "upcoming";
  highlighted: boolean;
  published: boolean;
  sortOrder: number;
  tags?: string[] | undefined;
  imageUrl?: string | undefined;
  createdAt?: string | undefined;
};

const CANONICAL_MILESTONES: JourneyMilestone[] = [
  {
    id: "m-01-start",
    slug: "the-beginning",
    stage: "start",
    title: "Pursuing B.Tech",
    subtitle: "Newton School of Technology, Rishihood University",
    description:
      "Pursuing B.Tech in Computer Science & Artificial Intelligence. Built first algorithmic foundations and discovered the passion for turning logical code into creative digital experiences.",
    year: "2024",
    dateRange: "Aug 2024",
    category: "Genesis",
    iconName: "Compass",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 1,
    tags: ["Algorithms", "Python", "Computer Science"],
    imageUrl: "/assets/milestones/m2-learning.svg",
  },
  {
    id: "m-02-learning",
    slug: "foundations-mastery",
    stage: "learning",
    title: "Exploring Data Structures & Algorithms (DSA)",
    subtitle: "Frontend Architecture & System Internals",
    description:
      "Started exploring Data Structures and Algorithms to strengthen my problem-solving skills and develop a deeper understanding of programming fundamentals. Learning to write efficient code, understand algorithms, and approach complex challenges with logical thinking.",
    year: "2024",
    dateRange: "Late 2024",
    category: "Core Skills",
    iconName: "Code2",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 2,
    tags: ["React", "TypeScript", "Algorithms"],
    imageUrl: "/assets/milestones/m2-learning.svg",
  },
  {
    id: "m-04-hackathons",
    slug: "hackathons-and-sprints",
    stage: "hackathons",
    title: "Competitive Hackathons",
    subtitle: "Rapid Prototyping & Innovation",
    description:
      "Collaborated in intensive 24-48 hour hackathons, shipping functional AI prototypes, solving developer reputation challenges, and demoing live to developer and open-source communities.",
    year: "2025",
    dateRange: "Mid 2025",
    category: "Competitions",
    iconName: "Trophy",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 3,
    tags: ["Hackathons", "Rapid Shipping", "Team Leadership"],
    imageUrl: "/assets/milestones/m4-hackathons.svg",
  },
  {
    id: "m-05-projects",
    slug: "shipping-real-products",
    stage: "projects",
    title: "Shipping Real-World Systems",
    subtitle: "TrustMesh & Study Tutor AI",
    description:
      "Shipped TrustMesh (an open-source contributor reputation network against AI slop) and Study Tutor AI (an adaptive interactive educational learning assistant) for active users.",
    year: "2026",
    dateRange: "Early 2026",
    category: "Products & Open Source",
    iconName: "Rocket",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 4,
    tags: ["TrustMesh", "Study Tutor AI", "Open Source"],
    imageUrl: "/assets/milestones/m5-projects.svg",
  },
  {
    id: "m-1794616042164-f7ir",
    slug: "looking-ahead-the-future",
    stage: "future",
    title: "Looking Ahead – The Future",
    subtitle: "Building the Next Intelligent Web",
    description:
      "Looking forward to exploring new technologies, mastering Artificial Intelligence, building innovative projects, and turning bold ideas into reality. My journey has just begun, and I'm excited to keep learning, creating, and making a meaningful impact through technology.",
    year: "2026",
    dateRange: "2026",
    category: "Horizon",
    iconName: "Sparkles",
    status: "in-progress",
    highlighted: false,
    published: true,
    sortOrder: 5,
    tags: ["AI", "Innovation", "Future Vision"],
    createdAt: "2026-11-14T00:27:22.164Z",
  },
];

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

  return {
    baseDir,
    tmpJourneyPath,
    tmpDbPath,
    bundledDbPath,
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
  return [...CANONICAL_MILESTONES];
}

function savePersistedMilestones(milestones: JourneyMilestone[]) {
  const { baseDir, tmpJourneyPath, tmpDbPath, bundledDbPath } = getStorePaths();

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

  // 3. If running in writable local filesystem, sync to data/portfolio-db.json
  try {
    if (fs.existsSync(bundledDbPath)) {
      const fullDb = JSON.parse(fs.readFileSync(bundledDbPath, "utf8"));
      fullDb.journey = milestones;
      fs.writeFileSync(bundledDbPath, JSON.stringify(fullDb, null, 2), "utf8");
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
        liveMilestones = [...CANONICAL_MILESTONES];
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
