import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { ApplicantComparison } from "./ApplicantComparison";
it("REQ-AQUEUE-005 minimiza CPF e mostra dados de comparação e aceite", async () => {
  const { user } = renderWithProviders(<ApplicantComparison application={adminApplicationFixture()} />, {
    theme: quintalTheme,
  });
  expect(screen.queryByText("529.982.247-25")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Mostrar CPF" }));
  expect(screen.getByText("529.982.247-25")).toBeVisible();
  expect(screen.getByText("Pessoa de teste")).toBeVisible();
  expect(screen.getByText("v1")).toBeVisible();
  expect(screen.getByText("pessoa@example.test")).toBeVisible();
});
