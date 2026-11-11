import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  RotateCw,
  Palette,
  Laptop,
  Brain,
  Sparkles,
  Clapperboard,
  Music,
  Code2,
  Sparkle,
  Star,
} from "lucide-react";
import portraitImg from "@/assets/akshay-portrait.webp";
import heroBg from "@/assets/hero-bg.webp";
import htmlShieldImg from "@/assets/html-shield.webp";
import cssShieldImg from "@/assets/css-shield.webp";
import jsShieldImg from "@/assets/javascript-shield.webp";
import { HeroFog } from "./HeroFog";
import { useSound } from "@/hooks/use-sound";
import { prefersReducedMotion } from "@/lib/scroll";

// ---------------------------------------------------------------------------
// Custom Brand Icons for Skills Matching the Reference Image Exactly
// ---------------------------------------------------------------------------

function HtmlIcon({ className = "size-7" }: { className?: string }) {
  return (
    <img
      src={htmlShieldImg}
      alt="HTML"
      className={`${className} object-contain`}
      loading="eager"
      decoding="async"
    />
  );
}

function CssIcon({ className = "size-7" }: { className?: string }) {
  return (
    <img
      src={cssShieldImg}
      alt="CSS"
      className={`${className} object-contain`}
      loading="eager"
      decoding="async"
    />
  );
}

function ReactIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} fill="none">
      <ellipse cx="64" cy="64" rx="52" ry="20" stroke="#61DAFB" strokeWidth="6" />
      <ellipse cx="64" cy="64" rx="52" ry="20" stroke="#61DAFB" strokeWidth="6" transform="rotate(60 64 64)" />
      <ellipse cx="64" cy="64" rx="52" ry="20" stroke="#61DAFB" strokeWidth="6" transform="rotate(120 64 64)" />
      <circle cx="64" cy="64" r="10" fill="#61DAFB" />
    </svg>
  );
}

function PythonIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} fill="none">
      <path
        d="M63.5 8C33.2 8 35.1 21.1 35.1 21.1L35.2 34.7H64V38.9H23.6S8 37.1 8 67.5C8 98 21.7 96.1 21.7 96.1H30V84.4C30 84.4 29.5 70.4 43.8 70.4H72.2C72.2 70.4 84.8 70.8 84.8 58.6V20.8C84.8 20.8 87.2 8 63.5 8ZM49.4 17.2C52.4 17.2 54.8 19.6 54.8 22.6C54.8 25.6 52.4 28 49.4 28C46.4 28 44 25.6 44 22.6C44 19.6 46.4 17.2 49.4 17.2Z"
        fill="#387eb8"
      />
      <path
        d="M64.5 120C94.8 120 92.9 106.9 92.9 106.9L92.8 93.3H64V89.1H104.4S120 90.9 120 60.5C120 30 106.3 31.9 106.3 31.9H98V43.6C98 43.6 98.5 57.6 84.2 57.6H55.8C55.8 57.6 43.2 57.2 43.2 69.4V107.2C43.2 107.2 40.8 120 64.5 120ZM78.6 110.8C75.6 110.8 73.2 108.4 73.2 105.4C73.2 102.4 75.6 100 78.6 100C81.6 100 84 102.4 84 105.4C84 108.4 81.6 110.8 78.6 110.8Z"
        fill="#ffe052"
      />
    </svg>
  );
}

function CppIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} fill="none">
      <polygon points="64,8 116,36 116,92 64,120 12,92 12,36" fill="#00599C" />
      <polygon points="64,18 108,42 108,86 64,110 20,86 20,42" fill="#004482" />
      <path
        d="M62 48C53.2 48 46 55.2 46 64C46 72.8 53.2 80 62 80C67.5 80 72.3 77.2 75.2 73L68.8 68.5C67.2 70.8 64.7 72 62 72C57.6 72 54 68.4 54 64C54 59.6 57.6 56 62 56C64.7 56 67.2 57.2 68.8 59.5L75.2 55C72.3 50.8 67.5 48 62 48Z"
        fill="#FFFFFF"
      />
      <path d="M80 61H84V57H87V61H91V64H87V68H84V64H80V61Z" fill="#00A5E5" />
      <path d="M94 61H98V57H101V61H105V64H101V68H98V64H94V61Z" fill="#00A5E5" />
    </svg>
  );
}

