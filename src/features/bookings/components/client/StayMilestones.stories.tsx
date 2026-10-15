import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { bookingDto, ownerContactDto } from "@/test/fixtures/bookings";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { StayMilestones } from "./StayMilestones";

/** 12h do dia 21/12 em Brasília: dentro da estadia de 20 a 25. */
const DURING = new Date("2026-12-21T15:00:00Z");

function Frame({ overrides, now }: { overrides: Record<string, unknown>; now: Date }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } }));
  return (
    <QueryClientProvider client={client}>
      <main>
        <StayMilestones
          accountId="storybook-host"
          booking={toBooking(bookingDtoSchema.parse(bookingDto(overrides)))}
          now={now}
        />
      </main>
    </QueryClientProvider>
  );
}

const confirmed = { status: "confirmed", responseDeadline: null, contact: ownerContactDto };

const meta = {
  title: "Features/Bookings/StayMilestones",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Anfitriao" } },
  args: { overrides: confirmed, now: DURING },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DiaDaChegada: Story = { name: "REQ-STDAY-001 Dia da chegada" };
export const AntesDoDia: Story = {
  name: "REQ-STDAY-001 Antes do dia",
  args: { now: new Date("2026-12-18T15:00:00Z") },
};
export const EmAndamento: Story = {
  name: "REQ-STDAY-003 Em andamento",
  args: { overrides: { ...confirmed, status: "in_progress" } },
};
export const Celular: Story = {
  name: "REQ-STDAY-001 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
