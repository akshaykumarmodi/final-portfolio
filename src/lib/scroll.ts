import type Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenisInstance = l;
}

export function getLenis() {
  return lenisInstance;
}

export function scrollToSection(id: string) {
  if (typeof window === "undefined") return;

  const smooth = !prefersReducedMotion();
  const behavior: ScrollBehavior = smooth ? "smooth" : "auto";

  // Broadcast programmatic navigation event so the navbar remains pinned visible
  window.dispatchEvent(new CustomEvent("portfolio:navigation", { detail: { id } }));

  if (id === "intro") {
    if (lenisInstance) {
      lenisInstance.scrollTo(0, {
        duration: smooth ? 1.0 : 0,
        immediate: !smooth,
      });
      return;
    }
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const el = document.getElementById(id);
  if (!el) {
    if (id === "home") {
      if (lenisInstance) {
        lenisInstance.scrollTo(0, {
          duration: smooth ? 1.0 : 0,
          immediate: !smooth,
        });
        return;
      }
      window.scrollTo({ top: 0, behavior });
    }
    return;
  }

  if (lenisInstance) {
    lenisInstance.scrollTo(el, {
      duration: smooth ? 0.9 : 0,
      immediate: !smooth,
    });
    return;
  }

  // Navigate to the exact beginning of the section without leaving any portion of previous sections visible
  const targetTop = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY));

  window.scrollTo({
    top: targetTop,
    behavior,
  });
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
