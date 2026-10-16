import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { fn } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { listingDraftKey } from "../../lib/listingDraft";
import { emptyListingValues, type ListingFormValues } from "../../schemas/listingSchema";
import type { HostListingProfile } from "../../types";
import { ListingDraft } from "./ListingDraft";

const ACCOUNT = "storybook-host";
const profile: HostListingProfile = {
  kind: "person",
  firstName: "Aparecida",
  address: null,
  payoutsEnabled: true,
  stripeStatus: "enabled",
};
/** Seções respondidas, menos o endereço (sem CEP: nenhuma busca de rede na story). */
const answered: ListingFormValues = {
  ...emptyListingValues,
  homeType: "house",
  hasYard: true,
  title: "Casa da Aparecida",
  description: "Casa térrea com quintal gramado.",
  hasDogs: true,
  hasCats: false,
  hasKids: false,
  acceptedSpecies: ["dog", "rabbit"],
  acceptsSmall: true,
  capacity: 3,
  availableWeekdays: ["monday", "friday", "saturday"],
  nightlyRate: "60,00",
};

interface FrameProps {
  kind: HostListingProfile["kind"];
  draft: { values: ListingFormValues; done: string[] } | null;
}

function Frame({ kind }: FrameProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <main>
        <ListingDraft accountId={ACCOUNT} profile={{ ...profile, kind }} />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/HostListings/ListingDraft",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Cantinho" } },
  args: { kind: "person", draft: null },
  beforeEach: ({ args }) => {
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
    sessionStorage.removeItem(listingDraftKey(ACCOUNT));
    if (args.draft) sessionStorage.setItem(listingDraftKey(ACCOUNT), JSON.stringify(args.draft));
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Rascunho novo: 7 seções e "Faltam 7 coisas". */
export const Novo: Story = { name: "REQ-LIST-003 Rascunho novo" };

/** Voltou outro dia: "Continuando o seu cantinho." e o que falta. */
export const Restaurado: Story = {
  name: "REQ-LIST-004 Rascunho restaurado",
  args: { draft: { values: answered, done: ["home", "household", "guests", "rules", "weekdays", "rate"] } },
};

/** Empresa: sem tipo da casa e capacidade até 200. */
export const Empresa: Story = { name: "REQ-LIST-005 Empresa", args: { kind: "company" } };

/** Celular (390 px). */
export const Celular: Story = {
  name: "REQ-LIST-003 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
