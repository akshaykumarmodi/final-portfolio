import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { setLenis, prefersReducedMotion } from "@/lib/scroll";

export function SmoothScroll() {
  let pathname = "/";
  try {
    const loc = useLocation();
    pathname = loc.pathname;
  } catch {
    if (typeof window !== "undefined") {
      pathname = window.location.pathname;
    }
  }

  const isAdmin = pathname.startsWith("/admin");
  const lenisRef = useRef<import("lenis").default | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || prefersReducedMotion()) return;
    if (typeof process !== "undefined" && process.env && process.env["NODE_ENV"] === "test") return;

    if (isAdmin) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenis(null);
      }
      return;
    }

    if (!lenisRef.current) {
      import("lenis")
        .then(({ default: Lenis }) => {
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;
          const instance = new Lenis({
            autoRaf: true,
            anchors: true,
            lerp: 0.18,
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.0,
            infinite: false,
            orientation: "vertical",
            gestureOrientation: "vertical",
          });

          lenisRef.current = instance;
          setLenis(instance);
        })
        .catch(() => {});
    }

    // Keyboard navigation handler: smoothly scrolls on ArrowUp/ArrowDown, PageUp/PageDown, Space, Home, End
    // Completely eliminates jerky native scroll jumps that fight with smooth scroll systems
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          target.closest('[role="dialog"]') ||
          target.closest("[data-lenis-prevent]"))
      ) {
        return;
      }

      const instance = lenisRef.current;
      if (!instance) return;

      let delta = 0;
      const step = 100;
      const pageStep = window.innerHeight * 0.82;

      if (e.key === "ArrowDown") {
        delta = step;
      } else if (e.key === "ArrowUp") {
        delta = -step;
      } else if (e.key === "PageDown") {
        delta = pageStep;
      } else if (e.key === "PageUp") {
        delta = -pageStep;
      } else if (e.key === " " && !e.shiftKey) {
        delta = pageStep;
      } else if (e.key === " " && e.shiftKey) {
        delta = -pageStep;
      } else if (e.key === "Home") {
        e.preventDefault();
        instance.scrollTo(0, { duration: 0.45 });
        return;
      } else if (e.key === "End") {
        e.preventDefault();
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        instance.scrollTo(maxScroll, { duration: 0.45 });
        return;
      } else {
        return;
      }

      e.preventDefault();
      const currentTarget = instance.targetScroll ?? window.scrollY;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const nextTarget = Math.max(0, Math.min(maxScroll, currentTarget + delta));
      // Fast 100ms response for arrow keys eliminates sluggish keyboard lag while maintaining smooth interpolation
      instance.scrollTo(nextTarget, {
        duration: Math.abs(delta) > 200 ? 0.22 : 0.10,
        immediate: false,
      });
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenis(null);
      }
    };
  }, [isAdmin, pathname]);

  return null;
}
