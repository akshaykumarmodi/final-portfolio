/**
/**
 * Background Audio Controller for Akshay Kumar Modi's Portfolio.
 * Plays the peaceful piano soundscape continuously in a seamless loop.
 *
 * Rules:
 * - Plays automatically by default as soon as anyone clicks or opens the website link.
 * - Attempts immediate unmuted playback upon page load.
 * - If browser autoplay policy holds back unmuted sound without interaction, starts the stream
 *   in pre-buffered mode and seamlessly unlocks audible sound on the visitor's very first
 *   interaction (mouse movement, scroll, swipe, touch, click, or keypress).
 * - Single source of truth for ON/OFF state and user preference.
 * - Preserves playback position on pause so toggling ON resumes smoothly.
 */

type Listener = (isPlaying: boolean) => void;

const STORAGE_KEY = "akm-sound";

// Web-safe static asset paths with reliable MIME support across CDNs/Vercel
const AUDIO_SOURCES = [
  "/audio/peaceful-piano-ambient.mp3",
  "/audio/peaceful-piano.mp3",
  "/audio/Peaceful%20Piano%20%2B%20Nature%20Sounds%2020%20Minutes%20of%20Calm%20for%20Sleep.mp3",
];

const TARGET_VOLUME = 0.75; // Comfortable, gentle ambient volume

class SoundEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private unlockCleanup: (() => void) | null = null;
  private _enabled = true;
  private _isPlaying = false;
  private isUnlocking = false;
  private currentSourceIndex = 0;

  constructor() {
    this._enabled = this.getStoredPreference();
    this._isPlaying = false;
    if (typeof window !== "undefined") {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        void this.autoStart();
      } else {
        window.addEventListener("DOMContentLoaded", () => void this.autoStart(), { once: true });
        window.addEventListener("load", () => void this.autoStart(), { once: true });
      }
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  getStoredPreference(): boolean {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "off") return false;
      return true;
    } catch {
      return true;
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this._enabled));
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (this.audio) return this.audio;
    if (typeof window === "undefined") return null;

    try {
      // 1. Look for existing in-DOM audio element rendered by RootShell
      let audio = document.getElementById("akm-bg-audio") as HTMLAudioElement | null;
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "akm-bg-audio";
        audio.src = AUDIO_SOURCES[this.currentSourceIndex] ?? AUDIO_SOURCES[0] ?? "";
        audio.preload = "auto";
        audio.loop = true;
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("webkit-playsinline", "true");
        audio.style.position = "fixed";
        audio.style.top = "-9999px";
        audio.style.left = "-9999px";
        audio.style.opacity = "0";
        audio.style.pointerEvents = "none";
        try {
          document.body.appendChild(audio);
        } catch {
          /* ignore */
        }
      }

      audio.preload = "auto";
      audio.loop = true;
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");

      if (!audio.paused && !audio.muted && audio.volume > 0) {
        this._isPlaying = true;
      }

      // Synchronize state with native media events
      audio.addEventListener("play", () => {
        if (!audio?.muted && (audio?.volume ?? 0) > 0) {
          this._isPlaying = true;
          this.emit();
        }
      });

      audio.addEventListener("pause", () => {
        if (!this._enabled) {
          this._isPlaying = false;
          this.emit();
        }
      });

      // Automatic source fallback in case of network CDN issues
      audio.addEventListener("error", () => {
        if (this.currentSourceIndex < AUDIO_SOURCES.length - 1) {
          this.currentSourceIndex += 1;
          const nextSrc = AUDIO_SOURCES[this.currentSourceIndex];
          if (nextSrc && audio) {
            audio.src = nextSrc;
            audio.load();
            if (this._enabled && typeof audio.play === "function") {
              audio.play().catch(() => {});
            }
          }
        }
      });

      this.audio = audio;
      return audio;
    } catch {
      return null;
    }
  }

  private cleanupUnlockListeners() {
    if (this.unlockCleanup) {
      this.unlockCleanup();
      this.unlockCleanup = null;
    }
  }

  /**
   * Immediately activates audible sound if enabled.
   * Can be invoked by any user gesture (scroll, mousemove, touch, click, key).
   */
  public unlock() {
    if (!this._enabled) return;

    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] === "test" &&
      typeof window.HTMLMediaElement !== "undefined" &&
      !window.HTMLMediaElement.prototype.play?.toString().includes("spy") &&
      !window.HTMLMediaElement.prototype.play?.toString().includes("fn")
    ) {
      return;
    }

    const audio = this.ensureAudio();
    if (!audio) return;

    audio.muted = false;
    audio.volume = TARGET_VOLUME;

    if (audio.paused) {
      if (typeof audio.play === "function") {
        try {
          const promise = audio.play();
          if (promise && typeof promise.then === "function") {
            promise
              .then(() => {
                this._isPlaying = true;
                this.cleanupUnlockListeners();
                this.emit();
              })
              .catch(() => {
                // Browser may require another gesture tick
              });
          } else {
            this._isPlaying = true;
            this.cleanupUnlockListeners();
            this.emit();
          }
        } catch {
          // Keep listening
        }
      }
    } else {
      this._isPlaying = true;
      this.cleanupUnlockListeners();
      this.emit();
    }
  }

  private registerUnlockListeners() {
    this.cleanupUnlockListeners();
    if (!this._enabled) return;

    const unlockHandler = () => {
      if (!this._enabled) {
        this.cleanupUnlockListeners();
        return;
      }
      this.unlock();
    };

    // Universal interaction triggers across desktop and mobile devices
    const events = [
      "pointerdown",
      "pointerup",
      "mousedown",
      "mouseup",
      "touchstart",
      "touchend",
      "touchmove",
      "click",
      "keydown",
      "keyup",
      "wheel",
      "scroll",
      "pointermove",
      "mousemove",
      "focus",
    ];

    events.forEach((e) => {
      window.addEventListener(e, unlockHandler, { capture: true, passive: true });
      document.addEventListener(e, unlockHandler, { capture: true, passive: true });
    });

    this.unlockCleanup = () => {
      events.forEach((e) => {
        window.removeEventListener(e, unlockHandler, { capture: true });
        document.removeEventListener(e, unlockHandler, { capture: true });
      });
    };
  }

  async autoStart() {
    if (typeof window === "undefined") return;
    if (!this._enabled) return;

    // In non-mocked JSDOM test environments, avoid triggering JSDOM not-implemented warning
    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] === "test" &&
      typeof window.HTMLMediaElement !== "undefined" &&
      !window.HTMLMediaElement.prototype.play?.toString().includes("spy") &&
      !window.HTMLMediaElement.prototype.play?.toString().includes("fn")
    ) {
      return;
    }

    const audio = this.ensureAudio();
    if (!audio) return;

    // 1. First attempt: Direct unmuted playback immediately on link click / page load
    audio.volume = TARGET_VOLUME;
    audio.muted = false;

    if (typeof audio.play === "function") {
      try {
        const promise = audio.play();
        if (promise && typeof promise.then === "function") {
          await promise;
        }
        if (!audio.paused && !audio.muted) {
          this._isPlaying = true;
          this.cleanupUnlockListeners();
          this.emit();
          return;
        }
      } catch {
        // Direct unmuted autoplay held back by browser policy
        this._isPlaying = false;
      }
    }

    // 2. Pre-buffer and start audio timeline (muted playback is universally allowed)
    audio.muted = true;
    if (typeof audio.play === "function") {
      try {
        const promise = audio.play();
        if (promise && typeof promise.then === "function") {
          promise.catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

    // 3. Register universal gesture & movement listeners to unmute and play audible sound
    this.registerUnlockListeners();
  }

  async setEnabled(on: boolean) {
    if (on) {
      await this.turnOn();
    } else {
      await this.turnOff();
    }
  }

  async toggle() {
    if (this._enabled) {
      await this.turnOff();
    } else {
      await this.turnOn();
    }
  }

  async turnOn() {
    this._enabled = true;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, "on");
      }
    } catch {
      /* ignore */
    }

    this.cleanupUnlockListeners();
    this.unlock();

    const audio = this.ensureAudio();
    if (audio) {
      audio.volume = TARGET_VOLUME;
      audio.muted = false;
      if (audio.paused) {
        if (typeof audio.play === "function") {
          try {
            await audio.play();
            this._isPlaying = true;
          } catch {
            this._isPlaying = false;
            this.registerUnlockListeners();
          }
        } else {
          this._isPlaying = true;
        }
      } else {
        this._isPlaying = true;
      }
    } else {
      this._isPlaying = true;
    }
    this.emit();
  }

  async turnOff() {
    this._enabled = false;
    this._isPlaying = false;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, "off");
      }
    } catch {
      /* ignore */
    }

    this.cleanupUnlockListeners();

    if (this.audio) {
      try {
        this.audio.pause();
      } catch {
        /* ignore */
      }
      this.audio.volume = 0;
      this.audio.muted = true;
    }

    this.emit();
  }

  play(_kind: "hover" | "click" | "success" = "click") {
    // Strictly no-op: preserve signature without synthetic audio fx
  }
}

// Window singleton prevents duplicate audio instances across HMR or multiple imports
declare global {
  interface Window {
    __akm_sound_engine__?: SoundEngine;
  }
}

export const sound: SoundEngine =
  typeof window !== "undefined"
    ? (window.__akm_sound_engine__ = window.__akm_sound_engine__ || new SoundEngine())
    : new SoundEngine();
