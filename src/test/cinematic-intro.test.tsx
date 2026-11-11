import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Contact } from "@/components/site/Contact";
import { scrollToSection, setLenis } from "@/lib/scroll";

describe("Smooth Scrolling and Section Transitions", () => {
  it("executes scrollToSection for home without throwing", () => {
    expect(() => scrollToSection("home")).not.toThrow();
  });

  it("executes scrollToSection with custom lenis instance", () => {
    const mockLenis = {
      scrollTo: () => {},
      destroy: () => {},
      raf: () => {},
    };
    setLenis(mockLenis as any);
    expect(() => scrollToSection("home")).not.toThrow();
    setLenis(null);
  });
});

describe("Contact Collaboration Buttons", () => {
  it("renders Open for All Collaborations badge and links to GitHub and LinkedIn", () => {
    render(<Contact />);

    expect(screen.getByText("Open for All Collaborations")).toBeInTheDocument();

    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/akshaykumarmodi");

    const linkedinLink = screen.getByRole("link", { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/akshay-kumar-modi-27306637b/"
    );
  });
});
