import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Plus,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.webp";
import { HeroFog } from "./HeroFog";
import { ProjectModal } from "./ProjectModal";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
import { useProjects } from "@/hooks/use-projects";
import { useAdmin } from "@/hooks/use-admin";
import { useSound } from "@/hooks/use-sound";
import { prefersReducedMotion } from "@/lib/scroll";
import { Button } from "@/components/ui/button";
import type { Project } from "@/content/projects";

// ---------------------------------------------------------------------------
// 3D Tilt Card Component with Illuminated Edges & Specular Reflection
// ---------------------------------------------------------------------------
interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  position: "center" | "left" | "right" | "hidden";
  isWrapping?: boolean;
  onClick: () => void;
  onViewDetails: (project: Project) => void;
  onEdit?: (project: Project) => void;
  isAdmin?: boolean;
}

function ProjectCard({
  project,
  isActive,
  position,
  isWrapping,
  onClick,
  onViewDetails,
  onEdit,
  isAdmin,
}: ProjectCardProps) {
  const { play } = useSound();
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();

  // Mouse tilt physics for the 3D card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 240,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 240,
    damping: 24,
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isActive || reducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [isActive, mouseX, mouseY, reducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Transform states depending on 3D gallery carousel position (100% GPU-composited, zero CSS filter repaints)
  const getVariants = () => {
    switch (position) {
      case "center":
        return {
          x: "0%",
          scale: 1,
          rotateY: 0,
          z: 0,
          opacity: 1,
          zIndex: 30,
        };
      case "left":
        return {
          x: "-72%",
          scale: 0.86,
          rotateY: 20,
          z: -120,
          opacity: 0.55,
          zIndex: 10,
        };
      case "right":
        return {
          x: "72%",
          scale: 0.86,
          rotateY: -20,
          z: -120,
          opacity: 0.55,
          zIndex: 10,
        };
      default:
        return {
          x: "100%",
          scale: 0.7,
          rotateY: 0,
          z: -250,
          opacity: 0,
          zIndex: 0,
        };
    }
  };

  const variants = getVariants();
  const initial = isWrapping ? { ...variants, opacity: 0 } : false;

  return (
    <motion.div
      ref={cardRef}
      initial={initial}
      animate={variants}
      transition={
        isWrapping
          ? {
              opacity: { duration: 0.28, ease: "easeOut" },
            }
          : {
              type: "spring",
              stiffness: 230,
              damping: 25,
              mass: 0.7,
            }
      }
      onClick={!isActive ? onClick : undefined}
      onPointerMove={isActive ? handlePointerMove : undefined}
      onPointerLeave={isActive ? handlePointerLeave : undefined}
      className={`absolute top-0 select-none will-change-transform [transform:translateZ(0)] ${
        isActive ? "cursor-default" : "cursor-pointer hover:opacity-85"
      }`}
      style={{
        width: "min(500px, 86vw)",
        transformStyle: "preserve-3d",
        zIndex: position === "center" ? 30 : 10,
        pointerEvents: position === "hidden" ? "none" : undefined,
      }}
    >
      {/* Project Card Container */}

      <motion.div
        animate={
          isActive && !reducedMotion
            ? {
                y: [-3.5, 3.5, -3.5],
              }
            : { y: 0 }
        }
        transition={{
          y: {
            duration: 6,
            delay: 0.35,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        style={{
          rotateX: isActive && !reducedMotion ? rotateX : 0,
          rotateY: isActive && !reducedMotion ? rotateY : 0,
          transformStyle: "preserve-3d",
          borderLeft: "2.5px solid #a855f7",
          borderRight: "2.5px solid #06b6d4",
          boxShadow: isActive
            ? "-8px 0 32px -6px rgba(168,85,247,0.55), 8px 0 32px -6px rgba(6,182,212,0.55), 0 35px 80px -15px rgba(0,0,0,0.95)"
            : "0 20px 40px -10px rgba(0,0,0,0.8)",
        }}
        className="relative overflow-hidden rounded-[26px] bg-[#0c081c]/95 border border-white/15 p-5 sm:p-6 backdrop-blur-md [backface-visibility:hidden]"
      >
        {/* Subtle top specular streak reflection */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />

        {/* 100% GPU-composited darkening overlay for side cards */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-20 rounded-[26px] bg-[#070510] transition-opacity duration-300 ${
            isActive ? "opacity-0" : "opacity-40"
          }`}
        />

        {/* Project Thumbnail Image with Category Badge */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-[#120d24] group">
          <img
            src={project.image || "/placeholder.svg"}
            alt={project.title}
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading={position === "center" ? "eager" : "lazy"}
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />

          {/* Vignette gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c081c] via-transparent to-black/30"
          />

          {/* Category Tag pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.70rem] font-semibold tracking-wider text-cyan-300 backdrop-blur-md bg-black/60 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Sparkles className="size-3 text-cyan-400" />
            <span>{project.category}</span>
          </div>

          {/* Featured pill badge */}
          {project.featured && (
            <div className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wider text-purple-300 backdrop-blur-md bg-black/60 border border-purple-500/30">
              Featured
            </div>
          )}
        </div>

        {/* Card Body: Title & Tagline with subtle gradient shimmer */}
        <div className="mt-4 sm:mt-5">
          <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-cyan-200">
            {project.title}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-gradient-shimmer truncate">
            {project.tagline}
          </p>
        </div>

        {/* Short Description */}
        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2">
          {project.description}
        </p>

        {/* Tech Stack Capsule Pills */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 4).map((tech, idx) => (
            <span
              key={idx}
              className="glass-pill inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.70rem] font-medium text-slate-200 border border-white/10"
            >
              {tech}
            </span>
          ))}
          {project.tech.length > 4 && (
            <span className="glass-pill inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-medium text-slate-400">
              +{project.tech.length - 4}
            </span>
          )}
        </div>

        {/* Footer Actions: View Project CTA & Links */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3.5 border-t border-white/10">
          <Button
            variant="hero"
            size="sm"
            disabled={!isActive}
            onMouseEnter={() => play("hover")}
            onClick={(e) => {
              e.stopPropagation();
              play("click");
              onViewDetails(project);
            }}
            className="gap-2 text-xs sm:text-sm px-4 py-2"
          >
            <Eye className="size-4" />
            View Project
          </Button>

          <div className="flex items-center gap-2">
            {project.liveUrl && (
              <button
                disabled={!isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  play("click");
                  window.open(project.liveUrl, "_blank", "noopener,noreferrer");
                }}
                aria-label="Open live demo"
                className="glass-pill grid size-8 sm:size-9 place-items-center rounded-full text-slate-300 hover:text-white hover:border-cyan-400/60 transition-all"
              >
                <ExternalLink className="size-4" />
              </button>
            )}

            {project.githubUrl && (
              <button
                disabled={!isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  play("click");
                  window.open(project.githubUrl, "_blank", "noopener,noreferrer");
                }}
                aria-label="View source on GitHub"
                className="glass-pill grid size-8 sm:size-9 place-items-center rounded-full text-slate-300 hover:text-white hover:border-primary-glow/60 transition-all"
              >
                <Github className="size-4" />
              </button>
            )}

            {isAdmin && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  play("click");
                  onEdit(project);
                }}
                aria-label="Edit project"
                className="glass-pill px-2.5 py-1 rounded-full text-[0.70rem] font-semibold text-purple-300 border border-purple-500/30 hover:border-purple-400"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Projects Section Component
// ---------------------------------------------------------------------------
export function Projects() {
  const { play } = useSound();
  const { projects, availableCategories, addProject, updateProject } = useProjects();
  const { isAdmin } = useAdmin();

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Admin modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Track carousel card positions and wrap versions to eliminate cross-stage ghosting/overlapping
  const prevPositionsRef = useRef<Record<string, "center" | "left" | "right" | "hidden">>({});
  const wrapVersionsRef = useRef<Record<string, number>>({});

  // Filter projects by category
  const filteredProjects = projects.filter((p) => {
    if (activeCategory === "All") return true;
    return p.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // Clamp activeIndex within bounds when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  // Preload project images whenever filtered projects change to prevent image blinking
  useEffect(() => {
    if (typeof window === "undefined") return;
    filteredProjects.forEach((p) => {
      if (p.image) {
        const img = new Image();
        img.src = p.image;
      }
    });
  }, [filteredProjects]);

  // Navigation throttle to prevent rapid clicking from breaking springs mid-flight
  const lastNavTimeRef = useRef(0);
  const canNavigate = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 220) {
      return false;
    }
    lastNavTimeRef.current = now;
    return true;
  }, []);

  const handlePrev = useCallback(() => {
    if (!canNavigate()) return;
    play("click");
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredProjects.length - 1));
  }, [play, filteredProjects.length, canNavigate]);

  const handleNext = useCallback(() => {
    if (!canNavigate()) return;
    play("click");
    setActiveIndex((prev) => (prev < filteredProjects.length - 1 ? prev + 1 : 0));
  }, [play, filteredProjects.length, canNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedProject || dialogOpen) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePrev, handleNext, selectedProject, dialogOpen]);

  // Admin Project Save handler
  const handleSaveProject = async (data: Partial<Project>) => {
    if (editingProject) {
      await updateProject(editingProject.id, data);
    } else {
      await addProject(data);
    }
  };

  const handleOpenAddDialog = () => {
    play("click");
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (project: Project) => {
    play("click");
    setEditingProject(project);
    setDialogOpen(true);
  };

  // Update previous positions to detect circular wrap on subsequent navigations
  useEffect(() => {
    const nextMap: Record<string, "center" | "left" | "right" | "hidden"> = {};
    filteredProjects.forEach((p, idx) => {
      let pos: "center" | "left" | "right" | "hidden" = "hidden";
      if (idx === activeIndex) pos = "center";
      else if (idx === activeIndex - 1 || (activeIndex === 0 && idx === filteredProjects.length - 1)) {
        pos = "left";
      } else if (idx === activeIndex + 1 || (activeIndex === filteredProjects.length - 1 && idx === 0)) {
        pos = "right";
      }
      nextMap[p.id || p.slug] = pos;
    });
    prevPositionsRef.current = nextMap;
  }, [activeIndex, filteredProjects]);

  return (
    <section
      id="projects"
      className="relative isolate min-h-[100svh] w-full overflow-hidden flex flex-col justify-center py-20 sm:py-24 text-foreground scroll-mt-0"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Background world: continuous with Hero and About universe         */}
      {/* ----------------------------------------------------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-cover bg-[position:60%_100%] opacity-85"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-[image:var(--gradient-aurora)] opacity-60"
      />

      {/* Seamless atmospheric blend transition from About section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0b0816] via-[#0b0816]/60 to-transparent -z-20"
      />

      {/* Synchronized Hero rising smoke fog layer */}
      <HeroFog />

      <div className="section-shell relative z-20 mx-auto w-full max-w-7xl">
        {/* ============================================================= */}
        {/* SECTION HEADER: Title, Subtitle, & Admin Button               */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 sm:pb-8"
        >
          <div>
            {/* 03 / PROJECTS badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-300 border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
              03 / PROJECTS
            </motion.div>

            {/* Title with subtle continuous violet-to-teal gradient shimmer */}
            <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white">
              My Creative <span className="text-gradient-shimmer">Works.</span>
            </h2>

            {/* Subtitle */}
            <p className="mt-2.5 font-sans text-xs sm:text-sm tracking-[0.32em] text-cyan-300/80 uppercase font-medium">
              Ideas. Code. Innovation.
            </p>
          </div>

          {/* Admin "+ Add Project" Button (Only visible to authenticated admins) */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 shrink-0"
            >
              <Button
                variant="hero"
                size="default"
                onClick={handleOpenAddDialog}
                className="gap-2 shadow-[0_0_25px_rgba(168,85,247,0.45)]"
              >
                <Plus className="size-4" />
                Add Project
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* ============================================================= */}
        {/* CATEGORY FILTER PILLS                                         */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        >
          {availableCategories.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            const count =
              cat === "All"
                ? projects.length
                : projects.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => {
                  play("click");
                  setActiveCategory(cat);
                }}
                className={`glass-pill relative shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300 ${
                  isSelected
                    ? "border-primary-glow/70 bg-primary/25 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                    : "text-slate-300 hover:text-white hover:border-cyan-400/50"
                }`}
              >
                <span>{cat}</span>
                <span className="ml-1.5 opacity-60 text-[0.70rem]">({count})</span>
              </button>
            );
          })}
        </motion.div>

        {/* ============================================================= */}
        {/* INTERACTIVE 3D PROJECT GALLERY STAGE                          */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-6 sm:mt-8 flex flex-col items-center justify-center [perspective:1400px]"
        >
          {/* Main 3D Card Stage Carousel: Stable height prevents background WebGL canvas clearing */}
          <div
            className="relative flex items-center justify-center w-full min-h-[580px] sm:min-h-[600px] h-[580px] sm:h-[600px]"
          >
            {filteredProjects.map((p, idx) => {
              const pKey = p.id || p.slug;
              let pos: "center" | "left" | "right" | "hidden" = "hidden";
              if (idx === activeIndex) pos = "center";
              else if (idx === activeIndex - 1 || (activeIndex === 0 && idx === filteredProjects.length - 1)) {
                pos = "left";
              } else if (idx === activeIndex + 1 || (activeIndex === filteredProjects.length - 1 && idx === 0)) {
                pos = "right";
              }

              const prevPos = prevPositionsRef.current[pKey];
              const isWrap =
                (prevPos === "left" && pos === "right") ||
                (prevPos === "right" && pos === "left");

              if (isWrap) {
                wrapVersionsRef.current[pKey] = (wrapVersionsRef.current[pKey] || 0) + 1;
              }
              const wrapVer = wrapVersionsRef.current[pKey] || 0;

              return (
                <ProjectCard
                  key={`${pKey}-${wrapVer}`}
                  project={p}
                  isActive={idx === activeIndex}
                  position={pos}
                  isWrapping={isWrap}
                  onClick={() => {
                    play("click");
                    setActiveIndex(idx);
                  }}
                  onViewDetails={(proj) => setSelectedProject(proj)}
                  onEdit={handleOpenEditDialog}
                  isAdmin={isAdmin}
                />
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <p className="text-lg">No projects found in this category.</p>
              </div>
            )}
          </div>

          {/* =========================================================== */}
          {/* GALLERY NAVIGATION CONTROLS                                 */}
          {/* =========================================================== */}
          <div className="relative z-30 mt-10 sm:mt-12 flex items-center justify-between w-full max-w-sm px-4">
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous project"
              className="glass-pill glow-border grid size-11 place-items-center rounded-full text-foreground transition-all duration-200 hover:scale-110 hover:border-primary-glow/60"
            >
              <ChevronLeft className="size-5" />
            </button>

            {/* Pagination Indicators / Dots */}
            <div className="flex items-center gap-2">
              {filteredProjects.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    play("click");
                    setActiveIndex(i);
                  }}
                  aria-label={`Go to project ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-8 bg-gradient-to-r from-purple-400 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              aria-label="Next project"
              className="glass-pill glow-border grid size-11 place-items-center rounded-full text-foreground transition-all duration-200 hover:scale-110 hover:border-primary-glow/60"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Seamless atmospheric blend transition into the next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#0b0816]/60 to-[#0b0816] -z-20"
      />

      {/* Project Details Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Admin Add/Edit Project Dialog */}
      <ProjectDialog
        open={dialogOpen}
        project={editingProject}
        onClose={() => {
          setDialogOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />
    </section>
  );
}

