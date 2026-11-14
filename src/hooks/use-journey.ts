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
      // Discard stale legacy cache that starts with old m-02 milestone
      if (parsed[0]?.id === "m-02-learning") {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CUSTOMIZED_KEY);
        return null;
      }
      return parsed;
    }
  } catch (e) {
    console.warn("[Journey] Error parsing cached journey:", e);
  }
  return null;
}

function saveCachedJourney(milestonesList: JourneyMilestone[], isCustomized = true, dispatch = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(milestonesList));
    if (isCustomized) {
      localStorage.setItem(CUSTOMIZED_KEY, "true");
    }
    if (dispatch) {
      window.dispatchEvent(new CustomEvent("akm:journey-updated", { detail: milestonesList }));
    }
  } catch (e) {
    console.warn("[Journey] Error writing journey to cache:", e);
  }
}

export function useJourney() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>(() => {
    if (typeof window !== "undefined") {
      const cached = getCachedJourney();
      if (cached && cached.length > 0) return cached;
    }
    return JOURNEY_MILESTONES;
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

      // If user customized journey in the Admin Portal, preserve their customizations across page refreshes!
      if (isCustomizedLocally) {
        const cached = getCachedJourney();
        if (cached && cached.length > 0) {
          setMilestones(cached);

          // Re-sync server in the background if admin token is present
          const token = getAdminToken();
          if (token) {
            reorderMilestonesFn({ data: { token, milestones: cached } }).catch(() => {});
            if (typeof window !== "undefined") {
              fetch("/api/journey", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ milestones: cached }),
              }).catch(() => {});
            }
          }
          return;
        }
      }

      let serverData: JourneyMilestone[] | null = null;

      // 1. Fetch directly from the shared REST API endpoint (/api/journey) with cache-busting
      try {
        if (typeof window !== "undefined") {
          const res = await fetch(`/api/journey?t=${Date.now()}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json) && json.length > 0) {
              serverData = json;
            }
          }
        }
      } catch (e) {
        console.warn("[Journey] /api/journey fetch notice:", e);
      }

      // 2. Fallback to RPC server function if /api/journey did not return
      if (!serverData) {
        try {
          serverData = await fetchJourneyFn();
        } catch {}
      }

      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        setMilestones(serverData);
        saveCachedJourney(serverData, false, false);
      } else {
        const cached = getCachedJourney();
        if (cached && cached.length > 0) {
          setMilestones(cached);
        } else {
          setMilestones(JOURNEY_MILESTONES);
          saveCachedJourney(JOURNEY_MILESTONES, false, false);
        }
      }
    } catch (err) {
      console.warn("[Journey] Server load notice, keeping active cached data:", err);
      const cached = getCachedJourney();
      if (cached && cached.length > 0) {
        setMilestones(cached);
      } else {
        setMilestones(JOURNEY_MILESTONES);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage events and cross-tab/cross-component updates (identical to useProjects)
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
    const maxSort = milestones.reduce((m, item) => Math.max(m, item.sortOrder), 0);
    const id = data.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const created: JourneyMilestone = {
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

    const next = [...milestones.filter((m) => m.id !== created.id), created].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    setMilestones(next);
    saveCachedJourney(next, true, true);

    // 1. Sync to shared /api/journey REST backend
    try {
      if (typeof window !== "undefined") {
        await fetch("/api/journey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ milestone: created, milestones: next }),
        });
      }
    } catch (e) {
      console.warn("[Journey] /api/journey add notice:", e);
    }

    // 2. Sync to serverFn
    try {
      await saveMilestoneFn({ data: { token, milestone: created } });
    } catch {}

    return created;
  };

  // Update milestone (Admin operation)
  const updateMilestone = async (id: string, updates: Partial<JourneyMilestone>) => {
    const token = getAdminToken();
    const current = milestones.find((m) => m.id === id);
    if (!current) throw new Error("Milestone not found");
    const updated: JourneyMilestone = { ...current, ...updates };

    const next = milestones.map((m) => (m.id === id ? updated : m)).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    setMilestones(next);
    saveCachedJourney(next, true, true);

    // 1. Sync to shared /api/journey REST backend
    try {
      if (typeof window !== "undefined") {
        await fetch("/api/journey", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ milestone: updated, milestones: next }),
        });
      }
    } catch (e) {
      console.warn("[Journey] /api/journey update notice:", e);
    }

    // 2. Sync to serverFn
    try {
      await saveMilestoneFn({
        data: { token, milestone: { ...updates, id } },
      });
    } catch {}

    return updated;
  };

  // Delete milestone (Admin operation)
  const deleteMilestone = async (id: string) => {
    const token = getAdminToken();
    const next = milestones.filter((m) => m.id !== id);

    setMilestones(next);
    saveCachedJourney(next, true, true);

    // 1. Sync to shared /api/journey REST backend
    try {
      if (typeof window !== "undefined") {
        await fetch("/api/journey", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ deleteId: id, milestones: next }),
        });
      }
    } catch (e) {
      console.warn("[Journey] /api/journey delete notice:", e);
    }

    // 2. Sync to serverFn
    try {
      await deleteMilestoneFn({ data: { token, id } });
    } catch {}

    return true;
  };

  // Reorder milestones (Admin operation)
  const reorderMilestones = async (reordered: JourneyMilestone[]) => {
    const token = getAdminToken();
    const updated = reordered.map((m, idx) => ({ ...m, sortOrder: idx + 1 }));

    setMilestones(updated);
    saveCachedJourney(updated, true, true);

    // 1. Sync to shared /api/journey REST backend
    try {
      if (typeof window !== "undefined") {
        await fetch("/api/journey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ milestones: updated }),
        });
      }
    } catch (e) {
      console.warn("[Journey] /api/journey reorder notice:", e);
    }

    // 2. Sync to serverFn
    try {
      const res = await reorderMilestonesFn({ data: { token, milestones: updated } });
      if (res && Array.isArray(res) && res.length > 0) {
        setMilestones(res);
        saveCachedJourney(res, true, false);
        return res;
      }
    } catch {}

    return updated;
  };

  // Reset milestones to default (Admin operation)
  const resetMilestonesToDefault = async () => {
    const token = getAdminToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMIZED_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
    setMilestones(JOURNEY_MILESTONES);
    saveCachedJourney(JOURNEY_MILESTONES, false, true);

    // 1. Sync to shared /api/journey REST backend
    try {
      if (typeof window !== "undefined") {
        await fetch("/api/journey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: "reset", milestones: JOURNEY_MILESTONES }),
        });
      }
    } catch {}

    // 2. Sync to serverFn
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
