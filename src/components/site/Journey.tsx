import { useState, useRef, useId } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Code2,
  Sparkles,
  Trophy,
  Rocket,
  TrendingUp,
  Flame,
  Award,
  Cpu,
  Globe,
  LucideIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.webp";
import { HeroFog } from "./HeroFog";
import { Floating3DBackdrop } from "./Floating3DBackdrop";
import { useJourney } from "@/hooks/use-journey";
import { useSound } from "@/hooks/use-sound";
import { prefersReducedMotion } from "@/lib/scroll";
import type { JourneyMilestone } from "@/content/journey";

// Icon resolver for dynamic icon names configured via Admin Dashboard
const ICON_MAP: Record<string, LucideIcon> = {
  Compass,
  Code2,
  Sparkles,
  Trophy,
  Rocket,
  TrendingUp,
  Flame,
  Award,
  Cpu,
  Globe,
};

export function Journey() {
  const { milestones } = useJourney();
  const { play } = useSound();
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);

  return (
    <section
      id="journey"
      className="relative isolate min-h-[100svh] w-full overflow-hidden flex flex-col justify-center py-20 sm:py-24 text-foreground bg-[#0b0816] scroll-mt-0"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Background world: continuous with Hero, About & Projects universe */}
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

      {/* Seamless atmospheric blend transition from previous section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0b0816] via-[#0b0816]/60 to-transparent -z-20"
      />

      {/* Synchronized Hero rising smoke fog layer */}
      <HeroFog />

      {/* Floating 3D Glass Objects and Orbital Curves */}
      <Floating3DBackdrop variant="balanced" />

      <div className="section-shell relative z-20 mx-auto w-full max-w-6xl">
        {/* ============================================================= */}
        {/* SECTION HEADER: Badge, Title & Visual Path Narrative          */}
        {/* ============================================================= */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px 0px 50px 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto pb-12 sm:pb-16"
        >
          {/* Section Number Badge */}
          <div className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider text-purple-300 border border-purple-500/25 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
            04 / JOURNEY & EVOLUTION
          </div>

          {/* Heading with continuous gradient shimmer */}
          <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white">
            The Living <span className="text-gradient-shimmer">Visual Path.</span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 font-sans text-[0.65rem] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.32em] text-cyan-300/80 uppercase font-medium max-w-full">
            LEARNING → BUILDING → HACKATHONS → PROJECTS → GROWTH → FUTURE
          </p>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            A story of curiosity, relentless engineering, shipping open-source products, and pioneering applied artificial intelligence.
          </p>
        </motion.div>

        {/* ============================================================= */}
        {/* CREATIVE ANIMATED JOURNEY TIMELINE PATH                       */}
        {/* ============================================================= */}
        <div className="relative mt-4">
          {/* Central Flowing Glowing Spine for Desktop */}
          <div
            aria-hidden
            className="hidden md:block pointer-events-none absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5"
          >
            {/* Background glowing line */}
            <div className="h-full w-full bg-gradient-to-b from-cyan-400/30 via-purple-500/40 to-cyan-400/20" />

            {/* Traveling Light Pulse Comet along the timeline path */}
            {!reducedMotion && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-32 rounded-full animate-[timeline-flow_7s_linear_infinite]"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(6,182,212,0.9), rgba(168,85,247,0.9), transparent)",
                  boxShadow:
                    "0 0 16px 3px rgba(6,182,212,0.8), 0 0 24px 5px rgba(168,85,247,0.7)",
                }}
              />
            )}
          </div>

          {/* Mobile Left-Aligned Spine */}
          <div
            aria-hidden
            className="md:hidden pointer-events-none absolute left-6 top-4 bottom-4 w-0.5"
          >
            <div className="h-full w-full bg-gradient-to-b from-cyan-400/30 via-purple-500/40 to-cyan-400/20" />
            {!reducedMotion && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-28 rounded-full animate-[timeline-flow_6s_linear_infinite]"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(6,182,212,0.9), rgba(168,85,247,0.9), transparent)",
                  boxShadow: "0 0 14px 2px rgba(6,182,212,0.8)",
                }}
              />
            )}
          </div>

          {/* Milestones Stack */}
          <div className="space-y-12 sm:space-y-16">
            {milestones.map((milestone, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = ICON_MAP[milestone.iconName] || Sparkles;
              const isSelected = activeMilestoneId === milestone.id;

              return (
                <motion.div
                  key={milestone.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "100px 0px 50px 0px" }}
                  transition={{ duration: 0.7, delay: 0.08 * (idx % 3) }}
                  onMouseEnter={() => {
                    play("hover");
                    setActiveMilestoneId(milestone.id);
                  }}
                  onMouseLeave={() => setActiveMilestoneId(null)}
                  className={`relative flex items-center ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  } flex-row`}
                >
                  {/* Milestone Card Content Container */}
                  <div className="ml-14 md:ml-0 md:w-1/2 md:px-8 w-full">
                    <motion.div
                      whileHover={{ scale: 1.015, y: -3 }}
                      transition={{ duration: 0.25 }}
                      className={`relative overflow-hidden rounded-[24px] bg-[#0c081c]/94 border border-white/15 p-6 sm:p-7 backdrop-blur-2xl transition-all duration-300 ${
                        isSelected || milestone.highlighted
                          ? "border-primary-glow/70 shadow-[0_0_35px_rgba(168,85,247,0.35)]"
                          : "hover:border-cyan-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                      }`}
                      style={{
                        borderLeft: isEven ? "2.5px solid #a855f7" : "2.5px solid #06b6d4",
                        borderRight: isEven ? "2.5px solid #06b6d4" : "2.5px solid #a855f7",
                      }}
                    >
                      {/* Traveling border beam for highlighted milestones */}
                      {milestone.highlighted && !reducedMotion && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -inset-[1.5px] rounded-[25px] overflow-hidden opacity-60"
                          style={{ contain: "paint" }}
                        >
                          <div
                            className="absolute -inset-[100%] animate-[border-beam-spin_9s_linear_infinite]"
                            style={{
                              background:
                                "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 75deg, rgba(168, 85, 247, 0.8) 95deg, rgba(6, 182, 212, 0.95) 120deg, transparent 145deg, transparent 360deg)",
                            }}
                          />
                        </div>
                      )}

                      {/* Header bar: Stage, Year Badge & Status */}
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="glass-pill px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase text-cyan-300 border border-cyan-400/25">
                            {milestone.stage.toUpperCase()}
                          </span>
                          <span className="font-mono text-xs font-semibold tracking-widest text-purple-300">
                            {milestone.dateRange || milestone.year}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {milestone.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-[0.70rem] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="size-3" /> Done
                            </span>
                          )}
                          {milestone.status === "in-progress" && (
                            <span className="inline-flex items-center gap-1 text-[0.70rem] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" /> Active
                            </span>
                          )}
                          {milestone.status === "upcoming" && (
                            <span className="inline-flex items-center gap-1 text-[0.70rem] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                              <Clock className="size-3" /> Horizon
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {milestone.title}
                      </h3>
                      {milestone.subtitle && (
                        <p className="mt-1 text-xs sm:text-sm font-medium text-gradient-shimmer">
                          {milestone.subtitle}
                        </p>
                      )}

                      {/* Description */}
                      <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {milestone.description}
                      </p>

                      {/* Tags */}
                      {milestone.tags && milestone.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
                          {milestone.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="glass-pill px-2.5 py-0.5 rounded-full text-[0.68rem] font-medium text-slate-300 border border-white/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Flowing Path Node Anchor (Centered on desktop, Left on mobile) */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                    <motion.div
                      whileHover={{ scale: 1.25 }}
                      animate={
                        isSelected || milestone.highlighted
                          ? { scale: [1, 1.15, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className={`size-11 sm:size-12 rounded-2xl grid place-items-center backdrop-blur-xl border transition-all duration-300 ${
                        isSelected || milestone.highlighted
                          ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 border-white text-white shadow-[0_0_25px_rgba(6,182,212,0.9)]"
                          : "bg-[#100b24] border-white/20 text-cyan-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      }`}
                    >
                      <Icon className="size-5 sm:size-5" />
                    </motion.div>
                  </div>

                  {/* Empty counterpart space for desktop layout symmetry */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seamless atmospheric blend transition into next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#0b0816]/60 to-[#0b0816] -z-20"
      />
    </section>
  );
}

