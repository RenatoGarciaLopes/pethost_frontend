import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { searchQueries } from "../../../api/queries";
import { CompatibilityNotice } from "./CompatibilityNotice";

const ACCOUNT = "owner-1";
const LISTING = "0199d2a0-0000-7000-8000-000000000042";
const PET = { id: "0199d2a0-0000-7000-8000-0000000000e1", name: "Pipoca" };
const STAY = { checkIn: "2026-12-20", checkOut: "2026-12-25" };

/** Cliente com a resposta da API já no cache, para a story não depender da rede. */
function withResult(result: { matches: boolean; warnings: { code: string }[]; guests?: object[] }): Decorator {
  return function CompatibilityCache(Story) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(searchQueries.compatibility(ACCOUNT, LISTING, PET.id, STAY).queryKey, {
      listingId: LISTING,
      petId: PET.id,
      petName: PET.name,
      ...result,
    } as never);
    return (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    );
  };
}

const meta = {
  title: "Search/CompatibilityNotice",
  component: CompatibilityNotice,
  parameters: { design: { board: "Página do cantinho" } },
  args: {
    accountId: ACCOUNT,
    listingId: LISTING,
    pet: PET,
    stay: STAY,
    hostName: "Dona Cida",
    reasons: ["aceita cachorro de porte médio", "tem cachorro em casa", "sem gato em casa"],
  },
} satisfies Meta<typeof CompatibilityNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Como na prancha: combina, com os motivos e a outra hóspede do período. */
export const Combina: Story = {
  decorators: [withResult({ matches: true, warnings: [], guests: [{ name: "Luna", species: "dog", size: "small" }] })],
};
export const CombinaSemDatas: Story = { decorators: [withResult({ matches: true, warnings: [] })] };
export const ComAvisos: Story = {
  decorators: [
    withResult({
      matches: false,
      warnings: [
        { code: "home_has_cats" },
        { code: "guest_large_dog", guest: { name: "Thor", species: "dog", size: "large" } },
      ],
      guests: [{ name: "Thor", species: "dog", size: "large" }],
    } as never),
  ],
};
export const Celular: Story = {
  ...Combina,
  globals: { viewport: { value: "celular", isRotated: false } },
};
