import { screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { auditPageModelFixture } from "@/test/fixtures/audit";
import { auditQueries } from "../../../api/queries";
import { AuditExplorer } from "./AuditExplorer";

const navigation = vi.hoisted(() => ({ search: "", push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/audit-entries",
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

describe("REQ-AUDIT-002/003/004 explorer", () => {
  it("usa filtros válidos da URL e apresenta a página hidratada", () => {
    navigation.search = "action=owner.suspended&page=1&pageSize=20";
    const client = new QueryClient();
    const filters = { action: "owner.suspended", page: 1, pageSize: 20 } as const;
    client.setQueryData(auditQueries.page("admin-explorer", filters).queryKey, auditPageModelFixture());
    renderWithProviders(<AuditExplorer accountId="admin-explorer" initialInvalidFilters={[]} />, {
      queryClient: client,
    });

    expect(screen.getByRole("heading", { name: "Auditoria" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Ação" })).toHaveValue("owner.suspended");
    expect(screen.getByRole("table", { name: "Registros de auditoria" })).toBeVisible();
  });

  it("descarta filtros inválidos, avisa e limpa os parâmetros da URL", async () => {
    navigation.search = "targetId=nao-uuid&page=0";
    navigation.replace.mockClear();
    const client = new QueryClient();
    client.setQueryData(
      auditQueries.page("admin-invalid", { page: 1, pageSize: 20 }).queryKey,
      auditPageModelFixture(),
    );
    renderWithProviders(<AuditExplorer accountId="admin-invalid" initialInvalidFilters={["targetId", "page"]} />, {
      queryClient: client,
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Alguns filtros da URL não são válidos");
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/admin/audit-entries", { scroll: false }));
  });

  it("não consulta a API quando from vem depois de to", () => {
    navigation.search = "from=2026-10-16&to=2026-10-15";
    const client = new QueryClient();
    renderWithProviders(<AuditExplorer accountId="admin-range" initialInvalidFilters={[]} />, { queryClient: client });
    expect(screen.getByRole("alert")).toHaveTextContent("data inicial precisa ser igual ou anterior");
    expect(client.getQueryCache().find({ queryKey: auditQueries.all("admin-range") })).toBeUndefined();
  });
});
