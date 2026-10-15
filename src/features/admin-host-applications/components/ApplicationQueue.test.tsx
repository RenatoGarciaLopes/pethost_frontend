import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { ApplicationQueueView } from "./ApplicationQueue";
it("REQ-AQUEUE-001/002 fila ordena mais antigas primeiro e muda status com página 1", async () => {
  const onChange = vi.fn();
  const older = adminApplicationFixture({
    id: "0199d2a0-0000-7000-8000-000000000034",
    submittedAt: "2026-09-01T12:00:00Z",
  });
  const { user } = renderWithProviders(
    <ApplicationQueueView rows={[adminApplicationFixture(), older]} status="submitted" page={2} onChange={onChange} />,
    { theme: quintalTheme },
  );
  const links = screen.getAllByRole("link");
  expect(links[0]).toHaveAttribute("href", `/admin/host-applications/${older.id}`);
  await user.selectOptions(screen.getByLabelText("Status"), "approved");
  expect(onChange).toHaveBeenCalledWith({ status: "approved", page: 1 });
});
it("REQ-AQUEUE-004 fila vazia tem mensagem específica", () => {
  renderWithProviders(<ApplicationQueueView rows={[]} status="submitted" page={1} onChange={() => {}} />, {
    theme: quintalTheme,
  });
  expect(screen.getByText("Ninguém esperando agora")).toBeVisible();
});
