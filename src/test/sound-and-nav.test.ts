import { describe, it, expect, vi, beforeEach } from "vitest";
import { sound } from "@/lib/sound";
import { scrollToSection } from "@/lib/scroll";

// Mock HTMLMediaElement play/pause for JSDOM
if (typeof window !== "undefined" && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
}

describe("SoundEngine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to true for automatic startup unless explicitly muted", () => {
    expect(sound.getStoredPreference()).toBe(true);
  });

  it("stores 'on' preference when enabled and 'off' when disabled", async () => {
    await sound.setEnabled(true);
    expect(sound.enabled).toBe(true);
    expect(localStorage.getItem("akm-sound")).toBe("on");

    await sound.setEnabled(false);
    expect(sound.enabled).toBe(false);
    expect(localStorage.getItem("akm-sound")).toBe("off");
  });

  it("does not play audio cues when sound is disabled", async () => {
    await sound.setEnabled(false);
    expect(() => sound.play("click")).not.toThrow();
    // Sound is disabled, play() exits immediately without throwing
  });

  it("toggles enabled state correctly with sound.toggle()", async () => {
    await sound.setEnabled(false);
    expect(sound.enabled).toBe(false);

    await sound.toggle();
    expect(sound.enabled).toBe(true);
    expect(sound.isPlaying).toBe(true);

    await sound.toggle();
    expect(sound.enabled).toBe(false);
    expect(sound.isPlaying).toBe(false);
  });

  it("notifies subscribers when enabled state changes", async () => {
    const subscriber = vi.fn();
    const unsub = sound.subscribe(subscriber);

    await sound.setEnabled(true);
    expect(subscriber).toHaveBeenCalledWith(true);

    await sound.setEnabled(false);
    expect(subscriber).toHaveBeenCalledWith(false);

    unsub();
  });

  it("preserves default 'on' preference if autoStart encounters browser autoplay restriction", async () => {
    localStorage.clear();
    expect(sound.getStoredPreference()).toBe(true);

    // Call autoStart when AudioContext is blocked or headless
    await sound.autoStart();

    // The preference must still remain true (Sound ON)
    expect(sound.getStoredPreference()).toBe(true);
    expect(localStorage.getItem("akm-sound")).not.toBe("off");
  });

  it("reliably detects mobile phones and completely disables audio", async () => {
    const originalUA = navigator.userAgent;
    try {
      // Simulate iPhone
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        configurable: true,
      });

      expect(sound.isMobile).toBe(true);
      expect(sound.enabled).toBe(false);
      expect(sound.isPlaying).toBe(false);

      // Verify methods do nothing on mobile
      await sound.autoStart();
      await sound.toggle();
      expect(sound.isPlaying).toBe(false);
      expect(() => sound.play("click")).not.toThrow();

      // Simulate Android Mobile
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        configurable: true,
      });
      expect(sound.isMobile).toBe(true);
      expect(sound.enabled).toBe(false);

      // Simulate Desktop/Laptop (MacBook)
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        configurable: true,
      });
      expect(sound.isMobile).toBe(false);
    } finally {
      Object.defineProperty(navigator, "userAgent", {
        value: originalUA,
        configurable: true,
      });
    }
  });
});

describe("Scroll functionality", () => {
  it("dispatches portfolio:navigation event on scrollToSection", () => {
    const handler = vi.fn();
    window.addEventListener("portfolio:navigation", handler);

    scrollToSection("home");
    expect(handler).toHaveBeenCalled();

    window.removeEventListener("portfolio:navigation", handler);
  });

  it("navigates to the exact beginning of About without leaving unwanted Hero visible", () => {
    const mockScrollTo = vi.fn();
    window.scrollTo = mockScrollTo;

    // Create a mock about element at y = 900
    const aboutEl = document.createElement("section");
    aboutEl.id = "about";
    aboutEl.getBoundingClientRect = () => ({
      top: 900,
      left: 0,
      bottom: 1800,
      right: 1200,
      width: 1200,
      height: 900,
      x: 0,
      y: 900,
      toJSON: () => {},
    });
    document.body.appendChild(aboutEl);

    scrollToSection("about");

    // Must scroll directly to top = 900 (exact section beginning, no offset leaving Hero visible)
    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 900,
      })
    );

    document.body.removeChild(aboutEl);
  });
});

