import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReadonlyURLSearchParams, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { expect, userEvent, within } from "storybook/test";
import { searchPetsFixture } from "@/test/fixtures/search";
import { SearchSummaryBar } from "./SearchSummaryBar";

const query = { where: "Zona 7", from: "2026-12-20", to: "2026-12-25", pets: searchPetsFixture[0]!.id };

const meta = {
  title: "Search/SearchSummaryBar",
  component: SearchSummaryBar,
  parameters: { design: { board: "Busca-Mapa" }, query },
  args: { pets: searchPetsFixture },
  beforeEach: ({ parameters }) => {
    // Mock do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams(parameters.query));
  },
} satisfies Meta<typeof SearchSummaryBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const SemBusca: Story = { parameters: { query: {} } };
export const AnfitriaoContaPets: Story = { args: { pets: [], quantityMode: true } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
export const EditaOLugar: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /^Editar o lugar/ }));
    const field = await within(canvasElement.ownerDocument.body).findByRole("textbox", { name: "Onde" });
    await expect(field).toHaveFocus();
  },
};
