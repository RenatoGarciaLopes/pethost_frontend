import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listingFixture, searchQueryFixture } from "@/test/fixtures/search";
import type { ListingSummary } from "../../../api/contracts";
import { searchQueries } from "../../../api/queries";
import { ListingCard } from "./ListingCard";

const PET = { id: "0199d2a0-0000-7000-8000-0000000000e1", name: "Pipoca" };
const ACCOUNT = "owner-1";
const STAY = { checkIn: "2026-12-20", checkOut: "2026-12-25" };

/** Cliente com a resposta de compatibilidade já no cache, para a story não depender da API. */
function withCompatibility(warnings: { code: string }[], stay: typeof STAY | object = {}): Decorator {
  return function CompatibilityCache(Story, context) {
    const { listing } = context.args as { listing: ListingSummary };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(searchQueries.compatibility(ACCOUNT, listing.id, PET.id, stay).queryKey, {
      listingId: listing.id,
      petId: PET.id,
      petName: PET.name,
      matches: warnings.length === 0,
      warnings,
    });
    return (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    );
  };
}
const withEmptyClient: Decorator = (Story) => (
  <QueryClientProvider client={new QueryClient()}>
    <Story />
  </QueryClientProvider>
);
const compatibility = { accountId: ACCOUNT, pets: [PET] };
/** Paisagem sintética em SVG, para a story não depender de rede. */
const photo = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="190" fill="#7FC4E0"/><rect y="190" width="400" height="110" fill="#7BA05B"/><circle cx="320" cy="60" r="28" fill="#FFC93C"/></svg>')}`;

const meta = {
  title: "Search/ListingCard",
  component: ListingCard,
  parameters: { design: { board: "Quintal-Casas" } },
  decorators: [withEmptyClient],
  args: {
    listing: listingFixture({ coverPhotoUrl: photo, rating: { average: 4.8, count: 9 } }),
    query: searchQueryFixture(),
    petCount: 0,
  },
} satisfies Meta<typeof ListingCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Visitante, sem datas: só a diária, sem chip de compatibilidade. */
export const Visitante: Story = {};
export const SemFoto: Story = { args: { listing: listingFixture({ coverPhotoUrl: null }) } };
export const SemNota: Story = { args: { listing: listingFixture({ coverPhotoUrl: photo }) } };
export const SeloVizinho: Story = { args: { listing: listingFixture({ coverPhotoUrl: photo, badges: ["neighbor"] }) } };
export const SeloRespondeRapido: Story = {
  args: { listing: listingFixture({ coverPhotoUrl: photo, badges: ["fast_responder"], hasYard: false }) },
};
export const SeloExperiente: Story = {
  args: { listing: listingFixture({ coverPhotoUrl: photo, badges: ["experienced"], hasYard: false }) },
};
export const SeloBemAvaliado: Story = {
  args: {
    listing: listingFixture({
      coverPhotoUrl: photo,
      badges: ["well_rated"],
      hasYard: false,
      rating: { average: 4.9, count: 18 },
    }),
  },
};
export const Apartamento: Story = {
  args: { listing: listingFixture({ coverPhotoUrl: photo, homeType: "apartment", hasYard: false, badges: [] }) },
};
export const SemDistancia: Story = { args: { listing: listingFixture({ coverPhotoUrl: photo, distanceKm: null }) } };
export const ComDatas: Story = {
  args: { query: searchQueryFixture({ from: STAY.checkIn, to: STAY.checkOut }), petCount: 1 },
};
export const Combina: Story = {
  decorators: [withCompatibility([])],
  args: { compatibility },
};
export const ComAviso: Story = {
  decorators: [withCompatibility([{ code: "home_has_cats" }])],
  args: { compatibility },
};
export const ComAvisoDeHospede: Story = {
  decorators: [withCompatibility([{ code: "guest_large_dog" }], STAY)],
  args: { compatibility, query: searchQueryFixture({ from: STAY.checkIn, to: STAY.checkOut }), petCount: 1 },
};
export const Celular: Story = {
  decorators: [withCompatibility([])],
  globals: { viewport: { value: "celular", isRotated: false } },
  args: { compatibility, query: searchQueryFixture({ from: STAY.checkIn, to: STAY.checkOut }), petCount: 1 },
};
