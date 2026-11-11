import { useEffect } from "react";
import { setLenis, prefersReducedMotion } from "@/lib/scroll";

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined" || prefersReducedMotion()) return;
    if (typeof process !== "undefined" && process.env && process.env["NODE_ENV"] === "test") return;

    let lenisInstance: import("lenis").default | null = null;

    import("lenis")
      .then(({ default: Lenis }) => {
        lenisInstance = new Lenis({
          autoRaf: true,
          anchors: true,
          duration: 0.9,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1.15,
          touchMultiplier: 1.5,
          infinite: false,
        });

        setLenis(lenisInstance);

        lenisInstance.on("scroll", () => {
          import("@/lib/sound").then(({ sound }) => sound.unlock()).catch(() => {});
        });
      })
      .catch(() => {});

    return () => {
      if (lenisInstance) {
        lenisInstance.destroy();
        setLenis(null);
      }
    };
  }, []);

  return null;
}
