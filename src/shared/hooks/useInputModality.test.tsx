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

it("Enter, espaço e setas dentro do campo de texto não acendem o contorno; Tab acende", () => {
  const root = document.documentElement;
  const { unmount } = renderHook(() => useInputModality());
  const field = document.body.appendChild(document.createElement("input"));
  field.type = "password";
  for (const key of ["Enter", " ", "ArrowLeft"]) {
    fireEvent.keyDown(field, { key });
    expect(root).toHaveAttribute(INPUT_MODALITY_ATTRIBUTE, "pointer");
  }
  fireEvent.keyDown(field, { key: "Tab" });
  expect(root).toHaveAttribute(INPUT_MODALITY_ATTRIBUTE, "keyboard");
  field.remove();
  unmount();
});
