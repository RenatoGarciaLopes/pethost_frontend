import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { adminHostFixture } from "@/test/fixtures/adminAccounts";
import { AccountSummary } from "./AccountSummary";
it("REQ-AACC-004 CPF e CNPJ completos só aparecem sob ação, com suspensão e empresa", async () => {
  const host = adminHostFixture({
    personType: "pj",
    company: {
      cnpj: "11222333000181",
      legalName: "Empresa de teste",
      tradeName: "Casa de teste",
      address: { city: "Maringá" },
    },
    suspendedAt: "2026-10-02T12:00:00Z",
    user: { ...adminHostFixture().user, suspensionReason: "Conferência de documento" },
  });
  const { user } = renderWithProviders(<AccountSummary source={{ kind: "hosts", value: host }} />, {
    theme: quintalTheme,
  });
  expect(screen.queryByText("111.444.777-35")).not.toBeInTheDocument();
  expect(screen.queryByText("11.222.333/0001-81")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Mostrar CPF" }));
  await user.click(screen.getByRole("button", { name: "Mostrar CNPJ" }));
  expect(screen.getByText("111.444.777-35")).toBeVisible();
  expect(screen.getByText("11.222.333/0001-81")).toBeVisible();
  expect(screen.getByText("Conferência de documento")).toBeVisible();
  expect(screen.getByText("Empresa de teste")).toBeVisible();
});
