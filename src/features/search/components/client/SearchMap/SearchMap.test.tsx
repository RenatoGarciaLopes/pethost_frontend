import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { searchMapListingsFixture, searchMapOrigin } from "@/test/fixtures/searchMap";
import { renderWithProviders } from "@/test/render";
import { SearchMap, type SearchMapProps } from "./SearchMap";

/** O jsdom não tem WebGL: um mapa de mentira com projeção em pixels e os eventos que o componente ouve. */
const fake = vi.hoisted(() => {
  type Handler = (event: Record<string, unknown>) => void;
  const instances: FakeMap[] = [];
  class FakeMap {
    handlers = new Map<string, Handler[]>();
    touchZoomRotate = { disableRotation: vi.fn() };
    easeTo = vi.fn();
    fitBounds = vi.fn();
    zoomIn = vi.fn();
    zoomOut = vi.fn();
    remove = vi.fn();
    constructor() {
      instances.push(this);
    }
    on(name: string, handler: Handler) {
      this.handlers.set(name, [...(this.handlers.get(name) ?? []), handler]);
    }
    emit(name: string, event: Record<string, unknown> = {}) {
      this.handlers.get(name)?.forEach((handler) => handler(event));
    }
    project([longitude, latitude]: [number, number]) {
      return { x: (longitude + 52) * 4000, y: (latitude + 23.3) * -4000 };
    }
    getCenter() {
      return { lat: -23.42, lng: -51.93 };
    }
    getBounds() {
      return { getWest: () => -51.95, getEast: () => -51.91, getSouth: () => -23.44, getNorth: () => -23.4 };
    }
  }
  return { instances, FakeMap };
});
vi.mock("maplibre-gl", () => ({ Map: fake.FakeMap }));
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

const [cida, antonio] = searchMapListingsFixture;

function setup(props: Partial<SearchMapProps> = {}) {
  const onSelect = vi.fn();
  const onMoveEnd = vi.fn();
  const view = renderWithProviders(
    <SearchMap
      listings={searchMapListingsFixture}
      origin={searchMapOrigin}
      onSelect={onSelect}
      onMoveEnd={onMoveEnd}
      searchOnMove
      onSearchOnMoveChange={vi.fn()}
      stay={{ nights: 5, petCount: 1 }}
      {...props}
    />,
    { theme: quintalTheme },
  );
  return { ...view, onSelect, onMoveEnd };
}
const lastMap = () => fake.instances.at(-1)!;

beforeEach(() => {
  fake.instances.length = 0;
});

describe("mapa da busca", () => {
  it("REQ-SRCH-013 cada pino tem nome e preço, abre pelo teclado e o cartão traz a faixa de privacidade", async () => {
    const { user, onSelect } = setup({
      selectedId: cida.id,
      compatibleIds: new Set([cida.id]),
      compatibleLabel: "Combina com a Pipoca",
    });
    const pin = await screen.findByRole("button", { name: /Casa da Dona Cida, R\$\s300/ });
    expect(pin).toHaveAttribute("aria-pressed", "true");
    screen.getByRole("button", { name: /Casa do Seu Antônio, R\$\s275/ }).focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(antonio.id);
    expect(screen.getByRole("link", { name: "Casa da Dona Cida" })).toHaveAttribute("href", `/listings/${cida.id}`);
    expect(screen.getByText(/Jd\. Alvorada · 2,1 km · ★ 4,9 \(18\)/)).toBeVisible();
    expect(screen.getByText("✓ Combina com a Pipoca")).toBeVisible();
    expect(screen.getByText(/O pino mostra o bairro, não a casa/)).toBeVisible();
  });

  it("REQ-SRCH-013 o cartão fecha pelo botão e pelo Esc; tocar no pino selecionado também fecha", async () => {
    const { user, onSelect } = setup({ selectedId: cida.id });
    await user.click(await screen.findByRole("button", { name: "Fechar o cartão do cantinho" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /Casa da Dona Cida/ }));
    expect(onSelect.mock.calls).toEqual([[null], [null], [null]]);
  });

  it("REQ-SRCH-013 ao mexer no mapa avisa centro e raio do recorte, só com a opção ligada e gesto da pessoa", async () => {
    const { onMoveEnd, rerender } = setup();
    await screen.findByRole("button", { name: /Casa da Dona Cida/ });
    lastMap().emit("moveend", {});
    expect(onMoveEnd).not.toHaveBeenCalled();
    lastMap().emit("moveend", { originalEvent: new Event("mousemove") });
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const [center, radiusKm] = onMoveEnd.mock.calls[0];
    expect(center).toEqual({ latitude: -23.42, longitude: -51.93 });
    expect(radiusKm).toBe(2);
    rerender(
      <SearchMap
        listings={searchMapListingsFixture}
        onSelect={vi.fn()}
        onMoveEnd={onMoveEnd}
        searchOnMove={false}
        onSearchOnMoveChange={vi.fn()}
      />,
    );
    lastMap().emit("moveend", { originalEvent: new Event("mousemove") });
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it("REQ-SRCH-013 o zoom conta como gesto da pessoa e o checkbox liga a busca ao mexer", async () => {
    const onSearchOnMoveChange = vi.fn();
    const { user } = setup({ onSearchOnMoveChange, searchOnMove: false });
    await user.click(await screen.findByRole("button", { name: "Aproximar o mapa" }));
    expect(lastMap().zoomIn).toHaveBeenCalledWith(expect.anything(), { userAction: true });
    await user.click(screen.getByRole("checkbox", { name: "Buscar quando eu mexer no mapa" }));
    expect(onSearchOnMoveChange).toHaveBeenCalledWith(true);
  });
});
