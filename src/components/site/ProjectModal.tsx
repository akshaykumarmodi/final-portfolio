import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Github, Sparkles, Layers, ArrowLeft } from "lucide-react";
import type { Project } from "@/content/projects";
import { useSound } from "@/hooks/use-sound";
import { Button } from "@/components/ui/button";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const { play } = useSound();

  const handleClose = useCallback(() => {
    play("click");
    onClose();
  }, [play, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (project) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [project, handleClose]);

  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
          className="fixed inset-0 bg-[#04020a]/85 backdrop-blur-2xl"
          aria-hidden
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#0c0919] p-5 sm:p-8 md:p-10 text-foreground border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.95)]"
          style={{
            borderLeft: "2.5px solid #a855f7",
            borderRight: "2.5px solid #06b6d4",
            boxShadow:
              "-10px 0 40px -8px rgba(168,85,247,0.45), 10px 0 40px -8px rgba(6,182,212,0.45), 0 35px 85px -20px rgba(0,0,0,0.95)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Row: Category + Close Button */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Sparkles className="size-3 text-cyan-400" />
                {project.category}
              </span>
              {project.featured && (
                <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wider text-purple-300 border border-purple-500/30">
                  Featured
                </span>
              )}
            </div>

            <button
              onClick={handleClose}
              aria-label="Close project modal"
              className="glass-pill grid size-9 sm:size-10 place-items-center rounded-full text-foreground/80 transition-all duration-200 hover:scale-110 hover:text-white hover:border-primary-glow/60"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Project Cover Image */}
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#120d24] shadow-2xl">
            <img
              src={project.image || "/placeholder.svg"}
              alt={project.title}
              className="size-full object-cover select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            {/* Subtle atmospheric vignette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0919] via-transparent to-transparent opacity-60"
            />
          </div>

          {/* Title and Tagline */}
          <div className="mt-8">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              {project.title}
            </h2>
            <p className="mt-2 text-base sm:text-lg font-medium text-gradient-violet">
              {project.tagline}
            </p>
          </div>

          {/* Full Description */}
          <div className="mt-6 space-y-4 text-[1.02rem] sm:text-[1.08rem] leading-relaxed text-slate-300 font-sans">
            <p>{project.fullDescription || project.description}</p>
          </div>

          {/* Tech Stack Badges */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3 text-xs sm:text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">
              <Layers className="size-4 text-cyan-400" />
              <span>Technologies & Tools</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {project.tech.map((t, idx) => (
                <span
                  key={idx}
                  className="glass-pill inline-flex items-center rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-200 border border-white/10 transition-colors hover:border-cyan-400/50 hover:text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Screenshots (if available) */}
          {project.screenshots && project.screenshots.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">
                Project Gallery
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.screenshots.map((shot, sIdx) => (
                  <div
                    key={sIdx}
                    className="relative aspect-video overflow-hidden rounded-xl border border-white/15 bg-black/40"
                  >
                    <img
                      src={shot}
                      alt={`${project.title} screenshot ${sIdx + 1}`}
                      className="size-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {project.liveUrl && (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => {
                    play("click");
                    window.open(project.liveUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="gap-2 text-sm sm:text-base"
                >
                  <ExternalLink className="size-4" />
                  Live Preview
                </Button>
              )}

              {project.githubUrl && (
                <Button
                  variant="glass"
                  size="lg"
                  onClick={() => {
                    play("click");
                    window.open(project.githubUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="gap-2 text-sm sm:text-base border-white/20 hover:border-cyan-400/60"
                >
                  <Github className="size-4" />
                  GitHub Source
                </Button>
              )}
            </div>

            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Projects
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

