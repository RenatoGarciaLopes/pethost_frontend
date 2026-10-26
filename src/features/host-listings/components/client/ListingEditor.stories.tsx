import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, userEvent, within } from "storybook/test";
import { listingCopy as copy } from "../../lib/listingCopy";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { listingDto } from "@/test/fixtures/listings";
import { listingDtoSchema } from "../../api/contracts";
import { toListing } from "../../api/mappers";
import { listingQueries } from "../../api/queries";
import { ListingEditor } from "./ListingEditor";

const ACCOUNT = "storybook-host";
const ID = listingDto().id;

/** Foto de exemplo em memória (sem rede): um quadrado de cor. */
const storyPhoto = (position: number, color: string) => ({
  id: `0199e0a0-0000-7000-8000-00000000f00${position}`,
  position,
  url: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${color}"/></svg>`,
  )}`,
});

/** Sem CEP no endereço: a story não dispara a busca do CEP. */
const noLookup = {
  address: {
    zipCode: null,
    street: "Avenida Brasil",
    number: "120",
    complement: null,
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

function Frame({ overrides }: { overrides: Record<string, unknown> }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(
      listingQueries.detail(ACCOUNT, ID).queryKey,
      toListing(listingDtoSchema.parse(listingDto({ ...noLookup, ...overrides }))),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <ListingEditor accountId={ACCOUNT} listingId={ID} kind="person" firstName="Cida" />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/HostListings/ListingEditor",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Cantinho" } },
  args: { overrides: { photos: [storyPhoto(1, "#F2C14E"), storyPhoto(2, "#7FB77E")] } },
  beforeEach: () => {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Aberto: Story = { name: "REQ-LIST-013 Cantinho aberto" };
export const AbasLivres: Story = {
  name: "Abas sem sequência obrigatória",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("textbox", { name: copy.home.title });
    await userEvent.clear(title);
    await userEvent.type(title, "Rascunho da casa");
    const nav = canvas.getByRole("navigation", { name: copy.editor.sectionsLabel });
    await userEvent.click(within(nav).getByRole("button", { name: new RegExp(copy.sections.rate) }));
    await expect(canvas.getByRole("heading", { name: copy.sections.rate })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: copy.sections.home })).not.toBeInTheDocument();
    await userEvent.click(within(nav).getByRole("button", { name: new RegExp(copy.sections.home) }));
    await expect(canvas.getByRole("textbox", { name: copy.home.title })).toHaveValue("Rascunho da casa");
  },
};
export const Pausado: Story = { name: "REQ-LIST-015 Pausado", args: { overrides: { isActive: false } } };
export const SemFotos: Story = {
  name: "REQ-LIST-014 Sem fotos",
  args: { overrides: { photos: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      within(canvas.getByRole("navigation", { name: copy.editor.sectionsLabel })).getByRole("button", {
        name: new RegExp(copy.photos.heading),
      }),
    );
    await expect(canvas.getByRole("heading", { name: copy.photos.heading })).toBeVisible();
  },
};
export const Celular: Story = {
  name: "REQ-LIST-013 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
