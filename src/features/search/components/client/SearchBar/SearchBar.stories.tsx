import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SearchBar } from "./SearchBar";
import { searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";

const meta = {
  title: "Search/SearchBar",
  component: SearchBar,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { query: searchQueryFixture(), pets: searchPetsFixture, today: "2026-10-15", onSearch: () => {} },
} satisfies Meta<typeof SearchBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const SemPets: Story = { args: { pets: [] } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };

/** O calendário abre embaixo da barra, alinhado à célula tocada, sem cobrir a barra (REQ-CAL-008). */
export const CalendarioEmbaixo: Story = {
  name: "REQ-CAL-008 Calendário abre embaixo",
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole("form", { name: "Busca de cantinhos" });
    await userEvent.click(canvas.getByLabelText("Chegada e saída"));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog", {
      name: "Escolher as datas da estadia",
    });
    await expect(dialog.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom);
  },
};

/** Sem espaço embaixo, o calendário vai para cima da barra e continua sem cobri-la (REQ-CAL-008). */
export const CalendarioEmCima: Story = {
  name: "REQ-CAL-008 Calendário sem espaço embaixo",
  globals: { viewport: { value: "desktop", isRotated: false } },
  decorators: [
    (Story) => (
      <div style={{ paddingTop: "62vh" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole("form", { name: "Busca de cantinhos" });
    await userEvent.click(canvas.getByLabelText("Chegada e saída"));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog", {
      name: "Escolher as datas da estadia",
    });
    await expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(bar.getBoundingClientRect().top);
  },
};

export const Erros: Story = { args: { errors: { where: "Confere a cidade.", from: "Confere a chegada." } } };
export const SemPetsPorEspecie: Story = { args: { pets: [], quantityMode: false } };
