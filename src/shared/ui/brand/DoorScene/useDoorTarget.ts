"use client";
import { useEffect, useState } from "react";

/**
 * Marque o formulário irmão com este atributo (`{...{ [DOOR_TARGET_ATTR]: "" }}`):
 * mouse ou foco dentro dele abre a porta.
 */
export const DOOR_TARGET_ATTR = "data-door-target";
/** Marque o botão principal ("Entrar"): mouse ou foco nele abre mais a porta e esquenta a luz. */
export const DOOR_WARM_ATTR = "data-door-warm";

interface Presence {
  form: boolean;
  warm: boolean;
}

const NOWHERE: Presence = { form: false, warm: false };

function presenceOf(node: EventTarget | null): Presence {
  if (!(node instanceof Element)) return NOWHERE;
  return { form: node.closest(`[${DOOR_TARGET_ATTR}]`) !== null, warm: node.closest(`[${DOOR_WARM_ATTR}]`) !== null };
}

const samePresence = (a: Presence, b: Presence) => a.form === b.form && a.warm === b.warm;

/**
 * Onde estão o mouse e o foco em relação ao formulário marcado. A cena e o formulário
 * se falam só pelos atributos: nenhum dos dois importa o outro.
 *
 * @returns `engaged` (mouse ou foco no formulário) e `warm` (mouse ou foco no botão principal).
 */
export function useDoorTarget(enabled: boolean): { engaged: boolean; warm: boolean } {
  const [hover, setHover] = useState(NOWHERE);
  const [focus, setFocus] = useState(NOWHERE);

  useEffect(() => {
    if (!enabled) return;
    const keep = (next: Presence) => (current: Presence) => (samePresence(current, next) ? current : next);
    const onPointerOver = (event: PointerEvent) => setHover(keep(presenceOf(event.target)));
    // Saiu da janela: `relatedTarget` vazio.
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) setHover(keep(NOWHERE));
    };
    const onFocusIn = (event: FocusEvent) => setFocus(keep(presenceOf(event.target)));
    const onFocusOut = (event: FocusEvent) => setFocus(keep(presenceOf(event.relatedTarget)));

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [enabled]);

  return { engaged: hover.form || focus.form, warm: hover.warm || focus.warm };
}
