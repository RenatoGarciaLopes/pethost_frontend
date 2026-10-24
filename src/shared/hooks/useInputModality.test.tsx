import { fireEvent, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { INPUT_MODALITY_ATTRIBUTE } from "@/shared/theme/focus";
import { useInputModality } from "./useInputModality";

it("081 remove os listeners e a marca de modalidade ao desmontar", () => {
  const root = document.documentElement;
  const { unmount } = renderHook(() => useInputModality());
  expect(root).toHaveAttribute(INPUT_MODALITY_ATTRIBUTE, "pointer");
  fireEvent.keyDown(document, { key: "Tab" });
  expect(root).toHaveAttribute(INPUT_MODALITY_ATTRIBUTE, "keyboard");
  unmount();
  fireEvent.pointerDown(document);
  fireEvent.mouseDown(document);
  fireEvent.touchStart(document);
  fireEvent.keyDown(document, { key: "Tab" });
  expect(root).not.toHaveAttribute(INPUT_MODALITY_ATTRIBUTE);
});
