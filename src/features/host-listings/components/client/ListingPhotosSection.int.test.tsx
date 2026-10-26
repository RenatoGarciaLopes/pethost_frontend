import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDto } from "@/test/fixtures/listings";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { listingDtoSchema } from "../../api/contracts";
import { toListing } from "../../api/mappers";
import { ListingPhotosSection } from "./ListingPhotosSection";

it("106 menu da seção envia a ordem completa uma vez e bloqueia durante a gravação", async () => {
  const photos = [1, 2, 3].map((n) => ({
    id: `0199e0a0-0000-7000-8000-00000000f00${n}`,
    url: `https://cdn.test/${n}.jpg`,
    position: n,
  }));
  const dto = listingDto({ photos });
  let body: unknown;
  let release!: () => void;
  const saving = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.put(`*/api/listings/${dto.id}/photos/order`, async ({ request }) => {
      body = await request.json();
      await saving;
      return HttpResponse.json(apiOk(dto));
    }),
  );
  const { user } = renderWithProviders(
    <ListingPhotosSection accountId="account-1" listing={toListing(listingDtoSchema.parse(dto))} />,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button", { name: "Opções da foto 3" }));
  await user.click(screen.getByRole("menuitem", { name: "Usar como capa" }));
  await waitFor(() => expect(body).toEqual({ photoIds: [photos[2].id, photos[0].id, photos[1].id] }));
  expect(screen.queryByRole("button", { name: /Arrastar foto/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Opções da foto 1" })).toBeDisabled();
  release();
  await waitFor(() => expect(screen.getByRole("button", { name: "Opções da foto 1" })).toBeEnabled());
}, 20000);
