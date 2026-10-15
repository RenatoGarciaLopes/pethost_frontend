import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { KeeperPendingNotice } from "./KeeperPendingNotice";
it("REQ-HPETS-002 aviso é texto normal, sem link para rota ainda ausente", () => {
  renderWithProviders(<KeeperPendingNotice />);
  expect(screen.getByText("Os pets da casa entram depois que sua verificação for aprovada.")).toBeVisible();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
it("REQ-HPETS-002 só oferece verificação quando disponível", () => {
  renderWithProviders(<KeeperPendingNotice verificationAvailable />);
  expect(screen.getByRole("link", { name: "Ver minha verificação" })).toHaveAttribute("href", "/host/application");
});
