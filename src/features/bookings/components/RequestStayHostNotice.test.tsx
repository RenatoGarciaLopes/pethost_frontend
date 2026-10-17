import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { RequestStayHostNotice } from "./RequestStayHostNotice";

it("REQ-REQST-001 anfitrião vê que pedir é com a conta de tutor e o caminho da troca de conta", () => {
  renderWithProviders(<RequestStayHostNotice />, { theme: quintalTheme });
  expect(screen.getByRole("heading", { level: 1, name: "Pedir estadia" })).toBeInTheDocument();
  expect(screen.getByText("Pra pedir uma estadia, entra com a conta de tutor.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Trocar de conta" })).toHaveAttribute("href", "/users/switch");
});
