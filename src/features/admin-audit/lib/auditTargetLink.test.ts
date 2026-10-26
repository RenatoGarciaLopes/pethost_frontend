import { describe, expect, it } from "vitest";
import { auditActorFilterHref, auditTargetFilterHref, auditTargetLink } from "./auditTargetLink";

describe("REQ-AUDIT-007 links da trilha", () => {
  const id = "77b9c00c-fdc0-4422-b4c7-7e237741a4a7";

  it.each([
    ["owner", `/admin/users/owners/${id}`],
    ["host", `/admin/users/hosts/${id}`],
    ["host_application", `/admin/host-applications/${id}`],
  ])("abre um alvo %s com tela existente ou planejada na 032", (type, path) => {
    expect(auditTargetLink(type, id)).toBe(path);
  });

  it("mantém alvos sem tela e ids ausentes sem link de abertura", () => {
    expect(auditTargetLink("listing", id)).toBeNull();
    expect(auditTargetLink("owner", null)).toBeNull();
  });

  it("usa os nomes de query do endpoint GET audit-entries", () => {
    expect(auditTargetFilterHref("owner", id)).toBe(`/admin/audit-entries?targetType=owner&targetId=${id}`);
    expect(auditActorFilterHref(id)).toBe(`/admin/audit-entries?actorId=${id}`);
  });
});
