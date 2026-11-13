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

/**
 * Authentic baseline milestones for Akshay Kumar Modi's journey.
 * Structured to represent: START → LEARNING → BUILDING → HACKATHONS → PROJECTS → GROWTH → FUTURE
 * Fully editable and persistable through the Admin Dashboard.
 */
export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    id: "m-01-start",
    slug: "the-beginning",
    stage: "start",
    title: "The Genesis & Curiosity",
    subtitle: "Newton School of Technology, Rishihood University",
    description:
      "Commenced B.Tech in Computer Science & Artificial Intelligence. Built first algorithmic foundations and discovered the passion for turning logical code into creative digital experiences.",
    year: "2024",
    dateRange: "Aug 2024",
    category: "Genesis",
    iconName: "Compass",
    status: "completed",
    highlighted: false,
    published: true,
    sortOrder: 1,
    tags: ["Algorithms", "Python", "Computer Science"],
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
    highlighted: true,
    published: true,
    sortOrder: 3,
    tags: ["Three.js", "Shaders", "Framer Motion", "Web Audio"],
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
    highlighted: true,
    published: true,
    sortOrder: 4,
    tags: ["Hackathons", "Rapid Shipping", "Team Leadership"],
  },
  {
    id: "m-05-projects",
    slug: "shipping-real-products",
    stage: "projects",
    title: "Shipping Real-World Systems",
    subtitle: "TrustMesh & Study Tutor AI",
    description:
      "Shipped TrustMesh (an open-source contributor reputation network against AI slop) and Study Tutor AI (an adaptive interactive educational learning assistant) for active users.",
    year: "2025",
    dateRange: "Late 2025",
    category: "Products & Open Source",
    iconName: "Rocket",
    status: "completed",
    highlighted: true,
    published: true,
    sortOrder: 5,
    tags: ["TrustMesh", "Study Tutor AI", "Open Source"],
  },
  {
    id: "m-06-growth",
    slug: "applied-ai-growth",
    stage: "growth",
    title: "Applied AI & Scalability",
    subtitle: "Autonomous Agents & Systems",
    description:
      "Refining agentic developer workflows, deep multi-turn context curation, performance optimization across cross-platform devices, and full-stack admin orchestration.",
    year: "2026",
    dateRange: "2026 — Active",
    category: "Evolution",
    iconName: "TrendingUp",
    status: "in-progress",
    highlighted: true,
    published: true,
    sortOrder: 6,
    tags: ["Autonomous Agents", "Performance", "Full-Stack"],
  },
  {
    id: "m-07-future",
    slug: "expanding-horizons",
    stage: "future",
    title: "Expanding Horizons & Beyond",
    subtitle: "Building the Next Intelligent Web",
    description:
      "Dedicated to building impactful, accessible, human-centric software at the frontier of artificial intelligence, high-performance web graphics, and global open communities.",
    year: "Next",
    dateRange: "Future Vision",
    category: "Horizon",
    iconName: "Flame",
    status: "upcoming",
    highlighted: false,
    published: true,
    sortOrder: 7,
    tags: ["Future Vision", "Global Impact", "AI Frontier"],
  },
];

