import { Component, ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Send } from "lucide-react";
import heroBg from "@/assets/hero-bg.webp";
import portrait from "@/assets/akshay-portrait.webp";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { hasWebGL, prefersReducedMotion, scrollToSection } from "@/lib/scroll";
import { PORTRAIT_ASPECT, PORTRAIT_BOTTOM, PORTRAIT_MAX_H, PORTRAIT_MAX_W, PORTRAIT_X } from "@/components/three/layout";
import { cn } from "@/lib/utils";
import { HeroFog } from "./HeroFog";
import HeroScene from "@/components/three/HeroScene";

class SafeHeroScene extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  override componentDidCatch(err: unknown) {
    console.warn("Hero 3D WebGL scene error, falling back to static portrait:", err);
  }
  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Preload and eagerly decode portrait image in memory as early as possible
if (typeof window !== "undefined") {
  const preloadImg = new Image();
  preloadImg.src = portrait;
  if (preloadImg.decode) {
    preloadImg.decode().catch(() => {});
  }
}

// Global flag to ensure the entrance animation only plays once per session
let hasHeroMountedOnce = false;

const ease = [0.16, 1, 0.3, 1] as const;

function RevealWords({
  text,
  delay = 0,
  className,
  reduced = false,
}: {
  text: string;
  delay?: number;
  className?: string;
  reduced?: boolean;
}) {
  return (
    <span className="inline-block">
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.14em] align-bottom">
          <motion.span
            className={cn("inline-block", className)}
            initial={reduced ? false : { y: "105%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.95, delay: reduced ? 0 : delay + i * 0.12, ease }}
          >
            {w}
            {i < text.split(" ").length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const { play } = useSound();
  const sectionRef = useRef<HTMLElement>(null);
  const [isWebGL, setIsWebGL] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [isInitialMount] = useState(() => !hasHeroMountedOnce);

  useEffect(() => {
    hasHeroMountedOnce = true;
    if (hasWebGL() && window.innerWidth >= 768) {
      setIsWebGL(true);
    }
    if (prefersReducedMotion()) {
      setReduced(true);
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e) setVisible(e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fallbackStyle = {
    width: `min(${PORTRAIT_MAX_W * 100}cqw, ${PORTRAIT_MAX_H * 100 * PORTRAIT_ASPECT}cqh)`,
    bottom: `${PORTRAIT_BOTTOM * 100}cqh`,
    left: `calc(50% + ${PORTRAIT_X * 100}cqw)`,
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0b0816] noise-overlay lg:h-[100svh] lg:min-h-[44rem]"
    >
      {/* Background world: continuous with About, Projects & Journey */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-[position:60%_100%] opacity-85"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[image:var(--gradient-aurora)] opacity-60" />

      {/* FULL HERO CINEMATIC FOG - Continuous 3-layer atmospheric animation covering entire hero */}
      <HeroFog />

      <div className="relative flex flex-1 flex-col lg:block">
        {/* Right: 3D portrait stage - Silky, smooth entrance synchronized with headline reveal */}
        <motion.div
          initial={reduced || !isInitialMount ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.25, delay: reduced ? 0 : 0.2, ease }}
          className="pointer-events-none relative order-2 h-[68svh] w-full [container-type:size] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[60%]"
        >
          {/* Static high-resolution image: instantly visible on first frame until 3D scene is ready */}
          <img
            src={portrait}
            alt="Portrait of Akshay Kumar Modi"
            width={1100}
            height={1060}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className={cn(
              "absolute -translate-x-1/2 select-none [mask-image:linear-gradient(to_top,transparent_0%,black_16%)] transition-opacity duration-700",
              isWebGL && sceneReady ? "opacity-0" : "opacity-100",
            )}
            style={fallbackStyle}
          />

          {/* Interactive 3D WebGL layer overlay (when WebGL is supported) */}
          {isWebGL && (
            <div className="absolute inset-0">
              <SafeHeroScene>
                <Suspense fallback={null}>
                  <HeroScene
                    active={visible}
                    reduced={reduced}
                    onReady={() => setSceneReady(true)}
                  />
                </Suspense>
              </SafeHeroScene>
            </div>
          )}
        </motion.div>

        {/* Foreground rock: the same backdrop, masked to its lower band, so the portrait rises from behind it */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 hidden bg-cover bg-[position:60%_100%] [mask-image:linear-gradient(to_bottom,transparent_76%,black_90%)] lg:block"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        {/* Left: copy with dedicated navbar top clearance */}
        <div className="section-shell relative z-20 order-1 flex flex-col justify-start lg:justify-center pt-28 sm:pt-32 lg:pt-28 pb-12 lg:h-full">
          <div className="my-auto max-w-[40rem] pt-2 sm:pt-4">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: reduced ? 0 : 0.1, ease }}
              className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] font-medium"
            >
              <span className="origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1.6s_2]" aria-hidden>
                👋
              </span>
              Hello, I'm
            </motion.div>

            <h1 className="mt-5 sm:mt-7 text-[clamp(2.05rem,6.4vw,7.2rem)] font-medium leading-[0.94] text-foreground">
              <RevealWords text="Akshay Kumar" delay={0.25} reduced={reduced} />
              <br />
              <RevealWords text="Modi." delay={0.52} className="text-gradient-violet" reduced={reduced} />
            </h1>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: reduced ? 0 : 0.7, ease }}
              className="mt-6 sm:mt-8"
            >
              <p className="font-sans text-[0.60rem] min-[360px]:text-[0.66rem] min-[390px]:text-[0.74rem] sm:text-[0.92rem] font-semibold tracking-[0.18em] min-[360px]:tracking-[0.24em] min-[390px]:tracking-[0.32em] sm:tracking-[0.42em] text-foreground uppercase max-w-full">
                DESIGNING . DEVELOPING . CREATING .
              </p>
            </motion.div>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: reduced ? 0 : 0.85, ease }}
              className="mt-5 sm:mt-7 max-w-[34rem] text-sm sm:text-[1.06rem] lg:text-[1.15rem] leading-relaxed text-foreground/90"
            >
              I build end-to-end digital experiences, explore emerging technologies, and turn ideas into reality. Focused on full-stack engineering, creative development, and applied AI.
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: reduced ? 0 : 1.0, ease }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-6"
            >
              <Button
                variant="hero"
                size="xl"
                onMouseEnter={() => play("hover")}
                onClick={() => {
                  play("click");
                  scrollToSection("projects");
                }}
                className="w-full sm:w-auto justify-between"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/25 to-transparent transition-transform duration-1000 ease-[var(--ease-cinematic)] group-hover:translate-x-full" />
                Explore My Work
                <span className="grid size-10 place-items-center rounded-full bg-obsidian/70 transition-transform duration-500 group-hover:translate-x-1">
                  <ChevronRight className="!size-5" />
                </span>
              </Button>
              <Button
                variant="glass"
                size="xl"
                onMouseEnter={() => play("hover")}
                onClick={() => {
                  play("click");
                  scrollToSection("contact");
                }}
                className="w-full sm:w-auto justify-between"
              >
                Let's Connect
                <span className="grid size-10 place-items-center rounded-full border border-glass-border transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12">
                  <Send className="!size-[1.1rem]" />
                </span>
              </Button>
            </motion.div>

            <motion.button
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: reduced ? 0 : 1.15, ease }}
              onClick={() => scrollToSection("about")}
              className="mt-14 hidden items-center gap-4 text-muted-foreground transition-colors hover:text-foreground lg:flex"
            >
              <span className="relative flex h-10 w-6 justify-center rounded-full border border-foreground/40 pt-2">
                <span className="h-2 w-[3px] animate-scroll-dot rounded-full bg-foreground/80" />
              </span>
              Scroll to explore
            </motion.button>
          </div>
        </div>
      </div>

      {/* Seamless atmospheric blend transition into About section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#0b0816]/60 to-[#0b0816] z-[12]"
      />
    </section>
  );
}
