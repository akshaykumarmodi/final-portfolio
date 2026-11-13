import trustmeshImg from "@/assets/project-trustmesh.png";
import aiTutorImg from "@/assets/project-ai-tutor.webp";
import spotifyImg from "@/assets/project-spotify.png";
import portfolioImg from "@/assets/project-portfolio.webp";

export { trustmeshImg, aiTutorImg, spotifyImg, portfolioImg };

export type Project = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  fullDescription?: string | undefined;
  category: string;
  tech: string[];
  image: string;
  screenshots?: string[] | undefined;
  githubUrl?: string | undefined;
  liveUrl?: string | undefined;
  projectUrl?: string | undefined;
  featured?: boolean | undefined;
  published: boolean;
  sortOrder: number;
  createdAt?: string | undefined;
};

/**
 * Returns the reliable bundled asset image for a project based on its slug or title.
 */
export function getDefaultProjectImage(slugOrTitle?: string | null): string {
  const key = (slugOrTitle || "").toLowerCase();
  if (key.includes("trustmesh") || key.includes("trust-mesh")) return trustmeshImg;
  if (key.includes("study") || key.includes("tutor") || key.includes("ai-study")) return aiTutorImg;
  if (key.includes("spotify")) return spotifyImg;
  return portfolioImg;
}

/**
 * Robust image resolver that guarantees valid, production-ready asset URLs across
 * Vite dev mode, production builds, and Vercel serverless environments.
 */
export function resolveProjectImage(
  imagePath?: string | null,
  slugOrTitle?: string | null,
): string {
  if (!imagePath || typeof imagePath !== "string" || !imagePath.trim()) {
    return getDefaultProjectImage(slugOrTitle);
  }

  const trimmed = imagePath.trim();

  // 1. Data URLs and Blob URLs are used as-is
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // 2. Absolute HTTP/HTTPS URLs are used as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // 3. Exact legacy asset paths or known initial baseline references
  if (
    trimmed === "/src/assets/project-trustmesh.webp" ||
    trimmed === "/src/assets/project-trustmesh.png" ||
    trimmed === "/assets/project-trustmesh.webp" ||
    trimmed === "/uploads/proj-1794321858226-5fb03d1e.png"
  ) {
    return trustmeshImg;
  }
  if (
    trimmed === "/src/assets/project-ai-tutor.webp" ||
    trimmed === "/assets/project-ai-tutor.webp"
  ) {
    return aiTutorImg;
  }
  if (
    trimmed === "/src/assets/project-spotify.png" ||
    trimmed === "/uploads/proj-1794321984945-8788fc47.png"
  ) {
    return spotifyImg;
  }
  if (
    trimmed === "/src/assets/project-portfolio.webp" ||
    trimmed === "/assets/project-portfolio.webp"
  ) {
    return portfolioImg;
  }

  // 4. Any other custom URL or path (e.g. newly uploaded /uploads/..., data:, custom URL)
  return trimmed;
}

/** All portfolio projects live here, bundled with the site (local baseline). */
export const PROJECTS: Project[] = [
  {
    id: "ee03c7cb-3dcd-4441-9e4f-bd20f54b4e55",
    slug: "trustmesh",
    title: "TrustMesh",
    tagline: "A trust network against AI slop",
    description:
      "A trust network against AI slop, designed to strengthen trust across the open-source ecosystem by exploring contributor credibility, reputation and community trust.",
    fullDescription:
      "TrustMesh addresses the critical challenge of synthetic code and AI slop flooding modern software repositories. By combining cryptographic signatures, verifiable contributor reputation scoring, and peer review networks, TrustMesh equips maintainers with reliable signals to distinguish authentic contributions from automated noise, preserving the resilience of the open-source community.",
    category: "Open Source",
    tech: ["React", "Vite", "Tailwind CSS", "FastAPI", "Python", "SQLite"],
    image: trustmeshImg,
    screenshots: [],
    githubUrl: "https://github.com/akshaykumarmodi/Trust-Mesh-prefect-version",
    liveUrl: "https://trust-mesh-prefect-version.vercel.app/",
    featured: true,
    published: true,
    sortOrder: 1,
    createdAt: "2026-11-09T07:28:42.74568+00:00",
  },
  {
    id: "ef0b21cb-5dfe-45da-8848-5c9a9788899a",
    slug: "ai-study-tutor",
    title: "Study Tutor AI",
    tagline: "AI-powered interactive learning assistant",
    description:
      "An AI-powered learning assistant designed to help students understand academic concepts through conversational breakdowns, adaptive explanations and interactive problem-solving.",
    fullDescription:
      "Study Tutor AI utilizes multimodal large language models to distill complex STEM and computer science curricula into interactive, self-paced learning journeys. Featuring Socratic dialogue, real-time formula generation, code step-throughs, and personalized concept mapping, it transforms passive studying into an engaging, conversational exploration tailored to each learner.",
    category: "AI / ML",
    tech: ["React", "TypeScript", "Python", "Gemini AI", "Tailwind CSS"],
    image: aiTutorImg,
    screenshots: [],
    githubUrl: "https://github.com/akshaykumarmodi/Student-AI-Tutor",
    liveUrl: "https://student-ai-site-three.vercel.app/",
    featured: false,
    published: true,
    sortOrder: 2,
    createdAt: "2026-11-09T07:28:42.74568+00:00",
  },
  {
    id: "proj-1794321758709-t8g59",
    slug: "spotify-clone",
    title: "spotify clone",
    tagline: "spotify frontend",
    description: "The project is created when i entered in journey",
    fullDescription: "A project that develops my interest and give me a path",
    category: "Web Apps",
    tech: ["React", "TypeScript", "Tailwind CSS"],
    image: spotifyImg,
    screenshots: [],
    githubUrl: "https://github.com/akshaykumarmodi/spotifyclone1",
    liveUrl: "https://akshaykumarmodi.github.io/spotifyclone1/",
    featured: false,
    published: true,
    sortOrder: 3,
    createdAt: "2026-11-10T14:42:38.709Z",
  },
];
