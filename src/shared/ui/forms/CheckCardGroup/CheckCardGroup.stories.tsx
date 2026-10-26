import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { CheckCardGroup } from "./CheckCardGroup";

const meta = {
  title: "Quintal/Forms/CheckCardGroup",
  component: CheckCardGroup,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Cantinho" } },
  args: {
    label: "Portes de cachorro e gato",
    options: [
      { value: "small", label: "Pequeno", description: "até 10 kg" },
      { value: "medium", label: "Médio", description: "10 a 25 kg" },
      { value: "large", label: "Grande", description: "mais de 25 kg" },
    ],
    value: ["small"],
    columns: { xs: 1, sm: 3 },
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <CheckCardGroup
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof CheckCardGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Portes: três cartões, mais de um pode ficar marcado. */
export const Portes: Story = {
  name: "REQ-DS-009 Portes",
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: /Médio/ }));
    await expect(args.onChange).toHaveBeenLastCalledWith(["small", "medium"]);
  },
};

/** Lista longa em cartões compactos (espécies), com erro. */
export const Compacto: Story = {
  name: "REQ-DS-009 Compacto com erro",
  args: {
    label: "Que bichos você recebe?",
    density: "compact",
    columns: { xs: 2, md: 3 },
    value: [],
    error: "Escolhe ao menos um tipo de bicho.",
    options: ["Cachorro", "Gato", "Calopsita", "Papagaio", "Coelho", "Porquinho-da-índia"].map((label) => ({
      value: label,
      label,
    })),
  },
};
