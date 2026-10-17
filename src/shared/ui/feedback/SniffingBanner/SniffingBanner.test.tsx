import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { SniffingBanner } from "./SniffingBanner";
it("REQ-SRCH-008 anuncia atualização sem ação bloqueante", () => {
  renderWithProviders(<SniffingBanner />);
  expect(screen.getByRole("status")).toHaveTextContent("Farejando cantinhos…");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
