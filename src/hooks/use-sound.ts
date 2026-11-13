import { useEffect, useState, useCallback } from "react";
import { sound } from "@/lib/sound";

/** Sound toggle state. Never starts audio without a user gesture. */
export function useSound() {
  const [enabled, setEnabled] = useState(() => sound.enabled);

  useEffect(() => {
    const unsub = sound.subscribe(setEnabled);
    setEnabled(sound.enabled);
    if (sound.getStoredPreference() && !sound.isPlaying) {
      void sound.autoStart();
    }
    return unsub;
  }, []);

  const toggle = useCallback(() => void sound.toggle(), []);
  const play = useCallback((kind?: "hover" | "click" | "success") => sound.play(kind), []);

  return {
    enabled,
    toggle,
    play,
  };
}
