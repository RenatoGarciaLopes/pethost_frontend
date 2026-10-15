import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AuditFilters } from "./AuditFilters";

describe("REQ-AUDIT-002 a REQ-AUDIT-004 filtros", () => {
  const filters = { page: 2, pageSize: 20 } as const;

  it("valida UUID e intervalo antes de aplicar busca", async () => {
    const onApply = vi.fn();
    const { user } = renderWithProviders(
      <AuditFilters filters={filters} invalidFields={[]} onApply={onApply} onClear={vi.fn()} />,
    );
    await user.type(screen.getByRole("textbox", { name: "ID do alvo" }), "nao-uuid");
    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-16" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-15" } });
    await user.click(screen.getByRole("button", { name: "Buscar registros" }));

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText("Informe um UUID válido.")).toBeVisible();
    expect(screen.getByText("A data inicial precisa ser igual ou anterior à data final.")).toBeVisible();
  });

  it("aplica filtros válidos em página 1 e permite código desconhecido", async () => {
    const onApply = vi.fn();
    const { user } = renderWithProviders(
      <AuditFilters filters={filters} invalidFields={[]} onApply={onApply} onClear={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Ação" }), { target: { value: "future.action" } });
    fireEvent.change(screen.getByRole("textbox", { name: "ID de quem fez" }), {
      target: { value: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e" },
    });
    await user.click(screen.getByRole("button", { name: "Buscar registros" }));

    expect(onApply).toHaveBeenCalledWith({
      action: "future.action",
      actorId: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e",
      page: 1,
      pageSize: 20,
    });
  });
});
