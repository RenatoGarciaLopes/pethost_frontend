import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { auditEntryFixture } from "@/test/fixtures/audit";
import { toAuditEntry } from "../../../api/mappers";
import { AuditEntryDetail } from "./AuditEntryDetail";

describe("REQ-AUDIT-006/007 detalhe do registro", () => {
  it("mostra detalhes, IP e traceId copiável somente ao abrir", () => {
    const entry = toAuditEntry(auditEntryFixture());
    renderWithProviders(<AuditEntryDetail entry={entry} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Detalhes do registro" })).toBeVisible();
    expect(screen.getByText("203.0.113.17")).toBeVisible();
    expect(screen.getByText("status").parentElement).toHaveTextContent("suspended");
    expect(screen.getByRole("button", { name: "Copiar Identificador da requisição" })).toBeVisible();
  });

  it("oferece filtro por alvo e autor e abertura do anfitrião relacionado", () => {
    const entry = toAuditEntry(auditEntryFixture({ targetType: "host_application" }));
    renderWithProviders(<AuditEntryDetail entry={entry} onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Filtrar por este alvo" })).toHaveAttribute(
      "href",
      `/admin/audit-entries?targetType=host_application&targetId=${entry.targetId}`,
    );
    expect(screen.getByRole("link", { name: "Abrir registro relacionado" })).toHaveAttribute(
      "href",
      `/admin/host-applications/${entry.targetId}`,
    );
    expect(screen.getByRole("link", { name: "Filtrar por quem fez" })).toHaveAttribute(
      "href",
      `/admin/audit-entries?actorId=${entry.actorId}`,
    );
  });

  it("não inventa link quando IDs são ausentes ou o tipo de alvo não tem tela", () => {
    const entry = toAuditEntry(auditEntryFixture({ targetType: "listing", targetId: null, actorId: null }));
    renderWithProviders(<AuditEntryDetail entry={entry} onClose={vi.fn()} />);
    expect(screen.queryByRole("link", { name: "Filtrar por este alvo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Abrir registro relacionado" })).not.toBeInTheDocument();
  });
});
