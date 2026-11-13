import { useEffect, useState, useCallback } from "react";
import { sound, isMobileDevice } from "@/lib/sound";

/** Sound state hook. Audio is completely disabled on mobile phones. */
export function useSound() {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const [enabled, setEnabled] = useState(() => (!isMobileDevice() && (sound.enabled ?? false)));
  const [isPlaying, setIsPlaying] = useState(() => (!isMobileDevice() && (sound.isPlaying ?? false)));

  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    if (mobile) {
      setEnabled(false);
      setIsPlaying(false);
      return;
    }

    const unsub = typeof sound.subscribe === "function"
      ? sound.subscribe((_active) => {
          setEnabled(sound.enabled ?? false);
          setIsPlaying(sound.isPlaying ?? false);
        })
      : () => {};
    setEnabled(sound.enabled ?? false);
    setIsPlaying(sound.isPlaying ?? false);
    return unsub;
  }, []);

  const toggle = useCallback(() => {
    if (isMobileDevice()) return;
    void sound.toggle?.();
  }, []);

  const play = useCallback((kind?: "hover" | "click" | "success") => {
    if (isMobileDevice()) return;
    sound.play?.(kind);
  }, []);

  return {
    isMobile,
    enabled,
    isPlaying,
    toggle,
    play,
  };
}
