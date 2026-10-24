import { expect, it } from "vitest";
import { listingClosedDays } from "./listingClosedDays";

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];

it("REQ-LPAGE-013 dias da semana fora da agenda fecham com o motivo, na ordem da semana", () => {
  const closed = listingClosedDays(weekdays);
  // 7 e 8 nov de 2026: sábado e domingo.
  expect(closed("2026-11-08")).toEqual({
    reason: "o cantinho não recebe aos sábados e aos domingos",
    legend: "Não recebe aos sábados e aos domingos",
  });
  expect(closed("2026-11-07")).toEqual(closed("2026-11-08"));
  expect(closed("2026-11-09")).toBeNull();
});

it("REQ-LPAGE-013 períodos do anfitrião fecham das pontas, inclusive", () => {
  const closed = listingClosedDays(
    [...weekdays, "saturday", "sunday"],
    [{ startDate: "2026-11-10", endDate: "2026-11-12" }],
  );
  for (const day of ["2026-11-10", "2026-11-12"])
    expect(closed(day)).toEqual({
      reason: "o anfitrião fechou a agenda nesse dia",
      legend: "Dias que o anfitrião fechou na agenda",
    });
  expect(closed("2026-11-09")).toBeNull();
  expect(closed("2026-11-13")).toBeNull();
});
