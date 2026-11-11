/**
 * Background Audio Controller for Akshay Kumar Modi's Portfolio.
 * Plays the exact peaceful piano soundscape continuously in a seamless loop.
 *
 * Rules:
 * - Plays the exact uploaded track continuously in a seamless loop.
 * - Single source of truth for ON/OFF state and user preference.
 * - Respects modern browser autoplay restrictions and unlocks on first user interaction.
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
  private fadeRaf = 0;
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
      const audio = new Audio();
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = 0;
      audio.src = AUDIO_SOURCES[this.currentSourceIndex] ?? AUDIO_SOURCES[0] ?? "";

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
            audio.src = nextSrc;
            audio.load();
            if (this._isPlaying) {
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

  private registerUnlockListeners() {
    this.cleanupUnlockListeners();

    if (!this.getStoredPreference()) return;

    const unlock = () => {
      if (!this.getStoredPreference()) {
        this.cleanupUnlockListeners();
        return;
      }

      const a = this.ensureAudio();
      if (!a) return;

      if (a.paused) {
        a.volume = 0;
        const playPromise = a.play();
        if (playPromise !== undefined && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              this.cleanupUnlockListeners();
              this.fadeTo(TARGET_VOLUME, 1000);
              this._isPlaying = true;
              this.emit();
            })
            .catch(() => {
              // Wait for next permitted user gesture
            });
        }
      } else {
        this.cleanupUnlockListeners();
        this._isPlaying = true;
        this.emit();
      }
    };

    // Only genuine user activation gestures allowed by browser autoplay policy
    const events = [
      "pointerdown",
      "touchstart",
      "touchend",
      "click",
      "keydown",
    ];

    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, unlock));
    };

    this.unlockCleanup = cleanup;
    events.forEach((e) => window.addEventListener(e, unlock, { once: true, passive: true }));
  }

  private fadeTo(targetVolume: number, durationMs = 800) {
    if (typeof window === "undefined") return;
    if (this.fadeRaf) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = 0;
    }

    const audio = this.audio;
    if (!audio) return;

    if (durationMs <= 0) {
      audio.volume = targetVolume;
      if (targetVolume === 0) {
        try {
          audio.pause();
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const startVolume = audio.volume;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      const vol = startVolume + (targetVolume - startVolume) * ease;

      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
      }

      if (progress < 1) {
        this.fadeRaf = requestAnimationFrame(step);
      } else {
        this.fadeRaf = 0;
        if (targetVolume === 0 && this.audio) {
          try {
            this.audio.pause();
          } catch {
            /* ignore */
          }
        }
      }
    };

    this.fadeRaf = requestAnimationFrame(step);
  }

  async autoStart() {
    if (typeof window === "undefined") return;

    // Respect explicit OFF choice from prior visit
    if (!this.getStoredPreference()) {
      this._isPlaying = false;
      this.emit();
      return;
    }

    const audio = this.ensureAudio();
    if (!audio) return;

    // If audio is already playing, keep current playing state
    if (!audio.paused && this._isPlaying) {
      return;
    }

    // Attempt direct autoplay
    try {
      audio.volume = 0;
      const p = audio.play();
      if (p !== undefined && typeof p.then === "function") {
        await p;
        this.fadeTo(TARGET_VOLUME, 1200);
        this._isPlaying = true;
        this.emit();
        return;
      }
    } catch {
      // Browser blocked audible autoplay without user interaction
    }

    // Register unlock listeners for the first permitted user gesture
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
      try {
        if (audio.paused) {
          audio.volume = 0;
          const p = audio.play();
          if (p !== undefined && typeof p.then === "function") {
            await p;
          }
        }
        this.fadeTo(TARGET_VOLUME, 600);
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

    if (this.fadeRaf) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = 0;
    }

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
