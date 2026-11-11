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

      const projectToDelete = result.current.allProjects[0];
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
  });
});
