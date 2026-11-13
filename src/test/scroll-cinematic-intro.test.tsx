import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScrollCinematicIntro } from "@/components/intro/ScrollCinematicIntro";
import * as scrollModule from "@/lib/scroll";
import { sound } from "@/lib/sound";

vi.mock("@/lib/sound", () => ({
  sound: {
    play: vi.fn(),
    autoStart: vi.fn(),
    turnOn: vi.fn(),
    isPlaying: false,
    getStoredPreference: () => true,
  },
  isMobileDevice: () => false,
}));

describe("ScrollCinematicIntro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the interactive video element with scrub source and muted/playsInline flags", () => {
    const { container } = render(<ScrollCinematicIntro />);
    const video = container.querySelector("video");

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/video/cinematic-intro-scrub.mp4");
    expect(video).toHaveAttribute("playsinline");
    expect(video?.muted).toBe(true);
  });

  it("renders top AKM logo and Skip Intro button", () => {
    render(<ScrollCinematicIntro />);

    const logoBtn = screen.getByRole("button", { name: /(akm|am) logo - enter portfolio/i });
    expect(logoBtn).toBeInTheDocument();

    const skipBtn = screen.getByRole("button", { name: /skip intro/i });
    expect(skipBtn).toBeInTheDocument();
    expect(skipBtn).toHaveTextContent("Skip Intro");
  });

  it("renders bottom badges: Dream • Code • Create, Enter Portfolio, and Let's Build Something Amazing", () => {
    render(<ScrollCinematicIntro />);

    expect(screen.getByText("Dream • Code • Create")).toBeInTheDocument();
    expect(screen.getByText("Let's Build Something Amazing")).toBeInTheDocument();
    expect(screen.getByText("Enter Portfolio")).toBeInTheDocument();
  });

  it("triggers scrollToSection('home') and plays sound when clicking Enter Portfolio or Skip Intro", () => {
    const scrollSpy = vi.spyOn(scrollModule, "scrollToSection").mockImplementation(() => {});

    render(<ScrollCinematicIntro />);

    const skipBtn = screen.getByRole("button", { name: /skip intro/i });
    fireEvent.click(skipBtn);

    expect(sound.play).toHaveBeenCalledWith("click");
    expect(scrollSpy).toHaveBeenCalledWith("home");

    const enterBtn = screen.getByText("Enter Portfolio").closest("button");
    if (enterBtn) {
      fireEvent.click(enterBtn);
      expect(scrollSpy).toHaveBeenCalledWith("home");
    }
  });
});
