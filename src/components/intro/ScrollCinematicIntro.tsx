import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { sound } from "@/lib/sound";
import { useSound } from "@/hooks/use-sound";
import { SoundWaves } from "@/components/site/Nav";
import { scrollToSection, getLenis } from "@/lib/scroll";
import { Logo } from "@/components/site/Logo";

const TOTAL_FRAMES = 120;

function getFrameUrl(index: number) {
  const pad = String(index + 1).padStart(3, "0");
  return `/intro-frames/frame-${pad}.jpg`;
}

interface ScrollCinematicIntroProps {
  onEnterPortfolio?: () => void;
}

export function ScrollCinematicIntro({ onEnterPortfolio }: ScrollCinematicIntroProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetProgressRef = useRef(0);
  const lastDrawnIndexRef = useRef<number>(-1);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const loadedFlagsRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));

  const [isLoaded, setIsLoaded] = useState(false);
  const [isNearEnd, setIsNearEnd] = useState(false);
  const { enabled, isPlaying, toggle } = useSound();

  // Transition into main portfolio (#home Hero section)
  const handleEnterPortfolio = useCallback(() => {
    sound.unlock?.();
    sound.play?.("click");
    onEnterPortfolio?.();
    scrollToSection("home");
  }, [onEnterPortfolio]);

  // Compute scroll progress through the intro track
  const updateProgress = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const raw = -rect.top / scrollable;
    const progress = Math.min(Math.max(raw, 0), 1);
    targetProgressRef.current = progress;

    // Near ending frames (>= 70% scroll progress), highlight/enable interactive Enter Portfolio
    setIsNearEnd(progress >= 0.70);
  }, []);

  // Dynamically size foreground canvas to device physical pixel resolution (prevents CSS upscaling blur)
  const updateCanvasResolution = useCallback(() => {
    const fgCanvas = canvasRef.current;
    if (!fgCanvas) return;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const rect = fgCanvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const targetW = Math.max(1920, Math.round(rect.width * dpr));
      const targetH = Math.max(1080, Math.round(rect.height * dpr));
      if (fgCanvas.width !== targetW || fgCanvas.height !== targetH) {
        fgCanvas.width = targetW;
        fgCanvas.height = targetH;
        lastDrawnIndexRef.current = -1; // Force redraw with sharp resolution
      }
    }
  }, []);

  // Scroll listener synchronization (both passive window scroll and Lenis if active)
  useEffect(() => {
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    window.addEventListener("resize", updateCanvasResolution, { passive: true });

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", updateProgress);
    }

    updateProgress();
    updateCanvasResolution();

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      window.removeEventListener("resize", updateCanvasResolution);      if (lenis) {
        lenis.off("scroll", updateProgress);
      }
    };
  }, [updateProgress, updateCanvasResolution]);

  // Synchronized draw helper for both sharp foreground and blurred background canvases
  const drawFramePair = useCallback((idx: number) => {
    const img = imagesRef.current[idx];
    if (!img || !loadedFlagsRef.current[idx]) return;
    if (lastDrawnIndexRef.current === idx) return;

    // 1. Sharp Foreground Canvas (Full physical resolution + high-quality smoothing)
    const fgCanvas = canvasRef.current;
    if (fgCanvas) {
      const fgCtx = fgCanvas.getContext("2d", { alpha: false });
      if (fgCtx) {
        fgCtx.imageSmoothingEnabled = true;
        fgCtx.imageSmoothingQuality = "high";
        fgCtx.drawImage(img, 0, 0, fgCanvas.width, fgCanvas.height);
      }
    }

    // 2. Blurred Ambient Background Canvas (960x540 for lightweight GPU performance)
    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext("2d", { alpha: false });
      if (bgCtx) {
        bgCtx.drawImage(img, 0, 0, 960, 540);
      }
    }

    lastDrawnIndexRef.current = idx;
  }, []);

  // Preload all 120 sequential frames progressively
  useEffect(() => {
    let isCancelled = false;

    // 1. Immediately load frame 0 (first frame) for instant zero-flash initial paint
    const img0 = new Image();
    img0.src = getFrameUrl(0);
    img0.onload = () => {
      if (isCancelled) return;
      imagesRef.current[0] = img0;
      loadedFlagsRef.current[0] = true;
      setIsLoaded(true);
      drawFramePair(0);
    };

    // 2. Preload final frame and key milestones early (for instant scrubbing and hold)
    const priorityIndices = [TOTAL_FRAMES - 1, 30, 60, 90];
    priorityIndices.forEach((idx) => {
      const img = new Image();
      img.src = getFrameUrl(idx);
      img.onload = () => {
        if (isCancelled) return;
        imagesRef.current[idx] = img;
        loadedFlagsRef.current[idx] = true;
      };
    });

    // 3. Incrementally preload all remaining frames
    const remaining: number[] = [];
    for (let i = 1; i < TOTAL_FRAMES - 1; i++) {
      if (!priorityIndices.includes(i)) {
        remaining.push(i);
      }
    }

    remaining.forEach((idx) => {
      const img = new Image();
      img.src = getFrameUrl(idx);
      img.onload = () => {
        if (isCancelled) return;
        imagesRef.current[idx] = img;
        loadedFlagsRef.current[idx] = true;
      };
    });

    return () => {
      isCancelled = true;
    };
  }, [drawFramePair]);

  // requestAnimationFrame scroll-driven continuous canvas rendering loop
  // Paused when intro section is off-screen to save GPU/CPU on the rest of the page
  useEffect(() => {
    let rafId: number;
    let isVisible = true;

    const render = () => {
      if (!isVisible) {
        rafId = 0;
        return;
      }

      // Map 0.0 to 0.85 to frames 0 to 119; 0.85 to 1.0 holds frame 119 (final frame)
      const normalized = Math.min(targetProgressRef.current / 0.85, 1);
      const targetFrame = Math.min(Math.floor(normalized * TOTAL_FRAMES), TOTAL_FRAMES - 1);

      // Find nearest ready frame if targetFrame is still loading
      let bestIndex = targetFrame;
      if (!loadedFlagsRef.current[bestIndex]) {
        let minDiff = Infinity;
        for (let i = 0; i < TOTAL_FRAMES; i++) {
          if (loadedFlagsRef.current[i]) {
            const diff = Math.abs(i - targetFrame);
            if (diff < minDiff) {
              minDiff = diff;
              bestIndex = i;
            }
          }
        }
      }

      drawFramePair(bestIndex);
      rafId = requestAnimationFrame(render);
    };

    // Pause the RAF loop when the intro is scrolled completely off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry ? entry.isIntersecting : true;
        if (nowVisible && !isVisible) {
          isVisible = true;
          if (!rafId) rafId = requestAnimationFrame(render);
        } else if (!nowVisible) {
          isVisible = false;
        }
      },
      { threshold: 0 },
    );

    const container = containerRef.current;
    if (container) io.observe(container);

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [drawFramePair]);

  return (
    <div
      id="intro"
      ref={containerRef}
      onTouchStart={() => sound.unlock?.()}
      onPointerDown={() => sound.unlock?.()}
      className="relative w-full h-[350vh] bg-[#070510] noise-overlay"
      aria-label="Cinematic Interactive Intro"
    >
      {/* Sticky Fullscreen Cinematic Viewport */}
      <div className="sticky top-0 h-[100svh] w-full flex items-center justify-center overflow-hidden bg-[#070510] select-none">
        
        {/* BACKGROUND LAYER: Current frame enlarged, soft cinematic blur, darkened & reduced opacity */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
        >
          <canvas
            ref={bgCanvasRef}
            width={960}
            height={540}
            className={`w-full h-full object-cover scale-110 filter blur-2xl md:blur-3xl brightness-70 contrast-95 opacity-60 transition-opacity duration-700 ${
              isLoaded ? "opacity-60" : "opacity-0"
            }`}
          />
          {/* Subtle cosmic vignette & ambient overlay to keep cosmic purple lighting balanced */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_40%,_#070510_92%] opacity-75" />
          <div className="absolute inset-0 bg-[#070510]/30" />
        </div>

        {/* FOREGROUND LAYER: Sharp centered 16:9 video container */}
        <div className="relative z-10 flex items-center justify-center w-full h-full max-w-[92vw] sm:max-w-[88vw] lg:max-w-[84vw] max-h-[78vh] sm:max-h-[80vh] lg:max-h-[82vh] p-2 pointer-events-none select-none">
          <div className="relative aspect-video w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className={`w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] drop-shadow-[0_0_35px_rgba(0,0,0,0.7)] transition-opacity duration-700 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Interactive Enter Portfolio Button Overlay on Final Frames */}
            <div
              className={`absolute z-30 transition-all duration-500 ease-out left-1/2 -translate-x-1/2 bottom-[4%] sm:bottom-[5%] flex flex-col items-center gap-2 ${
                isNearEnd ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              <button
                onClick={handleEnterPortfolio}
                aria-label="Enter Portfolio"
                className="pointer-events-auto group inline-flex items-center gap-2 rounded-full px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-[#190f33]/90 hover:bg-[#26134f]/95 border border-purple-400/70 hover:border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:shadow-[0_0_35px_rgba(192,132,252,0.7)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="tracking-wider">Enter Portfolio</span>
                <ArrowRight className="size-3.5 sm:size-4 text-purple-300 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              {/* Mouse Scroll Indicator */}
              <div className="flex flex-col items-center gap-0.5 select-none opacity-85">
                <div className="w-[15px] h-[24px] sm:w-[18px] sm:h-[28px] rounded-full border-[1.5px] border-purple-400/80 flex justify-center pt-1 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <div className="w-[2.5px] h-[5px] sm:w-[3px] sm:h-[6px] bg-purple-300 rounded-full animate-bounce" />
                </div>
                <ChevronDown className="size-3 text-purple-400 animate-pulse -mt-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden video node for testing / fallback media integrity */}
        <video
          ref={videoRef}
          src="/video/cinematic-intro-scrub.mp4"
          playsInline
          muted
          preload="none"
          className="hidden pointer-events-none"
          aria-hidden="true"
        />

        {/* Loading placeholder skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#070510] text-purple-300">
            <div className="size-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">
              Loading Cinematic Intro...
            </span>
          </div>
        )}

        {/* TOP HEADER: Stylized AKM Logo (Left) and Skip Intro (Right) */}
        <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-5 sm:p-8 pointer-events-none">
          {/* Top-Left: AKM Logo */}
          <button
            onClick={handleEnterPortfolio}
            aria-label="AKM Logo - Enter Portfolio"
            className="pointer-events-auto group flex items-center transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <Logo className="text-xl sm:text-[1.85rem] drop-shadow-[0_0_15px_rgba(192,132,252,0.85)] filter brightness-110" />
          </button>

          {/* Top-Right: Sound toggle and Skip Intro */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? "Turn sound off" : "Turn sound on"}
              className="glass-pill glow-border group inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 bg-[#120e24]/75 hover:bg-[#1a1236]/95 border border-purple-500/30 hover:border-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(192,132,252,0.5)] backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span className="hidden xs:inline">Sound {isPlaying ? "On" : "Off"}</span>
              <SoundWaves on={isPlaying} />
            </button>

            <button
              onClick={handleEnterPortfolio}
              aria-label="Skip Intro"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 bg-[#120e24]/75 hover:bg-[#1a1236]/95 border border-purple-500/30 hover:border-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(192,132,252,0.5)] backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span className="tracking-wide">Skip Intro</span>
              <span className="text-purple-400 text-xs sm:text-sm transition-transform duration-300 group-hover:translate-x-0.5">
                ⏩
              </span>
            </button>
          </div>
        </header>

        {/* BOTTOM FOOTER: Dream • Code • Create | Let's Build Something Amazing 💜 */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-8 flex items-end justify-between pointer-events-none">
          {/* Bottom-Left: | Dream • Code • Create */}
          <div className="hidden xs:flex items-center gap-2 text-xs sm:text-sm tracking-widest text-slate-300/85 font-light select-none transition-opacity duration-500">
            <span className="inline-block w-[3px] h-4 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span>Dream • Code • Create</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom-Right: Let's Build Something Amazing 💜 */}
          <div className="hidden xs:flex items-center gap-1.5 text-xs sm:text-sm tracking-wider text-slate-300/85 font-light select-none transition-opacity duration-500">
            <span>Let's Build Something Amazing</span>
            <span className="text-purple-400 text-xs sm:text-sm">💜</span>
          </div>
        </div>
      </div>
    </div>
  );
}
