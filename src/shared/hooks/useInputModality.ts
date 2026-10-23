"use client";

import { useEffect } from "react";
import { INPUT_MODALITY_ATTRIBUTE } from "@/shared/theme/focus";

/**
 * Install once in the existing root theme boundary. Navigation keys enable keyboard
 * indicators; pointer/touch disable them before focus changes, including restored focus.
 * Ordinary typing and IME composition don't change modality. No React state or rerender.
 * Storybook installs the same hook in its existing theme decorator.
 */
export function useInputModality(): void {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(INPUT_MODALITY_ATTRIBUTE, "pointer");

    function pointer() {
      root.setAttribute(INPUT_MODALITY_ATTRIBUTE, "pointer");
    }
    function keyboard(event: KeyboardEvent) {
      if (
        !event.isComposing &&
        /^(Tab|Arrow(?:Up|Down|Left|Right)|Home|End|PageUp|PageDown|Enter|Escape| )$/.test(event.key)
      ) {
        root.setAttribute(INPUT_MODALITY_ATTRIBUTE, "keyboard");
      }
    }

    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("mousedown", pointer, true);
    document.addEventListener("touchstart", pointer, { capture: true, passive: true });
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("mousedown", pointer, true);
      document.removeEventListener("touchstart", pointer, true);
      root.removeAttribute(INPUT_MODALITY_ATTRIBUTE);
    };
  }, []);
}
