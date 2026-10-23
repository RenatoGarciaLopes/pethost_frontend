import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { searchQueries } from "../../../api/queries";
import { CompatibilityNotice } from "./CompatibilityNotice";

const LISTING = "0199d2a0-0000-7000-8000-000000000042";
const PET = { id: "0199d2a0-0000-7000-8000-0000000000e1", name: "Pipoca" };
const STAY = { checkIn: "2026-12-20", checkOut: "2026-12-25" };
const REASONS = ["aceita cachorro de porte médio", "tem cachorro em casa", "sem gato em casa"];

function renderWith(result: object | undefined) {
  const queryClient = createTestQueryClient();
  if (result)
    queryClient.setQueryData(searchQueries.compatibility("owner-1", LISTING, PET.id, STAY).queryKey, {
      listingId: LISTING,
      petId: PET.id,
      petName: PET.name,
      ...result,
    } as never);
  return renderWithProviders(
    <CompatibilityNotice
      accountId="owner-1"
      listingId={LISTING}
      pet={PET}
      stay={STAY}
      hostName="Dona Cida"
      reasons={REASONS}
    />,
    { queryClient, theme: quintalTheme },
  );
}

it("REQ-LPAGE-005 sem aviso, diz que combina, explica por quê e conta quem mais a casa recebe nas datas", () => {
  renderWith({ matches: true, warnings: [], guests: [{ name: "Luna", species: "dog", size: "small" }] });
  const box = screen.getByRole("status");
  expect(box).toHaveAttribute("data-tone", "ok");
  expect(box).toHaveTextContent("A Pipoca combina com essa casa.");
  expect(box).toHaveTextContent("Aceita cachorro de porte médio · tem cachorro em casa · sem gato em casa.");
  expect(box).toHaveTextContent("Nessas datas, Dona Cida também recebe Luna (cão pequeno).");
});

it("REQ-LPAGE-005 com avisos, a caixa fica tracejada, lista cada aviso e esconde os motivos", () => {
  renderWith({ matches: false, warnings: [{ code: "home_has_cats" }, { code: "guest_is_dog" }], guests: [] });
  const box = screen.getByRole("status");
  expect(box).toHaveAttribute("data-tone", "atencao");
  expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "Tem gato em casa",
    "Recebe um cão nessas datas",
  ]);
  expect(box).not.toHaveTextContent("sem gato em casa");
});

it("REQ-LPAGE-005 se a compatibilidade falhar, a caixa não aparece e a página segue", async () => {
  server.use(http.get("*/api/listings/:id/compatibility", () => HttpResponse.json(apiFail("X"), { status: 500 })));
  const { container, queryClient } = renderWith(undefined);
  const key = searchQueries.compatibility("owner-1", LISTING, PET.id, STAY).queryKey;
  await waitFor(() => expect(queryClient.getQueryState(key)?.status).toBe("error"));
  expect(container).toBeEmptyDOMElement();
});
