import { describe, expect, it } from "vitest";
import { placeCalendar } from "./calendarPlacement";

describe("placeCalendar (REQ-CAL-008 posição do popover)", () => {
  it("abre embaixo da barra, alinhado à célula, com a folga do card", () => {
    expect(placeCalendar({ top: 100, bottom: 170 }, 430, 1000)).toEqual({
      anchorPosition: { top: 182, left: 430 },
      edge: "top",
    });
  });

  it("sem espaço embaixo e com espaço em cima, abre em cima da barra e não por cima dela", () => {
    expect(placeCalendar({ top: 570, bottom: 690 }, 430, 900)).toEqual({
      anchorPosition: { top: 558, left: 430 },
      edge: "bottom",
    });
  });

  it("sem espaço em nenhum lado, fica embaixo, o lado com mais espaço", () => {
    expect(placeCalendar({ top: 300, bottom: 360 }, 20, 700).edge).toBe("top");
  });
});
