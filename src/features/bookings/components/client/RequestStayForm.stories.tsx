import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { PIPOCA_ID, THOR_ID } from "@/test/fixtures/bookings";
import type { PickablePet } from "./PetPickCards";
import { RequestStayForm, type RequestStayFormProps } from "./RequestStayForm";

const MEL_ID = "0199f0a0-0000-7000-8000-0000000000e3";
const pets: PickablePet[] = [
  { id: PIPOCA_ID, name: "Pipoca", species: "dog", size: "small", coverUrl: null, fit: { fits: true } },
  { id: THOR_ID, name: "Thor", species: "dog", size: "medium", coverUrl: null, fit: { fits: true } },
  { id: MEL_ID, name: "Mel", species: "cat", size: null, coverUrl: null, fit: { fits: false, reason: "species" } },
];

/** A conta da página (`stayTotal`), simplificada para a story. */
const totalOf: RequestStayFormProps["totalOf"] = (checkIn, checkOut, count) => {
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000;
  if (!checkIn || !checkOut || count < 1 || !(nights > 0)) return null;
  return `R$ ${(60.5 * nights * count).toFixed(2).replace(".", ",")}`;
};

/** Cliente de query próprio: a story não envia nada sozinha. */
function Frame(props: Pick<RequestStayFormProps, "pets" | "initial">) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { mutations: { retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <main>
        <RequestStayForm
          accountId="storybook-owner"
          listing={{
            id: "0199e0a0-0000-7000-8000-0000000000c1",
            title: "Casa da Cida",
            neighborhood: "Zona 01",
            city: "Maringá",
            coverUrl: null,
            nightlyRate: 60.5,
            hostName: "Aparecida Souza",
          }}
          today="2026-12-10"
          totalOf={totalOf}
          now={new Date("2026-12-10T15:00:00Z")}
          {...props}
        />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Bookings/RequestStayForm",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Reserva" } },
  args: { pets, initial: { checkIn: "2026-12-20", checkOut: "2026-12-25", petIds: [PIPOCA_ID, THOR_ID] } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Preenchido: Story = { name: "REQ-REQST-003 Datas e pets da URL, com a conta" };
export const SemEscolha: Story = {
  name: "REQ-REQST-002 Sem datas nem pets",
  args: { initial: { checkIn: "", checkOut: "", petIds: [] } },
};
export const SemPets: Story = { name: "REQ-REQST-002 Sem pets na lista", args: { pets: [] } };
export const Celular: Story = {
  name: "REQ-REQST-002 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
