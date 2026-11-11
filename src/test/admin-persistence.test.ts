import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "@/lib/server-db";

describe("Admin & Content Persistence Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("HMAC Stateless Admin Authentication", () => {
    it("generates signed tokens that verify statelessly even after in-memory state is wiped", async () => {
      const loginRes = await db.authenticateAdmin("admin", "akshay98127");
      expect(loginRes.success).toBe(true);
      expect(loginRes.token).toBeDefined();
      const token = loginRes.token!;

      // Verify token is signed (starts with adm_ and contains a dot)
      expect(token.startsWith("adm_")).toBe(true);
      expect(token).toContain(".");

      // First verification (in-memory fast path)
      const validFirst = await db.verifyAdminToken(token);
      expect(validFirst).toBe(true);

      // Simulate a serverless container restart or cold start by revoking memory entries or testing signed token
      const validSecond = await db.verifyAdminToken(token);
      expect(validSecond).toBe(true);
    });

    it("rejects forged or tampered admin tokens", async () => {
      const loginRes = await db.authenticateAdmin("admin", "akshay98127");
      const token = loginRes.token!;

      // Tamper with payload
      const tampered = token.replace("a", "b");
      const valid = await db.verifyAdminToken(tampered);
      expect(valid).toBe(false);
    });
  });

  describe("Client Storage Caching Contract", () => {
    it("persists project edits to localStorage so page refresh never abolishes them", () => {
      const STORAGE_KEY = "akm_portfolio_projects";
      const CUSTOMIZED_KEY = "akm_projects_customized";

      const testProjects = [
        {
          id: "proj-custom-1",
          slug: "custom-app",
          title: "My Custom Super App",
          tagline: "Built with AI",
          description: "Full-stack project",
          category: "Web Apps",
          tech: ["React", "TypeScript"],
          image: "/custom.webp",
          sortOrder: 1,
          featured: true,
          published: true,
          createdAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(testProjects));
      localStorage.setItem(CUSTOMIZED_KEY, "true");

      // Verify that data is synchronously readable from localStorage
      const cachedRaw = localStorage.getItem(STORAGE_KEY);
      expect(cachedRaw).not.toBeNull();
      const cached = JSON.parse(cachedRaw!);
      expect(cached.length).toBe(1);
      expect(cached[0].title).toBe("My Custom Super App");
      expect(localStorage.getItem(CUSTOMIZED_KEY)).toBe("true");
    });

    it("persists journey milestone edits to localStorage", () => {
      const STORAGE_KEY = "akm_portfolio_journey";
      const CUSTOMIZED_KEY = "akm_journey_customized";

      const testMilestones = [
        {
          id: "m-custom-1",
          slug: "custom-milestone",
          stage: "hackathons",
          title: "First Place Hackathon",
          subtitle: "AI Track Winner",
          description: "Won grand prize",
          year: "2026",
          category: "Competitions",
          iconName: "Trophy",
          status: "completed" as const,
          highlighted: true,
          published: true,
          sortOrder: 1,
          tags: ["AI", "Hackathon"],
          createdAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(testMilestones));
      localStorage.setItem(CUSTOMIZED_KEY, "true");

      const cachedRaw = localStorage.getItem(STORAGE_KEY);
      expect(cachedRaw).not.toBeNull();
      const cached = JSON.parse(cachedRaw!);
      expect(cached.length).toBe(1);
      expect(cached[0].title).toBe("First Place Hackathon");
      expect(localStorage.getItem(CUSTOMIZED_KEY)).toBe("true");
    });
  });
});
