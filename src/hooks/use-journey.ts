import { useState, useEffect, useCallback } from "react";
import { JOURNEY_MILESTONES, type JourneyMilestone } from "@/content/journey";
import {
  fetchJourneyFn,
  saveMilestoneFn,
  deleteMilestoneFn,
  reorderMilestonesFn,
} from "@/lib/server-api";

const STORAGE_KEY = "akm_portfolio_journey";
const CUSTOMIZED_KEY = "akm_journey_customized";

function getCachedJourney(): JourneyMilestone[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // If legacy cache has fewer milestones than authentic bundled baseline and was not customized, purge stale cache
      if (parsed.length < JOURNEY_MILESTONES.length && localStorage.getItem(CUSTOMIZED_KEY) !== "true") {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        return null;
      }
      return parsed;
    }
  } catch (e) {
    console.warn("[Journey] Error parsing cached journey:", e);
  }
  return null;
}

function saveCachedJourney(milestonesList: JourneyMilestone[], isCustomized = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(milestonesList));
    if (isCustomized) {
      localStorage.setItem(CUSTOMIZED_KEY, "true");
    }
    window.dispatchEvent(new CustomEvent("akm:journey-updated", { detail: milestonesList }));
  } catch (e) {
    console.warn("[Journey] Error writing journey to cache:", e);
  }
}

export function useJourney() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>(() => {
    const cached = getCachedJourney();
    return cached && cached.length > 0 ? cached : JOURNEY_MILESTONES;
  });
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

      const isCustomizedLocally =
        typeof window !== "undefined" &&
        localStorage.getItem(CUSTOMIZED_KEY) === "true";

      const serverData = await fetchJourneyFn();

      if (serverData && Array.isArray(serverData) && serverData.length >= JOURNEY_MILESTONES.length) {
        if (isCustomizedLocally) {
          const cached = getCachedJourney();
          if (cached && cached.length > 0) {
            // Retain user's custom milestones across page refreshes
            setMilestones(cached);

            // Re-sync server container if token is available and server lacks updates
            const token = getAdminToken();
            if (token && JSON.stringify(cached) !== JSON.stringify(serverData)) {
              reorderMilestonesFn({ data: { token, milestones: cached } }).catch(() => {});
            }
            return;
          }
        }
        setMilestones(serverData);
        saveCachedJourney(serverData, false);
      } else {
        const cached = getCachedJourney();
        if (cached && cached.length >= JOURNEY_MILESTONES.length) {
          setMilestones(cached);
        } else {
          setMilestones(JOURNEY_MILESTONES);
          saveCachedJourney(JOURNEY_MILESTONES, false);
        }
      }
    } catch (err) {
      console.warn("[Journey] Server load notice, keeping active cached data:", err);
      const cached = getCachedJourney();
      if (cached && cached.length > 0) {
        setMilestones(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage events and cross-tab/cross-component updates
  useEffect(() => {
    loadMilestones();

    if (typeof window === "undefined") return;

    const handleJourneyUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<JourneyMilestone[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setMilestones(customEvent.detail);
      } else {
        const cached = getCachedJourney();
        if (cached) setMilestones(cached);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMilestones(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener("akm:journey-updated", handleJourneyUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("akm:journey-updated", handleJourneyUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadMilestones]);

  // Public milestones (only published ones, ordered by sortOrder)
  const publishedMilestones = milestones
    .filter((m) => m.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Add milestone (Admin operation)
  const addMilestone = async (data: Partial<JourneyMilestone>) => {
    const token = getAdminToken();
    let created: JourneyMilestone;

    try {
      created = await saveMilestoneFn({ data: { token, milestone: data } });
    } catch (err) {
      console.warn("[Journey] Server add failed, applying local fallback:", err);
      const maxSort = milestones.reduce((m, item) => Math.max(m, item.sortOrder), 0);
      const id = data.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      created = {
        id,
        slug:
          data.slug ||
          (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `milestone-${Date.now()}`),
        stage: data.stage || "building",
        title: data.title || "New Milestone",
        subtitle: data.subtitle || "",
        description: data.description || "",
        year: data.year || new Date().getFullYear().toString(),
        dateRange: data.dateRange || data.year || "",
        category: data.category || "Milestone",
        iconName: data.iconName || "Sparkles",
        status: data.status || "completed",
        highlighted: data.highlighted ?? false,
        published: data.published ?? true,
        sortOrder: data.sortOrder ?? maxSort + 1,
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
      };
    }

    setMilestones((prev) => {
      const next = [...prev.filter((m) => m.id !== created.id), created].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      saveCachedJourney(next, true);
      return next;
    });

    return created;
  };

  // Update milestone (Admin operation)
  const updateMilestone = async (id: string, updates: Partial<JourneyMilestone>) => {
    const token = getAdminToken();
    let updated: JourneyMilestone;

    try {
      updated = await saveMilestoneFn({
        data: { token, milestone: { ...updates, id } },
      });
    } catch (err) {
      console.warn("[Journey] Server update failed, applying local fallback:", err);
      const current = milestones.find((m) => m.id === id);
      if (!current) throw new Error("Milestone not found");
      updated = { ...current, ...updates };
    }

    setMilestones((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...updated } : m)).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      saveCachedJourney(next, true);
      return next;
    });

    return updated;
  };

  // Delete milestone (Admin operation)
  const deleteMilestone = async (id: string) => {
    const token = getAdminToken();
    try {
      await deleteMilestoneFn({ data: { token, id } });
    } catch (err) {
      console.warn("[Journey] Server delete failed, applying local fallback:", err);
    }

    setMilestones((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveCachedJourney(next, true);
      return next;
    });

    return true;
  };

  // Reorder milestones (Admin operation)
  const reorderMilestones = async (reordered: JourneyMilestone[]) => {
    const token = getAdminToken();
    const updated = reordered.map((m, idx) => ({ ...m, sortOrder: idx + 1 }));
    setMilestones(updated);
    saveCachedJourney(updated, true);

    try {
      const res = await reorderMilestonesFn({ data: { token, milestones: updated } });
      if (res && Array.isArray(res) && res.length > 0) {
        setMilestones(res);
        saveCachedJourney(res, true);
        return res;
      }
    } catch (err) {
      console.warn("[Journey] Server reorder notice:", err);
    }

    return updated;
  };

  // Reset milestones to default (Admin operation)
  const resetMilestonesToDefault = async () => {
    const token = getAdminToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMIZED_KEY);
    }
    setMilestones(JOURNEY_MILESTONES);
    saveCachedJourney(JOURNEY_MILESTONES, false);
    if (token) {
      try {
        await reorderMilestonesFn({ data: { token, milestones: JOURNEY_MILESTONES } });
      } catch {}
    }
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
    resetMilestonesToDefault,
    refreshMilestones: loadMilestones,
  };
}
