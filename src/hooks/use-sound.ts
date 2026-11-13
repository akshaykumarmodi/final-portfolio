import { useEffect, useState, useCallback } from "react";
import { sound } from "@/lib/sound";

/** Sound toggle state. Never starts audio without a user gesture. */
export function useSound() {
  const [enabled, setEnabled] = useState(() => sound.enabled ?? true);
  const [isPlaying, setIsPlaying] = useState(() => sound.isPlaying ?? false);

  useEffect(() => {
    const unsub = typeof sound.subscribe === "function"
      ? sound.subscribe((_active) => {
          setEnabled(sound.enabled ?? true);
          setIsPlaying(sound.isPlaying ?? false);
        })
      : () => {};
    setEnabled(sound.enabled ?? true);
    setIsPlaying(sound.isPlaying ?? false);
    if (typeof sound.getStoredPreference === "function" && sound.getStoredPreference() && !sound.isPlaying) {
      void sound.autoStart?.();
    }
    return unsub;
  }, []);

  const toggle = useCallback(() => void sound.toggle?.(), []);
  const play = useCallback((kind?: "hover" | "click" | "success") => sound.play?.(kind), []);

  return {
    enabled,
    isPlaying,
    toggle,
    play,
  };
}
