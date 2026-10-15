import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { petQueries } from "../../../api/queries";
import type { HouseResident } from "../../../types";
import { HouseResidents } from "./HouseResidents";
const resident: HouseResident = {
  id: "resident-story",
  name: "Bóris",
  species: "dog",
  speciesDescription: null,
  size: "medium",
  coverUrl: null,
  goodWithDogs: true,
  goodWithCats: false,
  goodWithKids: true,
};
function Frame({ empty = false }: { empty?: boolean }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(petQueries.house("storybook-host").queryKey, empty ? [] : [resident]);
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <HouseResidents hostId="storybook-host" />
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/Pets/HouseResidents",
  component: Frame,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Cantinho", section: "Pets da casa" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { name: "Quem mora aqui" })).toBeVisible();
  },
};
export const Vazio: Story = { args: { empty: true } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