function JsIcon({ className = "size-7" }: { className?: string }) {
  return (
    <img
      src={jsShieldImg}
      alt="JavaScript"
      className={`${className} object-contain`}
      loading="eager"
      decoding="async"
    />
  );
}

// ---------------------------------------------------------------------------
// Skills Data Matching Requested Technical Skills
// ---------------------------------------------------------------------------
interface SkillItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  glow: string;
  customColor?: string;
}

const SKILLS: SkillItem[] = [
  {
    title: "HTML",
    icon: HtmlIcon,
    glow: "hover:border-orange-500/50 hover:shadow-[0_0_25px_rgba(240,101,41,0.35)]",
  },
  {
    title: "CSS",
    icon: CssIcon,
    glow: "hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(33,169,220,0.35)]",
  },
  {
    title: "JavaScript",
    icon: JsIcon,
    glow: "hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(241,191,34,0.35)]",
  },
  {
    title: "React",
    icon: ReactIcon,
    glow: "hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(97,218,251,0.35)]",
  },
  {
    title: "Python",
    icon: PythonIcon,
    glow: "hover:border-blue-400/50 hover:shadow-[0_0_25px_rgba(56,126,184,0.35)]",
  },
  {
    title: "C++",
    icon: CppIcon,
    glow: "hover:border-sky-400/50 hover:shadow-[0_0_25px_rgba(0,165,229,0.35)]",
  },
];

// ---------------------------------------------------------------------------
// Beyond The Code Interests Data
// ---------------------------------------------------------------------------
const INTERESTS = [
  { label: "Coding and Development", icon: Laptop, color: "text-purple-400", border: "hover:border-purple-500/40" },
  { label: "Artificial Intelligence", icon: Brain, color: "text-cyan-400", border: "hover:border-cyan-400/40" },
  { label: "Creative Technology", icon: Palette, color: "text-fuchsia-400", border: "hover:border-fuchsia-400/40" },
  { label: "Video Editing and Content Creation", icon: Clapperboard, color: "text-pink-400", border: "hover:border-pink-500/40" },
  { label: "Singing and Music", icon: Music, color: "text-teal-300", border: "hover:border-teal-400/40" },
];

