import { memo } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

interface Floating3DBackdropProps {
  variant?: "violet-left" | "cyan-right" | "balanced";
}

export const Floating3DBackdrop = memo(function Floating3DBackdrop({
  variant = "balanced",
}: Floating3DBackdropProps) {
  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden select-none"
    >

      {/* Floating Glass Crystal 1 (Top corner) */}
      <div
        className={`absolute top-16 ${
          variant === "cyan-right" ? "right-12 sm:right-24" : "left-10 sm:left-20"
        } ${reduced ? "" : "animate-[float-slow_8s_ease-in-out_infinite]"}`}
      >
        <div className="relative size-12 sm:size-16 rounded-2xl bg-gradient-to-br from-white/10 via-purple-500/10 to-transparent backdrop-blur-none sm:backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(168,85,247,0.25)] rotate-45 transform">
          <div className="absolute inset-1 rounded-xl border border-cyan-400/30 bg-gradient-to-tl from-cyan-400/10 to-transparent" />
          <div className="absolute top-1 left-2 size-2 rounded-full bg-white/40 blur-[1px]" />
        </div>
      </div>

      {/* Floating Glass Crystal 2 (Bottom corner) */}
      <div
        className={`absolute bottom-20 ${
          variant === "cyan-right" ? "left-8 sm:left-20" : "right-10 sm:right-24"
        } ${reduced ? "" : "animate-[float-slow_9s_ease-in-out_infinite_1.5s]"}`}
      >
        <div className="relative size-10 sm:size-14 rounded-2xl bg-gradient-to-tr from-white/10 via-cyan-400/10 to-transparent backdrop-blur-none sm:backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(6,182,212,0.25)] -rotate-12 transform">
          <div className="absolute inset-1 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <div className="absolute bottom-1 right-2 size-2 rounded-full bg-white/30 blur-[1px]" />
        </div>
      </div>

      {/* Subtle Floating Glass Sphere with Caustic Refraction */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${
          variant === "cyan-right" ? "left-6 sm:left-14" : "right-8 sm:right-16"
        } ${reduced ? "" : "animate-[float-slow_10s_ease-in-out_infinite_0.8s]"}`}
      >
        <div className="relative size-8 sm:size-12 rounded-full bg-gradient-to-b from-white/15 via-white/5 to-transparent backdrop-blur-none sm:backdrop-blur-md border border-white/25 shadow-[0_0_24px_rgba(168,85,247,0.3)]">
          <div className="absolute top-1 left-1.5 size-2 sm:size-3 rounded-full bg-white/60 blur-[0.5px]" />
          <div className="absolute bottom-1.5 right-1.5 size-1.5 rounded-full bg-cyan-400/40 blur-[1px]" />
        </div>
      </div>
    </div>
  );
});

