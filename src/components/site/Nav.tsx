import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { useSound } from "@/hooks/use-sound";
import { sound } from "@/lib/sound";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "journey", label: "Journey" },
  { id: "contact", label: "Contact" },
] as const;

function SoundWaves({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
      {[0, 1].map((i) => (
        <path
          key={i}
          d={i === 0 ? "M8 6.5a5 5 0 0 1 0 7" : "M11.5 3.5a9 9 0 0 1 0 13"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className={cn("origin-left transition-opacity duration-500", on ? "opacity-100" : "opacity-25")}
          style={on ? { animation: `pulse 1.6s ${i * 0.25}s ease-in-out infinite` } : undefined}
        />
      ))}
    </svg>
  );
}

export function Nav() {
  const [active, setActive] = useState<string>("home");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const targetId = hoveredId || active;

  const [open, setOpen] = useState(false);
  const { enabled, toggle, play } = useSound();
  const [isVisible, setIsVisible] = useState(true);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const isNavigatingRef = useRef(false);

  // Active / hover glowing underline coordinates
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; ready: boolean }>({
    left: 0,
    top: 0,
    width: 0,
    ready: false,
  });

  // Calculate underline coordinates on active/hover change, window resize, or font load
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const targetEl = navRef.current.querySelector<HTMLElement>(`[data-nav-id="${targetId}"]`);
      if (targetEl) {
        const left = targetEl.offsetLeft + 10;
        const width = Math.max(0, targetEl.offsetWidth - 20);
        const top = targetEl.offsetTop + targetEl.offsetHeight - 2;
        setIndicator({ left, top, width, ready: true });
      }
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);
    document.fonts?.ready?.then(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    window.addEventListener("orientationchange", updateIndicator);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateIndicator);
      window.removeEventListener("orientationchange", updateIndicator);
    };
  }, [targetId]);

  // Section navigation handler
  const go = useCallback((id: string) => {
    sound.unlock?.();
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    sound.play("click");
    setOpen(false);
    setActive(id);
    scrollToSection(id);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 150);
  }, []);

  // Active section detection on scroll across all portfolio sections
  useEffect(() => {
    const onScroll = () => {
      const introEl = document.getElementById("intro");
      if (introEl) {
        const homeEl = document.getElementById("home");
        if (homeEl) {
          const homeTop = homeEl.getBoundingClientRect().top;
          setIsVisible(homeTop <= 80);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      const sectionIds = ["contact", "journey", "projects", "about"];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActive(id);
            return;
          }
        }
      }
      setActive("home");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Centralized listener for in-page programmatic navigation events (e.g. Hero CTA buttons)
  useEffect(() => {
    const onNavEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail?.id && !isNavigatingRef.current) {
        setIsVisible(true);
        go(detail.id);
      }
    };
    window.addEventListener("portfolio:navigation", onNavEvent);
    return () => window.removeEventListener("portfolio:navigation", onNavEvent);
  }, [go]);

  // Close mobile drawer on Escape or clicking outside
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (open && headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-[100] w-full bg-[#080514]/95 backdrop-blur-2xl backdrop-saturate-150 border-b border-purple-500/20 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.8)] select-none transition-all duration-500 ease-out",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      {/* Top Navbar Horizontal Bar */}
      <div className="relative h-16 sm:h-[4.25rem] w-full overflow-hidden">
        {/* 1. Subtle animated ambient gradient background (purple and electric-blue ambient drift) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 65% 150% at 20% -30%, rgba(168, 85, 247, 0.28), transparent 70%), radial-gradient(ellipse 55% 130% at 80% 130%, rgba(6, 182, 212, 0.22), transparent 70%), linear-gradient(90deg, rgba(147, 51, 234, 0.15) 0%, rgba(11, 8, 22, 0.3) 50%, rgba(6, 182, 212, 0.15) 100%)",
            backgroundSize: "200% 100%",
            animation: "navbar-ambient-drift 12s ease-in-out infinite alternate",
          }}
        />

        {/* Main Navbar Content Shell - Fully responsive on all device dimensions (320px mobile to 4K desktop) */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Left: Brand Logo */}
          <button
            type="button"
            onClick={() => go("home")}
            aria-label="Back to top"
            className="shrink-0 justify-self-start transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Logo className="text-xl sm:text-[1.85rem]" />
          </button>

          {/* Center: Desktop Navigation with Glowing Underline */}
          <nav
            ref={navRef}
            aria-label="Primary"
            onMouseLeave={() => setHoveredId(null)}
            className="relative hidden items-center rounded-full px-1.5 py-1 lg:flex"
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                data-nav-id={s.id}
                onClick={() => go(s.id)}
                onMouseEnter={() => {
                  setHoveredId(s.id);
                  play("hover");
                }}
                className={cn(
                  "relative z-10 rounded-full px-3 xl:px-4 py-1.5 text-sm xl:text-[0.95rem] transition-all duration-200",
                  (hoveredId || active) === s.id
                    ? "font-semibold text-foreground drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}

            {/* Smooth glowing underline tracking active and hovered item */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 top-0 h-[2.5px] rounded-full transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
                indicator.ready ? "opacity-100" : "opacity-0",
              )}
              style={{
                transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
                width: `${indicator.width}px`,
                background:
                  "linear-gradient(90deg, #c084fc 0%, #a855f7 40%, #06b6d4 100%)",
                boxShadow:
                  "0 0 14px 2px rgba(168, 85, 247, 0.85), 0 0 24px 4px rgba(6, 182, 212, 0.65)",
              }}
            />
          </nav>

          {/* Right: Sound On/Off, Profile/Admin, Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 justify-self-end">
            <button
              onClick={toggle}
              aria-pressed={enabled}
              aria-label={enabled ? "Turn sound off" : "Turn sound on"}
              className="glass-pill glow-border flex h-9 sm:h-10 md:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3.5 md:px-4 text-xs sm:text-sm md:text-[0.95rem] font-medium text-foreground transition-all duration-200 hover:scale-105 hover:border-primary-glow/60"
            >
              <span className="hidden sm:inline">Sound {enabled ? "On" : "Off"}</span>
              <SoundWaves on={enabled} />
            </button>

            <Link
              to="/admin"
              aria-label="Admin dashboard"
              className="glass-pill glow-border grid size-9 sm:size-10 md:size-11 place-items-center rounded-full text-foreground transition-all duration-200 hover:scale-105 hover:border-primary-glow/60"
            >
              <User className="size-4 sm:size-5" strokeWidth={1.6} />
            </Link>

            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="glass-pill glow-border grid size-9 sm:size-10 md:size-11 place-items-center rounded-full transition-all duration-200 hover:scale-105 lg:hidden"
            >
              {open ? <X className="size-4 sm:size-5" /> : <Menu className="size-4 sm:size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer - Unclipped & Responsive across all phone & tablet dimensions */}
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-50 w-full bg-[#080514]/98 border-t border-purple-500/20 py-3 px-3 sm:px-6 shadow-2xl backdrop-blur-2xl lg:hidden max-h-[calc(100svh-4.25rem)] overflow-y-auto overscroll-contain"
          >
            {/* Moving neon line on bottom of mobile drawer */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.35) 15%, rgba(192, 132, 252, 0.95) 35%, rgba(6, 182, 212, 1) 50%, rgba(168, 85, 247, 0.95) 65%, rgba(6, 182, 212, 0.35) 85%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "neon-border-sweep 7s linear infinite",
                boxShadow:
                  "0 0 12px 1px rgba(168, 85, 247, 0.6), 0 0 24px 2px rgba(6, 182, 212, 0.45)",
              }}
            />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-1.5">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-2.5 sm:py-3 text-left font-display text-base sm:text-lg transition-colors",
                    active === s.id
                      ? "bg-primary/20 text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  <span>{s.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