// ---------------------------------------------------------------------------
// Realistic Metallic Lanyard & Swivel Clip Component
// ---------------------------------------------------------------------------
function LanyardAndClip() {
  return (
    <div className="relative flex flex-col items-center pointer-events-none select-none z-30">
      {/* Fabric Lanyard Ribbon: proportioned, natural strap hanging gracefully from above and blending into boundary */}
      <div
        id="about-rope"
        className="w-9 sm:w-10 h-36 sm:h-40 lg:h-48 -mt-6 sm:-mt-8 lg:-mt-10 bg-gradient-to-r from-[#110e20] via-[#241c3b] to-[#100d1e] shadow-[0_10px_25px_rgba(0,0,0,0.85)] flex flex-col items-center justify-end pb-2 border-x border-white/10 relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to top, black 50%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 50%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
        }}
      >
        {/* Subtle boundary transition glow */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-purple-500/20 via-cyan-400/5 to-transparent pointer-events-none"
        />

        {/* Woven fabric webbing texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:3px_3px]"
        />
        {/* Subtle center fold highlight */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/5" />
        {/* Dual edge stitching grooves */}
        <div className="absolute inset-y-0 left-1 w-px bg-white/20" />
        <div className="absolute inset-y-0 right-1 w-px bg-white/20" />

        {/* AKM Brand Lettering on the lanyard strap */}
        <div className="flex flex-col items-center gap-7 sm:gap-9 py-1">
          <span className="font-display font-bold text-[0.66rem] tracking-[0.28em] text-slate-400/50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transform -rotate-90">
            AKM
          </span>
          <span className="font-display font-bold text-[0.66rem] tracking-[0.28em] text-slate-300/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transform -rotate-90">
            AKM
          </span>
          <span className="font-display font-bold text-[0.68rem] tracking-[0.28em] text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transform -rotate-90">
            AKM
          </span>
        </div>
      </div>

      {/* Brushed Heavy Metal Crimp Band */}
      <div className="relative w-10 sm:w-11 h-3.5 bg-gradient-to-r from-[#2a2638] via-[#cbd5e1] to-[#2a2638] rounded-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.95)] border-y border-white/30 -mt-0.5 z-10 flex items-center justify-around px-1">
        <div className="w-0.5 h-2 bg-[#1e1b2e] rounded-full opacity-60" />
        <div className="size-1 rounded-full bg-[#1e1b2e] border border-white/40 shadow-inner" />
        <div className="w-0.5 h-2 bg-[#1e1b2e] rounded-full opacity-60" />
      </div>

      {/* Realistic 3D Cast Chrome Swivel Half Hook */}
      <div className="relative -mt-0.5 flex flex-col items-center z-30 pointer-events-none">
        <svg
          width="36"
          height="46"
          viewBox="0 0 36 46"
          fill="none"
          className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
        >
          <defs>
            {/* Mirror-finish chrome steel gradient */}
            <linearGradient id="chromeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="18%" stopColor="#e2e8f0" />
              <stop offset="40%" stopColor="#94a3b8" />
              <stop offset="65%" stopColor="#475569" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Lathe-turned swivel barrel horizontal gradient */}
            <linearGradient id="swivelLatheGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="25%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Spring trigger thumb lever gradient */}
            <linearGradient id="leverSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            <filter id="hookShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 1. Top Swivel Wire Eyelet (Loops under crimp band) */}
          <path
            d="M13 2.5 C13 1 15 0 18 0 C21 0 23 1 23 2.5 L23 6.5 L13 6.5 Z"
            fill="url(#chromeBodyGrad)"
            stroke="#0f172a"
            strokeWidth="0.5"
          />
          <ellipse cx="18" cy="2.8" rx="2.6" ry="1.4" fill="#0d0918" />
          <path
            d="M14.5 2.2 C15.2 1.4 16.5 0.8 18 0.8 C19.5 0.8 20.8 1.4 21.5 2.2"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* 2. Machined Steel Swivel Collar & Rotating Joint */}
          <rect
            x="14"
            y="5.5"
            width="8"
            height="5.5"
            rx="1"
            fill="url(#swivelLatheGrad)"
            stroke="#0f172a"
            strokeWidth="0.5"
          />
          <line x1="14" y1="7.2" x2="22" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
          <line x1="14" y1="8.2" x2="22" y2="8.2" stroke="#ffffff" strokeWidth="0.5" opacity="0.9" />
          <ellipse cx="18" cy="11" rx="4" ry="1.1" fill="url(#swivelLatheGrad)" stroke="#0f172a" strokeWidth="0.4" />

          {/* 3. Half Hook Front Clasp Body */}
          <g filter="url(#hookShadow)">
            {/* Clasp upper neck & tapered shoulders */}
            <path
              d="M15 11 L21 11 C22.5 13 23.5 15 23 17.5 L13 17.5 C12.5 15 13.5 13 15 11 Z"
              fill="url(#chromeBodyGrad)"
              stroke="#0f172a"
              strokeWidth="0.5"
            />

            {/* Spring trigger thumb lever on the right */}
            <rect
              x="21.5"
              y="13.5"
              width="3.2"
              height="4.5"
              rx="0.8"
              fill="url(#leverSteelGrad)"
              stroke="#0f172a"
              strokeWidth="0.4"
            />
            <line x1="22" y1="15" x2="24.2" y2="15" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="22" y1="16.5" x2="24.2" y2="16.5" stroke="#1e293b" strokeWidth="0.5" />

            {/* Solid steel hinge pivot rivet pin */}
            <circle cx="19.5" cy="15" r="1.5" fill="url(#chromeBodyGrad)" stroke="#0f172a" strokeWidth="0.5" />
            <circle cx="19.5" cy="15" r="0.7" fill="#0f172a" />
            <circle cx="19.2" cy="14.6" r="0.35" fill="#ffffff" opacity="0.95" />

            {/* REALISTIC HALF HOOK SHANK: Descends in front of card and curves right into the punch hole */}
            <path
              d="M14 17.5
                 L17.5 17.5
                 L17.5 28
                 C17.5 32 18.2 35.5 19.2 37.5
                 C19.5 38.2 19 38.8 18.2 38.8
                 C17 38.8 15.8 37 14.8 34
                 C14 31 13.8 26 14 17.5 Z"
              fill="url(#chromeBodyGrad)"
              stroke="#0f172a"
              strokeWidth="0.5"
            />
          </g>

          {/* Polished liquid-chrome edge specular reflection down the hook shank */}
          <path
            d="M14.4 18 L14.4 28 C14.4 32 15 35 16.2 37"
            stroke="#ffffff"
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main About Component
// ---------------------------------------------------------------------------
export function About() {
  const { play } = useSound();
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();

  // Mouse tilt physics for the 3D ID badge
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor responsiveness
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 220, damping: 22 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 220, damping: 22 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY, reducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const toggleFlip = useCallback(() => {
    play("click");
    setIsFlipped((prev) => !prev);
  }, [play]);

  return (
    <section
      id="about"
      className="relative isolate min-h-[100svh] lg:min-h-[100svh] w-full overflow-hidden flex flex-col justify-start lg:justify-center pt-16 sm:pt-20 lg:pt-16 pb-16 sm:pb-20 text-foreground scroll-mt-0"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Background world: continuous with Hero landscape & nebula        */}
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

      {/* Seamless atmospheric blend transition from Hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0b0816] via-[#0b0816]/60 to-transparent -z-20"
      />

      {/* Synchronized Hero rising smoke fog layer */}
      <HeroFog />


      <div className="section-shell relative z-20 my-auto -translate-y-2 sm:-translate-y-4 lg:-translate-y-6 pt-1 sm:pt-2 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mt-0">
          {/* ============================================================= */}
          {/* LEFT COLUMN: Realistic Hanging Physical 3D ID Badge Card      */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative pt-0">
            {/* Hanging Lanyard with repeating AKM branding */}
            <motion.div
              animate={reducedMotion ? {} : { y: [-3, 3, -3], rotateZ: [-0.6, 0.6, -0.6] }}
              transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
              className="relative flex flex-col items-center"
            >
              <LanyardAndClip />

              {/* 3D Physical ID Badge Card */}
              <div
                ref={cardRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onClick={toggleFlip}
                className="relative -mt-7 cursor-pointer select-none [perspective:1400px]"
                style={{ width: "min(320px, 86vw)", height: "475px" }}
              >
                <motion.div
                  style={{
                    rotateX: reducedMotion ? 0 : rotateX,
                    rotateY: reducedMotion ? 0 : rotateYSpring,
                    transformStyle: "preserve-3d",
                  }}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    rotateY: { type: "spring", stiffness: 220, damping: 20 },
                    scale: { duration: 0.35, ease: "easeOut" },
                  }}
                  className="relative w-full h-full rounded-[24px] [transform-style:preserve-3d] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.95)]"
                >
                  {/* ----------------------------------------------------- */}
                  {/* CARD FRONT FACE                                       */}
                  {/* ----------------------------------------------------- */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden backdrop-blur-2xl bg-[#0b0816]/92 [backface-visibility:hidden] border-t border-b border-white/10 flex flex-col pt-3 px-5 pb-5 shadow-2xl"
                    style={{
                      borderLeft: "2.5px solid #a855f7",
                      borderRight: "2.5px solid #06b6d4",
                      boxShadow: "-8px 0 32px -6px rgba(168,85,247,0.60), 8px 0 32px -6px rgba(6,182,212,0.60)",
                    }}
                  >
                    {/* Top punch slot cutout for lanyard hook - clean, dark physical slot with no inner dot */}
                    <div className="w-11 h-2.5 rounded-full bg-[#030107] border border-white/20 shadow-[inset_0_2px_5px_rgba(0,0,0,0.98)] mx-auto mb-2 shrink-0" />

                    {/* Badge Header: AKM Brand */}
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="font-display font-extrabold text-base tracking-wider text-white">AKM</span>
                    </div>

                    {/* Akshay's Portrait Container — Restored Cinematic Background + Natural Photo */}
                    <div className="relative mx-auto w-full aspect-[1/1.02] rounded-xl overflow-hidden border border-white/15 bg-[#0d091a] shadow-xl">
                      {/* Cinematic purple, cyan & navy aura background BEHIND portrait */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10"
                        style={{
                          background: `
                            radial-gradient(circle at 82% 28%, rgba(6, 182, 212, 0.45), transparent 55%),
                            radial-gradient(circle at 18% 45%, rgba(168, 85, 247, 0.50), transparent 60%),
                            radial-gradient(circle at 50% 90%, rgba(139, 92, 246, 0.35), transparent 65%),
                            linear-gradient(145deg, #160c2b 0%, #0d1228 45%, #070914 100%)
                          `,
                        }}
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-4 -right-4 w-32 h-32 rounded-full bg-cyan-400/25 blur-2xl"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/4 -left-4 w-36 h-36 rounded-full bg-purple-600/30 blur-2xl"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-[#0b0816]/75 to-transparent"
                      />

                      {/* Authentic Portrait Image: 100% Original Natural Skin Tone & Attire */}
                      <img
                        src={portraitImg}
                        alt="Akshay Kumar Modi"
                        className="relative z-10 w-full h-full object-cover object-[center_14%]"
                        loading="eager"
                      />
                    </div>

                    {/* Exact Badge Identity Required Content Matching Reference Image */}
                    <div className="mt-auto pb-2 text-center flex flex-col items-center">
                      <h3 className="font-sans font-bold text-[1.12rem] sm:text-[1.18rem] tracking-wider text-white">
                        AKSHAY KUMAR MODI
                      </h3>
                      <p className="font-sans font-bold text-[0.68rem] sm:text-[0.72rem] tracking-[0.24em] text-[#d946ef] mt-0.5">
                        CREATIVE DEVELOPER
                      </p>
                    </div>

                    {/* Dynamic Specular Shimmer */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-80"
                    />
                  </div>

                  {/* ----------------------------------------------------- */}
                  {/* CARD BACK FACE                                        */}
                  {/* ----------------------------------------------------- */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden backdrop-blur-2xl bg-[#0b0816]/95 [backface-visibility:hidden] [transform:rotateY(180deg)] border-t border-b border-white/10 flex flex-col pt-3 px-5 pb-5 shadow-2xl justify-between"
                    style={{
                      borderLeft: "2.5px solid #06b6d4",
                      borderRight: "2.5px solid #a855f7",
                      boxShadow: "-8px 0 32px -6px rgba(6,182,212,0.60), 8px 0 32px -6px rgba(168,85,247,0.60)",
                    }}
                  >
                    {/* Top punch slot - clean, dark physical slot with no inner dot */}
                    <div className="w-11 h-2.5 rounded-full bg-[#030107] border border-white/20 shadow-[inset_0_2px_5px_rgba(0,0,0,0.98)] mx-auto shrink-0" />

                    {/* Back Header */}
                    <div className="flex items-center justify-between px-1 mt-1.5">
                      <span className="font-display font-extrabold text-base tracking-wider text-white">AKM</span>
                      <span className="text-[0.60rem] font-mono tracking-widest text-cyan-300 uppercase px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30">
                        PASSPORT
                      </span>
                    </div>

                    {/* About Akshay Back Bio */}
                    <div className="mt-2.5">
                      <h4 className="font-sans font-bold text-[0.98rem] tracking-wide text-white">ABOUT AKSHAY</h4>
                      <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" />
                      <p className="mt-2 text-[0.78rem] sm:text-[0.82rem] leading-relaxed text-slate-200">
                        A curious technology enthusiast exploring web development, artificial intelligence and creative digital experiences.
                      </p>
                    </div>

                    {/* Interests Section */}
                    <div className="mt-2">
                      <p className="font-bold text-[0.66rem] tracking-[0.24em] text-[#d946ef] uppercase mb-1.5">
                        INTERESTS:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { name: "Artificial Intelligence", dot: "bg-teal-300" },
                          { name: "Creative Technology", dot: "bg-purple-400" },
                          { name: "Coding and Experimentation", dot: "bg-fuchsia-400" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10"
                          >
                            <span className={`size-1.5 rounded-full ${item.dot} shadow-[0_0_8px_currentColor]`} />
                            <span className="text-[0.76rem] font-medium text-slate-200">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verified Developer Bottom Bar */}
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[0.62rem] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-teal-300">
                        <span className="size-1.5 rounded-full bg-teal-400 animate-pulse" />
                        VERIFIED DEVELOPER
                      </span>
                      <span className="tracking-widest">AKM-2026</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Click to flip interactive control */}
            <motion.button
              type="button"
              onClick={toggleFlip}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => play("hover")}
              className="glass-pill mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-300 hover:border-cyan-400/50 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            >
              <RotateCw className={`size-3.5 text-cyan-400 transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
              <span>Click to flip</span>
            </motion.button>
          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN: Typography, Quotes, Tagline, Skills & Interests */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Section Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5 }}
              className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.70rem] font-semibold tracking-wider text-cyan-300 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)] w-fit mb-2 sm:mb-2.5"
            >
              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <span>02 / ABOUT ME</span>
            </motion.div>

            {/* Main Editorial Serif Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="font-display text-[clamp(1.95rem,3.2vw,3.1rem)] font-medium leading-[1.08] tracking-tight text-white mb-2 sm:mb-2.5"
            >
              Beyond The Screen,
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Building What's Next.
              </span>
            </motion.h2>

            {/* Glowing Accent Rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="h-[2px] w-20 origin-left rounded-full bg-gradient-to-r from-purple-500 via-sky-400 to-transparent shadow-[0_0_10px_#a855f7] mb-2.5 sm:mb-3"
            />

            {/* Introduction Paragraphs with Purple Quote */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative flex gap-3 text-[0.88rem] sm:text-[0.93rem] leading-[1.5] text-slate-200 font-normal mb-2.5 sm:mb-3"
            >
              <span className="text-2xl sm:text-3xl leading-none text-purple-400 select-none font-serif opacity-90 -mt-0.5 shrink-0" aria-hidden>
                ❝
              </span>
              <div className="space-y-1.5 sm:space-y-2">
                <p>
                  I'm <strong className="text-white font-semibold">Akshay Kumar Modi</strong>, currently pursuing a B.Tech at Newton School of Technology, Rishihood University. I'm passionate about technology, full-stack development, creative problem-solving, and exploring the possibilities of AI.
                </p>
                <p className="text-slate-300/90">
                  From writing my first lines of code to building interactive digital experiences, my journey is driven by curiosity, creativity, and a constant desire to learn. I enjoy experimenting with new technologies, transforming ideas into reality, and building solutions that make an impact.
                </p>
              </div>
            </motion.div>

            {/* Highlighted Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="flex flex-wrap items-center gap-2 text-[0.70rem] sm:text-[0.76rem] font-bold tracking-[0.24em] mb-3 sm:mb-3.5"
            >
              <span className="text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">CURIOUS MIND.</span>
              <span className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">CREATIVE THINKER.</span>
              <span className="text-teal-300 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]">BUILDER.</span>
            </motion.div>

            {/* ----------------------------------------------------------- */}
            {/* INTERACTIVE SKILLS (MY SKILLS)                              */}
            {/* ----------------------------------------------------------- */}
            <div id="skills" className="mb-2.5 sm:mb-3 scroll-mt-24">
              <div className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.66rem] font-bold tracking-wider text-purple-300 border border-purple-500/20 mb-2">
                <Code2 className="size-3 text-purple-400" />
                <span>MY SKILLS</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
                {SKILLS.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.04 * idx }}
                      whileHover={{ y: -3, scale: 1.03 }}
                      onMouseEnter={() => play("hover")}
                      className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#0e0c1a]/85 border border-white/10 transition-all duration-300 backdrop-blur-md cursor-pointer ${s.glow}`}
                    >
                      <div className="size-9 sm:size-10 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/5 group-hover:scale-110 transition-transform duration-300">
                        <Icon className={`size-5 sm:size-6 ${s.customColor || ""}`} />
                      </div>
                      <span className="mt-2 text-[0.70rem] sm:text-[0.74rem] font-semibold text-white text-center leading-tight whitespace-pre-line">
                        {s.title}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* BEYOND THE CODE INTERESTS                                   */}
            {/* ----------------------------------------------------------- */}
            <div>
              <div className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.66rem] font-bold tracking-wider text-purple-300 border border-purple-500/20 mb-2">
                <Star className="size-3 text-purple-400 fill-purple-400" />
                <span>BEYOND THE CODE</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.96 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.04 * idx }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      onMouseEnter={() => play("hover")}
                      className={`glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.70rem] sm:text-[0.74rem] font-medium text-slate-200 transition-all duration-300 border border-white/10 cursor-pointer ${item.border} hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]`}
                    >
                      <Icon className={`size-3.5 ${item.color}`} />
                      <span>{item.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless atmospheric blend transition into the next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#0b0816]/60 to-[#0b0816] -z-20"
      />
    </section>
  );
}
