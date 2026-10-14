import { screen } from "@testing-library/react";
import { createRef } from "react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { StepHeading } from "./StepHeading";

it("REQ-PWD-003 REQ-PNEW-001 título h1 que aceita foco por código, fora da ordem do Tab", () => {
  const ref = createRef<HTMLHeadingElement>();
  renderWithProviders(<StepHeading ref={ref}>Que bicho é o seu?</StepHeading>);
  const heading = screen.getByRole("heading", { level: 1, name: "Que bicho é o seu?" });
  expect(heading).toHaveAttribute("tabindex", "-1");
  ref.current?.focus();
  expect(heading).toHaveFocus();
});
