import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { Nav } from "@/components/site/Nav";

// Mock AnimatePresence so exit transitions unmount synchronously in JSDOM
vi.mock("framer-motion", async () => {
  const actual: any = await vi.importActual("framer-motion");
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock TanStack Router's Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, href, onClick, ...props }: any) => (
    <a href={to || href || "#"} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

// Mock sound hook
const mockToggle = vi.fn();
const mockPlay = vi.fn();
vi.mock("@/hooks/use-sound", () => ({
  useSound: () => ({
    isMobile: false,
    enabled: true,
    toggle: mockToggle,
    play: mockPlay,
  }),
}));

describe("Permanent Opaque Top Navigation", () => {
  let aboutElement: HTMLElement;

  beforeEach(() => {
    window.scrollY = 0;

    aboutElement = document.createElement("section");
    aboutElement.id = "about";
    Object.defineProperty(aboutElement, "offsetTop", {
      value: 713,
      writable: true,
      configurable: true,
    });
    aboutElement.getBoundingClientRect = () => {
      const top = 713 - window.scrollY;
      return {
        top,
        bottom: top + 915,
        height: 915,
        left: 0,
        right: 1280,
        width: 1280,
        x: 0,
        y: top,
        toJSON: () => {},
      };
    };
    document.body.appendChild(aboutElement);
  });

  afterEach(() => {
    if (aboutElement && aboutElement.parentNode) {
      aboutElement.parentNode.removeChild(aboutElement);
    }
  });

  it("Requirement 1: Navbar is permanently visible at top with solid opaque styling", () => {
    render(<Nav />);

    const header = screen.getByRole("banner");
    expect(header).toBeDefined();
    // Confirms fixed positioning, opaque dark navy/purple glassmorphism background and compact height
    expect(header.className).toContain("fixed");
    expect(header.className).toContain("top-0");
    expect(header.className).toContain("z-[100]");
    expect(header.className).toContain("bg-[#080514]/95");
    expect(header.className).toContain("backdrop-blur-2xl");
    expect(header.className).toContain("border-b");

    // Confirms all primary navigation links are present
    expect(screen.getByRole("button", { name: "Back to top" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Home" })).toBeDefined();
    expect(screen.getByRole("button", { name: "About" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Projects" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Journey" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Contact" })).toBeDefined();
    expect(screen.getByLabelText("Primary")).toBeDefined();
  });

  it("Requirement 2: Navbar remains permanently visible across all scroll positions", () => {
    render(<Nav />);

    // 1. In Hero (y = 200)
    act(() => {
      window.scrollY = 200;
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByLabelText("Primary")).toBeDefined();

    // 2. In About (y = 713)
    act(() => {
      window.scrollY = 713;
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByLabelText("Primary")).toBeDefined();

    // 3. Middle of About (y = 1000)
    act(() => {
      window.scrollY = 1000;
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByLabelText("Primary")).toBeDefined();

    // 4. Return to Hero (y = 0)
    act(() => {
      window.scrollY = 0;
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByLabelText("Primary")).toBeDefined();
  });

  it("Requirement 3: No three-dot compact button exists in the DOM", () => {
    render(<Nav />);

    expect(screen.queryByRole("button", { name: "Open navigation menu" })).toBeNull();

    // Even when scrolling
    act(() => {
      window.scrollY = 500;
      fireEvent.scroll(window);
    });

    expect(screen.queryByRole("button", { name: "Open navigation menu" })).toBeNull();
  });

  it("Requirement 4: Clicking navigation links navigates normally", () => {
    render(<Nav />);

    const aboutBtn = screen.getByRole("button", { name: "About" });
    act(() => {
      fireEvent.click(aboutBtn);
    });

    // Active state updates to about
    expect(aboutBtn.className).toContain("font-semibold");
  });

  it("Requirement 5: Mobile menu drawer opens and closes properly", () => {
    render(
      <div>
        <Nav />
        <div data-testid="outside-area">Outside</div>
      </div>
    );

    const toggleBtn = screen.getByRole("button", { name: "Open menu" });
    expect(toggleBtn).toBeDefined();

    // Open mobile menu
    act(() => {
      fireEvent.click(toggleBtn);
    });

    // Mobile drawer is visible
    expect(screen.getByLabelText("Mobile")).toBeDefined();

    // Click outside closes mobile drawer
    const outside = screen.getByTestId("outside-area");
    act(() => {
      fireEvent.pointerDown(outside);
    });

    expect(screen.queryByLabelText("Mobile")).toBeNull();
  });
});
