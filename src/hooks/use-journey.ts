import { useState, useEffect, useCallback } from "react";
import { JOURNEY_MILESTONES, type JourneyMilestone } from "@/content/journey";
import {
  fetchJourneyFn,
  saveMilestoneFn,
  deleteMilestoneFn,
  reorderMilestonesFn,
} from "@/lib/server-api";

export function useJourney() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>(JOURNEY_MILESTONES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getAdminToken = () => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("akm_admin_token") || undefined;
  };

  const loadMilestones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchJourneyFn();
      if (data && Array.isArray(data) && data.length > 0) {
        setMilestones(data);
      } else {
        setMilestones(JOURNEY_MILESTONES);
      }
    } catch (err) {
      console.warn("[Journey] Server load notice, keeping active baseline:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  // Public milestones (only published ones, ordered by sortOrder)
  const publishedMilestones = milestones
    .filter((m) => m.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Add milestone (Admin operation)
  const addMilestone = async (data: Partial<JourneyMilestone>) => {
    const token = getAdminToken();
    const created = await saveMilestoneFn({ data: { token, milestone: data } });
    await loadMilestones();
    return created;
  };

  // Update milestone (Admin operation)
  const updateMilestone = async (id: string, updates: Partial<JourneyMilestone>) => {
    const token = getAdminToken();
    const updated = await saveMilestoneFn({
      data: { token, milestone: { ...updates, id } },
    });
    await loadMilestones();
    return updated;
  };

  // Delete milestone (Admin operation)
  const deleteMilestone = async (id: string) => {
    const token = getAdminToken();
    const res = await deleteMilestoneFn({ data: { token, id } });
    await loadMilestones();
    return res;
  };

  // Reorder milestones (Admin operation)
  const reorderMilestones = async (reordered: JourneyMilestone[]) => {
    const token = getAdminToken();
    setMilestones(reordered);
    const updated = await reorderMilestonesFn({ data: { token, milestones: reordered } });
    setMilestones(updated);
    return updated;
  };

  return {
    milestones: publishedMilestones,
    allMilestones: milestones,
    isLoading,
    error,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderMilestones,
    refreshMilestones: loadMilestones,
  };
}

