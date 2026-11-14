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

let memoryMilestones: JourneyMilestone[] = [...CANONICAL_MILESTONES];

function getTmpFilePath(): string {
  try {
    return path.join(os.tmpdir(), "akm_portfolio_journey.json");
  } catch {
    return "/tmp/akm_portfolio_journey.json";
  }
}

function readStoredMilestones(): JourneyMilestone[] {
  try {
    const filePath = getTmpFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return memoryMilestones;
}

function writeStoredMilestones(data: JourneyMilestone[]): void {
  memoryMilestones = data;
  try {
    const filePath = getTmpFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") {
      return resolve(req.body);
    }
    if (typeof req.body === "string") {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }
    let raw = "";
    req.on("data", (chunk: any) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export default async function handler(req: any, res: any): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    if (typeof res.status === "function") {
      res.status(200).end();
    } else {
      res.statusCode = 200;
      res.end();
    }
    return;
  }

  // Handle write operations (POST, PUT, DELETE)
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    try {
      const data = await parseBody(req);
      let current = [...readStoredMilestones()];

      if (data.action === "reset") {
        current = [...CANONICAL_MILESTONES];
      } else if (Array.isArray(data.milestones) && data.milestones.length > 0) {
        current = data.milestones;
      } else if (req.method === "DELETE" || data.deleteId) {
        const idToDelete = data.deleteId || data.id;
        if (idToDelete) {
          current = current.filter((m: any) => m.id !== idToDelete);
        }
      } else if (data.milestone && data.milestone.id) {
        const idx = current.findIndex((m: any) => m.id === data.milestone.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], ...data.milestone };
        } else {
          current.push(data.milestone);
        }
      }

      writeStoredMilestones(current);

      if (typeof res.status === "function") {
        res.status(200).json(current);
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify(current));
      }
      return;
    } catch {
      if (typeof res.status === "function") {
        res.status(400).json({ error: "Invalid request body" });
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid request body" }));
      }
      return;
    }
  }

  // GET: Always return the latest stored milestones
  const activeMilestones = readStoredMilestones();
  if (typeof res.status === "function") {
    res.status(200).json(activeMilestones);
  } else {
    res.statusCode = 200;
    res.end(JSON.stringify(activeMilestones));
  }
}
