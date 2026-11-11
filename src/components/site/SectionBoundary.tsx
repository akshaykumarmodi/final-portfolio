import { prefersReducedMotion } from "@/lib/scroll";

interface SectionBoundaryProps {
  variant?: "cyan-violet" | "violet-cyan" | "subtle";
  accentWord?: string;
}

export function SectionBoundary({
  variant = "cyan-violet",
  accentWord,
}: SectionBoundaryProps) {
  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  const isReverse = variant === "violet-cyan";
  const primaryGlow = isReverse
    ? "rgba(168, 85, 247, 0.9)"
    : "rgba(6, 182, 212, 0.9)";
  const secondaryGlow = isReverse
    ? "rgba(6, 182, 212, 0.85)"
    : "rgba(168, 85, 247, 0.85)";

  return (
    <div
      aria-hidden
      className="relative z-20 w-full overflow-hidden select-none py-4"
    >
      {/* Base thin boundary rule with subtle gradient blend */}
      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent">
        {/* Layered cyan and violet atmospheric ambient aura */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${
            isReverse
              ? "from-transparent via-purple-500/40 to-transparent"
              : "from-transparent via-cyan-400/40 to-transparent"
          }`}
        />

        {/* Traveling Laser Light Pulse / Comet Beam along the boundary line */}
        {!reduced && (
          <div
            className={`pointer-events-none absolute -top-[1.5px] h-1 w-28 sm:w-44 rounded-full ${
              isReverse
                ? "animate-[beam-travel-reverse_7.5s_linear_infinite]"
                : "animate-[beam-travel_7.5s_linear_infinite]"
            }`}
            style={{
              background: `linear-gradient(90deg, transparent, ${primaryGlow}, ${secondaryGlow}, transparent)`,
              boxShadow: `0 0 16px 2px ${primaryGlow}, 0 0 28px 4px ${secondaryGlow}`,
            }}
          />
        )}
      </div>

      {/* Center glowing geometric crystal anchor node */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {accentWord ? (
          <span className="glass-pill px-3 py-0.5 rounded-full font-mono text-[0.62rem] sm:text-[0.68rem] tracking-[0.3em] uppercase text-slate-300 border border-white/15 backdrop-blur-md">
            {accentWord}
          </span>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Glowing outer pulse ring */}
            <div
              className={`size-3.5 rounded-full border border-cyan-400/40 ${
                reduced ? "" : "animate-[pulse-glow_3s_ease-in-out_infinite]"
              }`}
              style={{
                boxShadow: `0 0 14px 2px ${primaryGlow}`,
              }}
            />
            {/* Center diamond core */}
            <div className="absolute size-1.5 rotate-45 rounded-[1px] bg-white shadow-[0_0_8px_#fff]" />
          </div>
        )}
      </div>

      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#0b0816] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#0b0816] to-transparent z-10" />
    </div>
  );
}

