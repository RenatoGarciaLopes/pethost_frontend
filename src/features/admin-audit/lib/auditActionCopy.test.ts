import { describe, expect, it } from "vitest";
import { auditActionCopy, auditActionGroups, auditActionOptions } from "./auditActionCopy";

describe("REQ-AUDIT-003 e REQ-AUDIT-008", () => {
  it("oferece todas as ações documentadas com rótulo e grupo", () => {
    expect(auditActionOptions.length).toBeGreaterThan(30);
    for (const option of auditActionOptions) {
      expect(auditActionCopy(option.code)).toMatchObject({ label: option.label, group: option.group, known: true });
    }
  });

  it("traduz ações da trilha e agrupa eventos de anfitrião", () => {
    expect(auditActionCopy("host_application.document_viewed")).toEqual({
      label: "Documento consultado",
      group: "host_application",
      known: true,
    });
    expect(auditActionGroups.map(({ id }) => id)).toContain("host_application");
  });

  it("mantém código desconhecido disponível para busca sem interromper a tela", () => {
    expect(auditActionCopy("future_module.changed")).toEqual({
      label: "Ação não reconhecida",
      group: "outros",
      known: false,
    });
  });
});
