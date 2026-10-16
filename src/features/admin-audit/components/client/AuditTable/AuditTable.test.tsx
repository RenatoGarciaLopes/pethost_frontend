import { screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { auditEntryFixture, auditPageModelFixture } from "@/test/fixtures/audit";
import { auditQueries } from "../../../api/queries";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AuditTable } from "./AuditTable";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), search: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/audit-entries",
  useRouter: () => ({ push: router.push, replace: router.replace }),
  useSearchParams: () => new URLSearchParams(router.search),
}));

describe("REQ-AUDIT-001/005/010/011 AuditTable", () => {
  it.each(["full", "compact"] as const)("recupera página fora do intervalo no modo %s", async (variant) => {
    router.search = "page=999";
    const client = new QueryClient();
    const filters = { page: 999, pageSize: 20 } as const;
    const fixedFilters = variant === "compact" ? { targetType: "owner", targetId: "owner-id" } : undefined;
    client.setQueryData(
      auditQueries.page("admin-range", { ...filters, ...fixedFilters, pageSize: variant === "compact" ? 10 : 20 })
        .queryKey,
      {
        ...auditPageModelFixture([]),
        totalCount: 1,
        totalPages: 1,
      },
    );
    const onFiltersChange = vi.fn();
    const { user } = renderWithProviders(
      <AuditTable
        adminId="admin-range"
        filters={filters}
        fixedFilters={fixedFilters}
        variant={variant}
        onFiltersChange={onFiltersChange}
      />,
      { queryClient: client },
    );
    expect(screen.getByRole("navigation", { name: "Página" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Ir para a página 1" }));
    expect(onFiltersChange).toHaveBeenCalledWith({ page: 1 });
    client.clear();
  });

  it("renderiza colunas sem IP e mostra contagem da resposta paginada", () => {
    router.search = "";
    const client = new QueryClient();
    const filters = { page: 1, pageSize: 20 } as const;
    client.setQueryData(auditQueries.page("admin-test", filters).queryKey, {
      ...auditPageModelFixture(),
      totalCount: 33,
      totalPages: 2,
    });
    renderWithProviders(<AuditTable adminId="admin-test" filters={filters} onFiltersChange={vi.fn()} />, {
      queryClient: client,
    });

    expect(screen.getByRole("table", { name: "Registros de auditoria" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("1 de 33 registros");
    expect(screen.getByRole("columnheader", { name: "Data e hora (Brasília)" })).toBeVisible();
    expect(screen.queryByText("203.0.113.17")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /, Abrir detalhes: Tutor suspenso$/ })).toHaveAttribute(
      "href",
      expect.stringContaining("entryId="),
    );
  });

  it("REQ-AUDIT-010 mostra vazio e saída para limpar filtros", () => {
    router.search = "";
    const client = new QueryClient();
    const filters = { page: 1, pageSize: 20 } as const;
    client.setQueryData(auditQueries.page("admin-empty", filters).queryKey, auditPageModelFixture([]));
    renderWithProviders(<AuditTable adminId="admin-empty" filters={filters} onFiltersChange={vi.fn()} />, {
      queryClient: client,
      theme: quintalTheme,
    });
    expect(screen.getByText("Nada registrado com esse filtro")).toBeVisible();
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeVisible();
  });

  it("REQ-AUDIT-006 abre o detalhe pelo parâmetro do registro", () => {
    const entry = auditEntryFixture();
    router.search = `entryId=${entry.id}`;
    const client = new QueryClient();
    const filters = { page: 1, pageSize: 20 } as const;
    client.setQueryData(auditQueries.page("admin-detail", filters).queryKey, auditPageModelFixture());
    renderWithProviders(<AuditTable adminId="admin-detail" filters={filters} onFiltersChange={vi.fn()} />, {
      queryClient: client,
    });
    expect(screen.getByRole("dialog", { name: "Detalhes do registro" })).toBeVisible();
    expect(screen.getByText("203.0.113.17")).toBeVisible();
  });
});
