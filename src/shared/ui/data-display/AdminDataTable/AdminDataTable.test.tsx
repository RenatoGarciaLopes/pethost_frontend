import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AdminDataTable } from "./AdminDataTable";
it("REQ-AQUEUE-001/003 tabela navega, ordena e pagina sem perder links", async () => {
  const onPageChange = vi.fn();
  const { user } = renderWithProviders(
    <AdminDataTable
      label="Fila"
      rows={[
        { id: "b", name: "B" },
        { id: "a", name: "A" },
      ]}
      columns={[
        { key: "name", label: "Nome", render: (row) => row.name, compare: (a, b) => a.name.localeCompare(b.name) },
      ]}
      rowKey={(row) => row.id}
      rowHref={(row) => `/review/${row.id}`}
      rowLabel={(row) => row.name}
      page={1}
      pageSize={1}
      onPageChange={onPageChange}
      empty="Vazia"
    />,
  );
  expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("href", "/review/b");
  await user.click(screen.getByRole("button", { name: "Nome" }));
  expect(screen.getByRole("link", { name: "A" })).toBeVisible();
  const activate = vi.fn((event: Event) => event.preventDefault());
  screen.getByRole("link", { name: "A" }).addEventListener("click", activate);
  await user.click(screen.getByRole("row", { name: "A" }));
  expect(activate).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Ir para a página 2" }));
  expect(onPageChange).toHaveBeenCalledWith(2);
});
it("REQ-AQUEUE-004 tabela vazia apresenta saída fornecida pelo consumidor", () => {
  renderWithProviders(
    <AdminDataTable
      label="Fila"
      rows={[]}
      columns={[]}
      rowKey={() => ""}
      rowHref={() => "/"}
      rowLabel={() => ""}
      page={1}
      onPageChange={() => {}}
      empty="Ninguém esperando agora"
    />,
  );
  expect(screen.getByText("Ninguém esperando agora")).toBeVisible();
});
