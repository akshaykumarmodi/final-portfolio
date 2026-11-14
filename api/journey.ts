import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_MILESTONES = [
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
    title: "Mastering the Modern Stack",
    subtitle: "Frontend Architecture & System Internals",
    description:
      "Deep-dived into modern TypeScript, distributed architectures, database design, and applied LLM engineering. Began crafting custom GLSL shaders and WebGL graphics experiments.",
    year: "2024",
    dateRange: "Late 2024",
    category: "Core Skills",
    iconName: "Code2",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 2,
    tags: ["React", "TypeScript", "WebGL", "FastAPI"],
    imageUrl: "/assets/milestones/m2-learning.svg",
  },
  {
    id: "m-03-building",
    slug: "creative-engineering",
    stage: "building",
    title: "Creative Engineering & 3D Web",
    subtitle: "Interactive Digital Experiences",
    description:
      "Engineered physics-based simulations, custom GLSL visual shaders, procedural Web Audio engines, and rich 3D user interfaces. Blending mathematical precision with artistic storytelling.",
    year: "2025",
    dateRange: "Early 2025",
    category: "Creative Tech",
    iconName: "Sparkles",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 3,
    tags: ["Three.js", "Shaders", "Framer Motion", "Web Audio"],
    imageUrl: "/assets/milestones/m3-building.svg",
  },
  {
    id: "m-04-hackathons",
    slug: "hackathons-and-sprints",
    stage: "hackathons",
    title: "Competitive Hackathons",
    subtitle: "Rapid Prototyping & Innovation",
    description:
      "Collaborated in intensive 24-48 hour hackathons, shipping functional AI prototypes, solving developer reputation challenges, and demoing live to developer and open-source communities.",
    year: "2026",
    dateRange: "Mid 2026",
    category: "Competitions",
    iconName: "Trophy",
    status: "in-progress",
    highlighted: false,
    published: true,
    sortOrder: 4,
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
    dateRange: "2026",
    category: "Products & Open Source",
    iconName: "Rocket",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 5,
    tags: ["TrustMesh", "Study Tutor AI", "Open Source"],
    imageUrl: "/assets/milestones/m5-projects.svg",
  },
];

let liveMilestones = [...DEFAULT_MILESTONES];

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

  // Handle write operations (POST, PUT, DELETE)
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    try {
      const data = JSON.parse(body || "{}");

      if (data.action === "reset") {
        liveMilestones = [...DEFAULT_MILESTONES];
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

      // Try persisting to tmpdir disk store if available
      try {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const os = await import("node:os");
        const storeDir = path.join(os.tmpdir(), "akm-portfolio-data");
        if (!fs.existsSync(storeDir)) {
          fs.mkdirSync(storeDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(storeDir, "journey.json"),
          JSON.stringify(liveMilestones, null, 2),
          "utf8"
        );
      } catch {}

      res.statusCode = 200;
      res.end(JSON.stringify(liveMilestones));
      return;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }
  }

  // GET: Attempt reading from tmpdir store if available
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const os = await import("node:os");
    const storeFile = path.join(os.tmpdir(), "akm-portfolio-data", "journey.json");
    if (fs.existsSync(storeFile)) {
      const parsed = JSON.parse(fs.readFileSync(storeFile, "utf8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        liveMilestones = parsed;
      }
    }
  } catch {}

  res.statusCode = 200;
  res.end(JSON.stringify(liveMilestones));
}
