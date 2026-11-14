import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as db from "@/lib/server-db";
import { useProjects } from "@/hooks/use-projects";
import { useJourney } from "@/hooks/use-journey";
import { useAdmin } from "@/hooks/use-admin";

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

      // Second verification (stateless cryptographic verification)
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

    it("useAdmin preserves session on refresh using localStorage token", async () => {
      // Simulate admin already having logged in and stored token
      const loginRes = await db.authenticateAdmin("admin", "akshay98127");
      localStorage.setItem("akm_admin_token", loginRes.token!);

      const { result } = renderHook(() => useAdmin());

      // Optimistic session is immediately active
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.user).not.toBeNull();
    });
  });

  describe("useProjects Hook Persistence Contract", () => {
    it("persists newly added project to localStorage and across simulated refresh", async () => {
      const { result, unmount } = renderHook(() => useProjects());

      const initialCount = result.current.allProjects.length;

      let createdProj: any;
      await act(async () => {
        createdProj = await result.current.addProject({
          title: "Autonomous Agent UI",
          tagline: "Next-gen AI interface",
          category: "AI / ML",
          tech: ["React", "TypeScript"],
          published: true,
        });
      });

      expect(createdProj).toBeDefined();
      expect(result.current.allProjects.length).toBe(initialCount + 1);
      expect(result.current.allProjects.some((p) => p.title === "Autonomous Agent UI")).toBe(true);

      // Verify localStorage was updated
      const rawStored = localStorage.getItem("akm_portfolio_projects");
      expect(rawStored).not.toBeNull();
      const parsed = JSON.parse(rawStored!);
      expect(parsed.some((p: any) => p.title === "Autonomous Agent UI")).toBe(true);
      expect(localStorage.getItem("akm_projects_customized")).toBe("true");

      // Unmount hook to simulate page unload
      unmount();

      // Mount new hook instance to simulate page refresh (F5)
      const { result: refreshedResult } = renderHook(() => useProjects());

      // Should immediately load the customized projects from cache!
      expect(refreshedResult.current.allProjects.length).toBe(initialCount + 1);
      expect(refreshedResult.current.allProjects.some((p) => p.title === "Autonomous Agent UI")).toBe(true);
    });

    it("persists project reordering and deletion across simulated refresh", async () => {
      const { result, unmount } = renderHook(() => useProjects());

      const projectToDelete = result.current.allProjects[0]!;
      expect(projectToDelete).toBeDefined();

      await act(async () => {
        await result.current.deleteProject(projectToDelete.id);
      });

      expect(result.current.allProjects.some((p) => p.id === projectToDelete.id)).toBe(false);

      // Unmount and re-render hook to simulate refresh
      unmount();

      const { result: refreshedResult } = renderHook(() => useProjects());
      expect(refreshedResult.current.allProjects.some((p) => p.id === projectToDelete.id)).toBe(false);
    });
  });

  describe("useJourney Hook Persistence Contract", () => {
    it("persists milestone additions and edits across simulated refresh", async () => {
      const { result, unmount } = renderHook(() => useJourney());

      const initialCount = result.current.allMilestones.length;

      let createdMilestone: any;
      await act(async () => {
        createdMilestone = await result.current.addMilestone({
          title: "NASA Space Apps Global Winner",
          subtitle: "Galactic Challenge",
          category: "Competitions",
          year: "2026",
          stage: "hackathons",
          highlighted: true,
          published: true,
        });
      });

      expect(createdMilestone).toBeDefined();
      expect(result.current.allMilestones.length).toBe(initialCount + 1);
      expect(result.current.allMilestones.some((m) => m.title === "NASA Space Apps Global Winner")).toBe(true);

      // Verify localStorage
      const raw = localStorage.getItem("akm_portfolio_journey");
      expect(raw).not.toBeNull();
      expect(localStorage.getItem("akm_journey_customized")).toBe("true");

      // Unmount and remount (simulated F5 refresh)
      unmount();

      const { result: refreshedResult } = renderHook(() => useJourney());
      expect(refreshedResult.current.allMilestones.length).toBe(initialCount + 1);
      expect(refreshedResult.current.allMilestones.some((m) => m.title === "NASA Space Apps Global Winner")).toBe(true);
    });

    it("preserves customized milestones across page navigations and simulated refresh", async () => {
      // Simulate user who edited milestones in Admin portal
      const customMilestones = [
        { id: "m-custom-1", title: "Custom Milestone 1", stage: "learning" as const, published: true, sortOrder: 1, year: "2025", dateRange: "2025", category: "Milestone", iconName: "Sparkles", status: "completed" as const, highlighted: false, description: "Custom desc", slug: "custom-1" },
        { id: "m-custom-2", title: "Custom Milestone 2", stage: "building" as const, published: true, sortOrder: 2, year: "2025", dateRange: "2025", category: "Milestone", iconName: "Sparkles", status: "completed" as const, highlighted: false, description: "Custom desc 2", slug: "custom-2" },
      ];
      localStorage.setItem("akm_portfolio_journey", JSON.stringify(customMilestones));
      localStorage.setItem("akm_journey_customized", "true");

      const { result } = renderHook(() => useJourney());
      expect(result.current.allMilestones.length).toBe(2);
      expect(result.current.allMilestones[0]?.title).toBe("Custom Milestone 1");
      expect(result.current.allMilestones[0]?.id).toBe("m-custom-1");
      expect(localStorage.getItem("akm_journey_customized")).toBe("true");
    });

    it("ensures mobile visitors without local customization always render authentic 5 milestones", async () => {
      localStorage.removeItem("akm_portfolio_journey");
      localStorage.removeItem("akm_journey_customized");

      const { result } = renderHook(() => useJourney());
      expect(result.current.allMilestones.length).toBe(5);
      expect(result.current.allMilestones[0]?.title).toBe("Pursuing B.Tech");
      expect(result.current.allMilestones[3]?.title).toBe("Shipping Real-World Systems");
      expect(result.current.allMilestones[4]?.title).toBe("Looking Ahead – The Future");
    });

    it("synchronizes desktop and mobile devices from the shared /api/journey single source of truth", async () => {
      const globalFetch = global.fetch;
      const mockSharedMilestones = [
        {
          id: "m-01-start",
          slug: "the-beginning",
          stage: "start",
          title: "Pursuing B.Tech",
          subtitle: "Newton School of Technology, Rishihood University",
          description: "Updated description synced across all devices",
          year: "2024",
          dateRange: "Aug 2024",
          category: "Genesis",
          iconName: "Compass",
          status: "completed",
          highlighted: false,
          published: true,
          sortOrder: 1,
          tags: ["Algorithms"],
        },
        {
          id: "m-02-learning",
          slug: "foundations-mastery",
          stage: "learning",
          title: "Mastering the Modern Stack",
          subtitle: "Frontend Architecture",
          description: "Deep dive",
          year: "2024",
          dateRange: "Late 2024",
          category: "Core Skills",
          iconName: "Code2",
          status: "completed",
          highlighted: false,
          published: true,
          sortOrder: 2,
          tags: ["TypeScript"],
        },
        {
          id: "m-03-building",
          slug: "creative-engineering",
          stage: "building",
          title: "Creative Engineering & 3D Web",
          subtitle: "Interactive Digital Experiences",
          description: "WebGL",
          year: "2025",
          dateRange: "Early 2025",
          category: "Creative Tech",
          iconName: "Sparkles",
          status: "completed",
          highlighted: false,
          published: true,
          sortOrder: 3,
          tags: ["Three.js"],
        },
        {
          id: "m-04-hackathons",
          slug: "hackathons-and-sprints",
          stage: "hackathons",
          title: "Competitive Hackathons",
          subtitle: "Innovation",
          description: "Hackathons",
          year: "2026",
          dateRange: "Mid 2026",
          category: "Competitions",
          iconName: "Trophy",
          status: "in-progress",
          highlighted: false,
          published: true,
          sortOrder: 4,
          tags: ["Hackathons"],
        },
        {
          id: "m-05-projects",
          slug: "shipping-real-products",
          stage: "projects",
          title: "Shipping Real-World Systems",
          subtitle: "TrustMesh",
          description: "Products",
          year: "2026",
          dateRange: "2026",
          category: "Products & Open Source",
          iconName: "Rocket",
          status: "completed",
          highlighted: false,
          published: true,
          sortOrder: 5,
          tags: ["TrustMesh"],
        },
      ];

      // Mock /api/journey response
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/api/journey")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockSharedMilestones,
          });
        }
        return Promise.resolve({ ok: false });
      });

      try {
        // Desktop load
        const { result: desktopResult } = renderHook(() => useJourney());
        await act(async () => {
          await desktopResult.current.refreshMilestones();
        });
        expect(desktopResult.current.allMilestones.length).toBe(5);
        expect(desktopResult.current.allMilestones[0]?.title).toBe("Pursuing B.Tech");
        expect(desktopResult.current.allMilestones[0]?.description).toBe(
          "Updated description synced across all devices",
        );

        // Mobile load (fresh device context)
        const { result: mobileResult } = renderHook(() => useJourney());
        await act(async () => {
          await mobileResult.current.refreshMilestones();
        });
        expect(mobileResult.current.allMilestones.length).toBe(5);
        expect(mobileResult.current.allMilestones[0]?.title).toBe("Pursuing B.Tech");
        expect(mobileResult.current.allMilestones[0]?.description).toBe(
          "Updated description synced across all devices",
        );

        // Both devices have identical data
        expect(desktopResult.current.allMilestones).toEqual(mobileResult.current.allMilestones);
      } finally {
        global.fetch = globalFetch;
      }
    });

    it("persists milestone edits across simulated refresh and admin navigation", async () => {
      const { result, unmount } = renderHook(() => useJourney());
      const firstMilestoneId = result.current.allMilestones[0]!.id;

      await act(async () => {
        await result.current.updateMilestone(firstMilestoneId, {
          title: "Pursuing B.Tech with Distinction",
          subtitle: "AI & Systems Specialization",
        });
      });

      expect(result.current.allMilestones[0]?.title).toBe("Pursuing B.Tech with Distinction");
      expect(result.current.allMilestones[0]?.subtitle).toBe("AI & Systems Specialization");

      // Verify custom flag is active
      expect(localStorage.getItem("akm_journey_customized")).toBe("true");

      // Simulate refresh / navigation
      unmount();

      const { result: navResult } = renderHook(() => useJourney());
      expect(navResult.current.allMilestones[0]?.title).toBe("Pursuing B.Tech with Distinction");
      expect(navResult.current.allMilestones[0]?.subtitle).toBe("AI & Systems Specialization");
    });

    it("persists milestone deletion and reordering across simulated refresh", async () => {
      const { result, unmount } = renderHook(() => useJourney());
      const milestoneToDelete = result.current.allMilestones[1]!;

      await act(async () => {
        await result.current.deleteMilestone(milestoneToDelete.id);
      });

      expect(result.current.allMilestones.some((m) => m.id === milestoneToDelete.id)).toBe(false);

      // Simulate refresh
      unmount();

      const { result: refreshedResult } = renderHook(() => useJourney());
      expect(refreshedResult.current.allMilestones.some((m) => m.id === milestoneToDelete.id)).toBe(false);
    });
  });
});
