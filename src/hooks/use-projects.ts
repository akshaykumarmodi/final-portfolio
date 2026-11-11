import { useState, useEffect, useCallback } from "react";
import { PROJECTS, type Project } from "@/content/projects";
import {
  fetchProjectsFn,
  saveProjectFn,
  deleteProjectFn,
  reorderProjectsFn,
} from "@/lib/server-api";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
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
      const data = await fetchProjectsFn();
      if (data && Array.isArray(data) && data.length > 0) {
        setProjects(data);
      } else {
        setProjects(PROJECTS);
      }
    } catch (err) {
      console.warn("[Projects] Server load notice, keeping active baseline:", err);
      // Retain current projects
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
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
    const created = await saveProjectFn({ data: { token, project: projectData } });
    await loadProjects();
    return created;
  };

  // Update project (Admin operation)
  const updateProject = async (id: string, updates: Partial<Project>) => {
    const token = getAdminToken();
    const updated = await saveProjectFn({
      data: { token, project: { ...updates, id } },
    });
    await loadProjects();
    return updated;
  };

  // Delete project (Admin operation)
  const deleteProject = async (id: string) => {
    const token = getAdminToken();
    const res = await deleteProjectFn({ data: { token, id } });
    await loadProjects();
    return res;
  };

  // Reorder projects (Admin operation)
  const reorderProjects = async (reordered: Project[]) => {
    const token = getAdminToken();
    setProjects(reordered);
    const updated = await reorderProjectsFn({ data: { token, projects: reordered } });
    setProjects(updated);
    return updated;
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
    refreshProjects: loadProjects,
  };
}
