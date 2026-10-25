"use client";

import { useEffect } from "react";
import { INPUT_MODALITY_ATTRIBUTE } from "@/shared/theme/focus";

const NAVIGATION_KEY = /^(Tab|Arrow(?:Up|Down|Left|Right)|Home|End|PageUp|PageDown|Enter|Escape| )$/;
/** In a text field only Tab and Escape leave the typing context; arrows, Home/End, Enter and space edit or submit. */
const NAVIGATION_KEY_IN_TEXT = /^(Tab|Escape)$/;
const NON_TEXT_INPUT = /^(button|checkbox|color|file|image|radio|range|reset|submit)$/;

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT.test(target.type);
  return target instanceof HTMLTextAreaElement || target.isContentEditable;
}

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
      if (event.isComposing || !NAVIGATION_KEY.test(event.key)) return;
      // Inside a text field these keys type or submit; they don't navigate (the ring used to appear on the
      // password field after Enter, when the form returned focus to it).
      if (isTextEntry(event.target) && !NAVIGATION_KEY_IN_TEXT.test(event.key)) return;
      root.setAttribute(INPUT_MODALITY_ATTRIBUTE, "keyboard");
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
