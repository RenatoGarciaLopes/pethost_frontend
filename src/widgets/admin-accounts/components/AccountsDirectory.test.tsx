import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { toAccountRow } from "../lib/accountRows";
import { AccountsDirectoryView } from "./AccountsDirectory";
import type { AccountRow } from "../lib/accountRows";
import type { z } from "zod";
import { accountsSearchSchema } from "../schemas/accountsSearchSchema";

type Filters = z.output<typeof accountsSearchSchema>;

function renderDirectory(
  rows: readonly AccountRow[],
  type: "owners" | "hosts",
  page: number,
  onChange: (patch: Partial<Filters>) => void,
) {
  function Harness() {
    const [search, setSearch] = useState("");
    return (
      <AccountsDirectoryView
        rows={rows}
        type={type}
        status="all"
        stripeStatus="all"
        page={page}
        search={search}
        onSearchChange={setSearch}
        onChange={onChange}
      />
    );
  }
  return renderWithProviders(<Harness />, { theme: quintalTheme });
}
it("REQ-AACC-001/002/003 busca pessoal fica local, filtra CPF e limpar restaura lista", async () => {
  const onChange = vi.fn<(patch: Partial<Filters>) => void>();
  const rows = [toAccountRow({ kind: "owners", value: adminOwnerFixture() })];
  const { user } = renderDirectory(rows, "owners", 1, onChange);
  expect(screen.queryByText("529.982.247-25")).not.toBeInTheDocument();
  const search = screen.getByRole("textbox", { name: "Buscar por nome, e-mail ou CPF" });
  await user.click(search);
  await user.paste("529.982.247-25");
  expect(screen.getByRole("link", { name: "João de teste" })).toBeVisible();
  expect(onChange).not.toHaveBeenCalled();
  await user.clear(search);
  await user.paste("outra pessoa");
  expect(screen.getByText("Nenhuma conta com esse filtro")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
  expect(search).toHaveValue("");
  expect(onChange).toHaveBeenCalledWith({ status: "all", stripeStatus: "all", page: 1 });
});
it("REQ-AACC-001/014 abas e filtro Stripe enviam apenas filtros públicos e página 1", async () => {
  const onChange = vi.fn<(patch: Partial<Filters>) => void>();
  const { user } = renderDirectory([toAccountRow({ kind: "hosts", value: adminHostFixture() })], "hosts", 2, onChange);
  await user.selectOptions(screen.getByLabelText("Cadastro de recebimento"), "rejected");
  expect(onChange).toHaveBeenLastCalledWith({ stripeStatus: "rejected", page: 1 });
  await user.click(screen.getByRole("tab", { name: "Tutores" }));
  expect(onChange).toHaveBeenLastCalledWith({ type: "owners", status: "all", stripeStatus: "all", page: 1 });
});
