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
 * Exactly 5 milestones starting with Pursuing B.Tech.
 */
export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    "id": "m-01-start",
    "slug": "the-beginning",
    "stage": "start",
    "title": "Pursuing B.Tech",
    "subtitle": "Newton School of Technology, Rishihood University",
    "description": "Pursuing B.Tech in Computer Science & Artificial Intelligence. Built first algorithmic foundations and discovered the passion for turning logical code into creative digital experiences.",
    "year": "2024",
    "dateRange": "Aug 2024",
    "category": "Genesis",
    "iconName": "Compass",
    "status": "completed",
    "highlighted": false,
    "published": true,
    "sortOrder": 1,
    "tags": [
      "Algorithms",
      "Python",
      "Computer Science"
    ],
    "imageUrl": "/assets/milestones/m2-learning.svg"
  },
  {
    "id": "m-02-learning",
    "slug": "foundations-mastery",
    "stage": "learning",
    "title": "Exploring Data Structures & Algorithms (DSA)",
    "subtitle": "Frontend Architecture & System Internals",
    "description": "Started exploring Data Structures and Algorithms to strengthen my problem-solving skills and develop a deeper understanding of programming fundamentals. Learning to write efficient code, understand algorithms, and approach complex challenges with logical thinking.",
    "year": "2024",
    "dateRange": "Late 2024",
    "category": "Core Skills",
    "iconName": "Code2",
    "status": "completed",
    "highlighted": false,
    "published": true,
    "sortOrder": 2,
    "tags": [
      "React",
      "TypeScript",
      "Algorithms"
    ],
    "imageUrl": "/assets/milestones/m2-learning.svg"
  },
  {
    "id": "m-04-hackathons",
    "slug": "hackathons-and-sprints",
    "stage": "hackathons",
    "title": "Competitive Hackathons",
    "subtitle": "Rapid Prototyping & Innovation",
    "description": "Collaborated in intensive 24-48 hour hackathons, shipping functional AI prototypes, solving developer reputation challenges, and demoing live to developer and open-source communities.",
    "year": "2025",
    "dateRange": "Mid 2025",
    "category": "Competitions",
    "iconName": "Trophy",
    "status": "completed",
    "highlighted": false,
    "published": true,
    "sortOrder": 3,
    "tags": [
      "Hackathons",
      "Rapid Shipping",
      "Team Leadership"
    ],
    "imageUrl": "/assets/milestones/m4-hackathons.svg"
  },
  {
    "id": "m-05-projects",
    "slug": "shipping-real-products",
    "stage": "projects",
    "title": "Shipping Real-World Systems",
    "subtitle": "TrustMesh & Study Tutor AI",
    "description": "Shipped TrustMesh (an open-source contributor reputation network against AI slop) and Study Tutor AI (an adaptive interactive educational learning assistant) for active users.",
    "year": "2026",
    "dateRange": "Early 2026",
    "category": "Products & Open Source",
    "iconName": "Rocket",
    "status": "completed",
    "highlighted": false,
    "published": true,
    "sortOrder": 4,
    "tags": [
      "TrustMesh",
      "Study Tutor AI",
      "Open Source"
    ],
    "imageUrl": "/assets/milestones/m5-projects.svg"
  },
  {
    "id": "m-1794616042164-f7ir",
    "slug": "looking-ahead-the-future",
    "stage": "future",
    "title": "Looking Ahead – The Future",
    "subtitle": "Building the Next Intelligent Web",
    "description": "Looking forward to exploring new technologies, mastering Artificial Intelligence, building innovative projects, and turning bold ideas into reality. My journey has just begun, and I'm excited to keep learning, creating, and making a meaningful impact through technology.",
    "year": "2026",
    "dateRange": "2026",
    "category": "Horizon",
    "iconName": "Sparkles",
    "status": "in-progress",
    "highlighted": false,
    "published": true,
    "sortOrder": 5,
    "tags": [
      "AI",
      "Innovation",
      "Future Vision"
    ],
    "createdAt": "2026-11-14T00:27:22.164Z"
  }
];
