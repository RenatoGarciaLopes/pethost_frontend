import { expect, it } from "vitest";
import { paginate } from "./paginate";
it("REQ-AQUEUE-003 divide 26 itens e limita página após redução da fila", () => {
  const items = Array.from({ length: 26 }, (_, i) => i);
  expect(paginate(items, 1, 25).items).toHaveLength(25);
  expect(paginate(items, 2, 25)).toEqual({ items: [25], page: 2, pages: 2, total: 26 });
  expect(paginate([1], 10, 25).page).toBe(1);
  expect(paginate([], 0, 25)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
  expect(() => paginate(items, 1, 0)).toThrow();
});
