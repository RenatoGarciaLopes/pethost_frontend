import { describe, expect, it } from "vitest";
import { toAuditQuery } from "./toAuditQuery";

describe("REQ-AUDIT-004 e REQ-AUDIT-005", () => {
  it("envia limites locais inclusivos com fuso de Brasília e parâmetros reais da API", () => {
    expect(
      toAuditQuery({
        action: "owner.suspended",
        targetType: "owner",
        targetId: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7",
        actorId: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e",
        from: "2026-10-15",
        to: "2026-10-15",
        page: 2,
        pageSize: 50,
      }),
    ).toEqual({
      action: "owner.suspended",
      targetType: "owner",
      targetId: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7",
      actorId: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e",
      from: "2026-10-15T00:00:00.000-03:00",
      to: "2026-10-15T23:59:59.999-03:00",
      page: 2,
      pageSize: 50,
    });
  });

  it("não deixa filtros editáveis substituir os fixos da 032", () => {
    const query = toAuditQuery(
      { page: 1, pageSize: 20, targetType: "host", targetId: "f4b27c94-91fb-4de6-839f-d061e8b0d571" },
      { targetType: "owner", targetId: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7" },
    );
    expect(query).toMatchObject({ targetType: "owner", targetId: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7" });
  });

  it("rejeita um intervalo reverso antes da chamada HTTP", () => {
    expect(() => toAuditQuery({ page: 1, pageSize: 20, from: "2026-10-16", to: "2026-10-15" })).toThrow(RangeError);
  });
});
