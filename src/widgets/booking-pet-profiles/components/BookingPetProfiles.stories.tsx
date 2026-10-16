import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { petQueries } from "@/features/pets";
import { PIPOCA_ID } from "@/test/fixtures/bookings";
import { BookingPetProfiles } from "./BookingPetProfiles";

const ACCOUNT = "storybook-host";

/** Ficha semeada no cache com o formato do modelo de pets (sem rede). */
const pipoca = {
  id: PIPOCA_ID,
  isActive: true,
  values: {
    species: "dog",
    name: "Pipoca",
    sex: "female",
    size: "small",
    breed: "Vira-lata",
    isVaccinated: true,
    isNeutered: true,
    goodWithDogs: true,
    goodWithCats: false,
    goodWithKids: true,
    feedingNotes: "Ração duas vezes ao dia",
    vetContact: "Clínica do bairro",
  },
} as const;

function Frame() {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(petQueries.detail(ACCOUNT, PIPOCA_ID).queryKey, { ...pipoca, photos: [] });
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <BookingPetProfiles accountId={ACCOUNT} pets={[{ id: PIPOCA_ID, name: "Pipoca" }]} />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Widgets/BookingPetProfiles",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Anfitriao" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ficha: Story = { name: "REQ-HREQ-003 Ficha do pet" };
