import { useState, useEffect, useCallback } from "react";
import { PROJECTS, type Project } from "@/content/projects";
import {
  fetchProjectsFn,
  saveProjectFn,
  deleteProjectFn,
  reorderProjectsFn,
} from "@/lib/server-api";

const STORAGE_KEY = "akm_portfolio_projects";
const CUSTOMIZED_KEY = "akm_projects_customized";

function getCachedProjects(): Project[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn("[Projects] Error parsing cached projects:", e);
  }
  return null;
}

function saveCachedProjects(projectsList: Project[], isCustomized = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsList));
    if (isCustomized) {
      localStorage.setItem(CUSTOMIZED_KEY, "true");
    }
    window.dispatchEvent(new CustomEvent("akm:projects-updated", { detail: projectsList }));
  } catch (e) {
    console.warn("[Projects] Error writing projects to cache:", e);
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const cached = getCachedProjects();
    return cached && cached.length > 0 ? cached : PROJECTS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getAdminToken = () => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("akm_admin_token") || undefined;
  };

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isCustomizedLocally =
        typeof window !== "undefined" &&
        localStorage.getItem(CUSTOMIZED_KEY) === "true";

      const serverData = await fetchProjectsFn();

      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        if (isCustomizedLocally) {
          const cached = getCachedProjects();
          if (cached && cached.length > 0) {
            // Retain user's custom projects across page refreshes
            setProjects(cached);

            // Re-sync server container if admin token is present and server lacks our updates
            const token = getAdminToken();
            if (token && JSON.stringify(cached) !== JSON.stringify(serverData)) {
              reorderProjectsFn({ data: { token, projects: cached } }).catch(() => {});
            }
            return;
          }
        }
        setProjects(serverData);
        saveCachedProjects(serverData, false);
      } else {
        const cached = getCachedProjects();
        if (cached && cached.length > 0) {
          setProjects(cached);
        } else {
          setProjects(PROJECTS);
          saveCachedProjects(PROJECTS, false);
        }
      }
    } catch (err) {
      console.warn("[Projects] Server load notice, keeping active cached data:", err);
      const cached = getCachedProjects();
      if (cached && cached.length > 0) {
        setProjects(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage events and cross-tab/cross-component updates
  useEffect(() => {
    loadProjects();

    if (typeof window === "undefined") return;

    const handleProjectsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Project[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setProjects(customEvent.detail);
      } else {
        const cached = getCachedProjects();
        if (cached) setProjects(cached);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener("akm:projects-updated", handleProjectsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("akm:projects-updated", handleProjectsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadProjects]);

  // Public projects (only published)
  const publishedProjects = projects.filter((p) => p.published);

  // Extract all unique categories present across existing projects
  const availableCategories = Array.from(
    new Set([
      "All",
      "Web Apps",
      "AI / ML",
      "Tools",
      "Open Source",
      "Creative",
      "Others",
      ...projects.map((p) => p.category).filter(Boolean),
    ]),
  );

  // Add project (Admin operation)
  const addProject = async (projectData: Partial<Project>) => {
    const token = getAdminToken();
    let created: Project;

    try {
      created = await saveProjectFn({ data: { token, project: projectData } });
    } catch (err) {
      console.warn("[Projects] Server add failed, applying local fallback:", err);
      const maxSort = projects.reduce((m, p) => Math.max(m, p.sortOrder), 0);
      const id = projectData.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      created = {
        id,
        slug:
          projectData.slug ||
          (projectData.title ? projectData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `project-${Date.now()}`),
        title: projectData.title || "Untitled Project",
        tagline: projectData.tagline || "",
        description: projectData.description || "",
        fullDescription: projectData.fullDescription || projectData.description || "",
        category: projectData.category || "Creative",
        tech: projectData.tech || [],
        image: projectData.image || "/placeholder.svg",
        screenshots: projectData.screenshots || [],
        githubUrl: projectData.githubUrl,
        liveUrl: projectData.liveUrl,
        projectUrl: projectData.projectUrl,
        featured: projectData.featured ?? false,
        published: projectData.published ?? true,
        sortOrder: projectData.sortOrder ?? maxSort + 1,
        createdAt: new Date().toISOString(),
      };
    }

    setProjects((prev) => {
      const next = [...prev.filter((p) => p.id !== created.id), created].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      saveCachedProjects(next, true);
      return next;
    });

    return created;
  };

  // Update project (Admin operation)
  const updateProject = async (id: string, updates: Partial<Project>) => {
    const token = getAdminToken();
    let updated: Project;

    try {
      updated = await saveProjectFn({
        data: { token, project: { ...updates, id } },
      });
    } catch (err) {
      console.warn("[Projects] Server update failed, applying local fallback:", err);
      const current = projects.find((p) => p.id === id);
      if (!current) throw new Error("Project not found");
      updated = { ...current, ...updates };
    }

    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updated } : p)).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      saveCachedProjects(next, true);
      return next;
    });

    return updated;
  };

  // Delete project (Admin operation)
  const deleteProject = async (id: string) => {
    const token = getAdminToken();
    try {
      await deleteProjectFn({ data: { token, id } });
    } catch (err) {
      console.warn("[Projects] Server delete failed, applying local fallback:", err);
    }

    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCachedProjects(next, true);
      return next;
    });

    return true;
  };

  // Reorder projects (Admin operation)
  const reorderProjects = async (reordered: Project[]) => {
    const token = getAdminToken();
    const updated = reordered.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
    setProjects(updated);
    saveCachedProjects(updated, true);

    try {
      const res = await reorderProjectsFn({ data: { token, projects: updated } });
      if (res && Array.isArray(res) && res.length > 0) {
        setProjects(res);
        saveCachedProjects(res, true);
        return res;
      }
    } catch (err) {
      console.warn("[Projects] Server reorder notice:", err);
    }

    return updated;
  };

  // Reset to default projects (Admin operation)
  const resetProjectsToDefault = async () => {
    const token = getAdminToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMIZED_KEY);
    }
    setProjects(PROJECTS);
    saveCachedProjects(PROJECTS, false);
    if (token) {
      try {
        await reorderProjectsFn({ data: { token, projects: PROJECTS } });
      } catch {}
    }
  };

  return {
    projects: publishedProjects,
    allProjects: projects,
    isLoading,
    error,
    availableCategories,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    resetProjectsToDefault,
    refreshProjects: loadProjects,
  };
}
