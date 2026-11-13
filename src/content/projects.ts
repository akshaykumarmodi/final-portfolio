import trustmeshImg from "@/assets/project-trustmesh.webp";
import aiTutorImg from "@/assets/project-ai-tutor.webp";
import portfolioImg from "@/assets/project-portfolio.webp";

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
    githubUrl: "https://github.com/akshaykumarmodi/Student-AI-Tutor",
    liveUrl: "https://student-ai-site-three.vercel.app/",
    featured: true,
    published: true,
    sortOrder: 2,
    createdAt: "2026-11-09T07:28:42.74568+00:00",
  },
  {
    id: "0077f714-be3b-426f-8dc2-5482ec7267aa",
    slug: "personal-portfolio",
    title: "Personal Portfolio",
    tagline: "Cinematic 3D web experience with WebGL & shaders",
    description:
      "A cinematic interactive portfolio featuring 3D experiences, physics simulations, custom GLSL shaders, sound synthesis, and creative frontend engineering.",
    fullDescription:
      "Designed and developed from first principles to embody the intersection of creative engineering and visual artistry. Powered by TanStack Start, React Three Fiber, WebGL shaders, Framer Motion, and the Web Audio API, the portfolio creates an immersive dark-aurora digital universe complete with reactive lighting, fluid physics, and an interactive 3D ID badge card.",
    category: "Creative",
    tech: ["React", "TypeScript", "Three.js", "Tailwind CSS", "TanStack Start"],
    image: portfolioImg,
    githubUrl: "https://github.com/akshaykumarmodi/spotifyclone1",
    liveUrl: "https://akshaykumarmodi.github.io/spotifyclone1/",
    featured: true,
    published: true,
    sortOrder: 3,
    createdAt: "2026-11-09T07:28:42.74568+00:00",
  },
];
