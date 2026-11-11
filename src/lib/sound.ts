/**
 * Background Audio Controller for Akshay Kumar Modi's Portfolio.
 * Plays the peaceful piano soundscape continuously in a seamless loop.
 *
 * Rules:
 * - Plays automatically by default when any visitor enters the website.
 * - Leverages in-DOM <audio autoPlay> and reactive gesture unlocking for maximum browser compatibility.
 * - Single source of truth for ON/OFF state and user preference.
 * - Resilient multi-tier audio source fallbacks for reliable CDN/Vercel static asset delivery.
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
  private _isPlaying = false;
  private currentSourceIndex = 0;

  get enabled(): boolean {
    return this._isPlaying;
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
    this.listeners.forEach((l) => l(this._isPlaying));
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (this.audio) return this.audio;
    if (typeof window === "undefined") return null;

    try {
      // 1. First look for existing in-DOM audio element rendered by RootShell
      let audio = document.getElementById("akm-bg-audio") as HTMLAudioElement | null;
      if (!audio) {
        audio = new Audio();
        audio.id = "akm-bg-audio";
        audio.src = AUDIO_SOURCES[this.currentSourceIndex] ?? AUDIO_SOURCES[0] ?? "";
        audio.preload = "auto";
        audio.loop = true;
        audio.autoplay = true;
        try {
          document.body.appendChild(audio);
        } catch {
          /* ignore */
        }
      }

      audio.preload = "auto";
      audio.loop = true;
      audio.volume = TARGET_VOLUME;

      // Keep state synchronized with native media events
      audio.addEventListener("play", () => {
        this._isPlaying = true;
        this.emit();
      });

      audio.addEventListener("pause", () => {
        if (audio.paused && audio.volume === 0) {
          this._isPlaying = false;
          this.emit();
        }
      });

      // Automatic source fallback in case a CDN fails to serve a specific path
      audio.addEventListener("error", () => {
        if (this.currentSourceIndex < AUDIO_SOURCES.length - 1) {
          this.currentSourceIndex += 1;
          const nextSrc = AUDIO_SOURCES[this.currentSourceIndex];
          if (nextSrc) {
            audio!.src = nextSrc;
            audio!.load();
            audio!.play().catch(() => {});
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

  private registerUnlockListeners() {
    this.cleanupUnlockListeners();

    const unlock = () => {
      const a = this.ensureAudio();
      if (!a) return;

      a.volume = TARGET_VOLUME;
      a.muted = false;
      const playPromise = a.play();
      if (playPromise !== undefined && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            this.cleanupUnlockListeners();
            this._isPlaying = true;
            this.emit();
          })
          .catch(() => {
            // Keep listening until permission granted
          });
      } else {
        this.cleanupUnlockListeners();
        this._isPlaying = true;
        this.emit();
      }
    };

    // Listen on any possible user entry action: click, tap, key, or scroll
    const events = [
      "pointerdown",
      "mousedown",
      "touchstart",
      "touchend",
      "click",
      "keydown",
      "wheel",
      "scroll",
    ];

    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, unlock));
    };

    this.unlockCleanup = cleanup;
    events.forEach((e) => window.addEventListener(e, unlock, { once: true, passive: true }));
  }

  async autoStart() {
    if (typeof window === "undefined") return;

    const audio = this.ensureAudio();
    if (!audio) return;

    // Direct playback attempt with target volume
    audio.volume = TARGET_VOLUME;
    audio.muted = false;
    try {
      const p = audio.play();
      if (p !== undefined && typeof p.then === "function") {
        await p;
        this._isPlaying = true;
        this.emit();
        return;
      }
    } catch {
      // Browser blocked direct audible autoplay without user interaction:
      // Arm unlock listeners to start playback on the very first touch/scroll/click
    }

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
    if (this._isPlaying) {
      await this.turnOff();
    } else {
      await this.turnOn();
    }
  }

  async turnOn() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, "on");
      }
    } catch {
      /* ignore */
    }

    this.cleanupUnlockListeners();

    const audio = this.ensureAudio();
    if (audio) {
      audio.volume = TARGET_VOLUME;
      audio.muted = false;
      try {
        const p = audio.play();
        if (p !== undefined && typeof p.then === "function") {
          await p;
        }
        this._isPlaying = true;
        this.emit();
      } catch {
        this._isPlaying = false;
        this.emit();
        this.registerUnlockListeners();
      }
    } else {
      this._isPlaying = true;
      this.emit();
    }
  }

  async turnOff() {
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
    }

    this._isPlaying = false;
    this.emit();
  }

  play(_kind: "hover" | "click" | "success" = "click") {
    // Strictly no-op: strictly do not generate any synthetic sound effects
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
