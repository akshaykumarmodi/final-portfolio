import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollCinematicIntro } from "@/components/intro/ScrollCinematicIntro";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Projects } from "@/components/site/Projects";
import { Journey } from "@/components/site/Journey";
import { Contact } from "@/components/site/Contact";
import portraitUrl from "@/assets/akshay-portrait.webp";
import { Logo } from "@/components/site/Logo";
import { scrollToSection } from "@/lib/scroll";
import { useSound } from "@/hooks/use-sound";
import { ArrowUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Akshay Kumar Modi — Developer & Creative Technologist" },
      {
        name: "description",
        content:
          "Portfolio of Akshay Kumar Modi: frontend engineering, creative technology and applied AI. Student at Newton School of Technology, Rishihood University.",
      },
      { property: "og:title", content: "Akshay Kumar Modi — Developer & Creative Technologist" },
      {
        property: "og:description",
        content: "Designing. Developing. Creating. Explore projects, skills and the journey so far.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preload",
        href: portraitUrl,
        as: "image",
        type: "image/webp",
      },
    ],
  }),
  component: Index,
});

// ---------------------------------------------------------------------------
// Atmospheric Site Footer
// ---------------------------------------------------------------------------
function SiteFooter() {
  const { play } = useSound();

  return (
    <footer className="relative z-20 bg-[#0b0816] py-12 text-foreground select-none">
      <div className="section-shell mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo className="text-xl" />
          <span className="text-xs text-slate-400 font-mono">
            © {new Date().getFullYear()} Akshay Kumar Modi. All rights reserved.
          </span>
        </div>

        <button
          onClick={() => {
            play("click");
            scrollToSection("home");
          }}
          className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <ArrowUp className="size-3.5" />
          Back to Top
        </button>
      </div>
    </footer>
  );
}

function Index() {
  const [hasEnteredPortfolio, setHasEnteredPortfolio] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.location.hash && window.location.hash !== "#intro");
  });

  useEffect(() => {
    let ticking = false;
    const checkHome = () => {
      const homeEl = document.getElementById("home");
      if (homeEl) {
        const homeTop = homeEl.getBoundingClientRect().top;
        if (homeTop <= 100) {
          setHasEnteredPortfolio(true);
        } else if (homeTop > 200) {
          setHasEnteredPortfolio(false);
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        checkHome();
        ticking = false;
      });
    };

    const onNavEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail?.id && detail.id !== "intro") {
        setHasEnteredPortfolio(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("portfolio:navigation", onNavEvent);
    checkHome();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("portfolio:navigation", onNavEvent);
    };
  }, []);

  return (
    <main className="relative">
      {hasEnteredPortfolio && <Nav />}
      {/* 00 — SCROLL-DRIVEN CINEMATIC INTRO */}
      <ScrollCinematicIntro onEnterPortfolio={() => setHasEnteredPortfolio(true)} />

      {/* 01 — HERO */}
      <Hero />

      {/* 02 — ABOUT */}
      <About />

      {/* 03 — PROJECTS */}
      <Projects />

      {/* 04 — JOURNEY */}
      <Journey />

      {/* 05 — CONTACT */}
      <Contact />

      {/* 06 — FOOTER */}
      <SiteFooter />
    </main>
  );
}
