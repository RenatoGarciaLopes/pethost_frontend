import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { Surface } from "@/shared/ui/layout/Surface";
import { Calendar } from "./Calendar";
import type { RangeValue } from "./calendarDates";

const TODAY = "2026-10-15";

interface DemoProps {
  initial?: RangeValue;
  months?: 1 | 2;
  mode?: "single" | "range";
  blockWeekends?: boolean;
}

function Demo({ initial = { start: "", end: "" }, months = 2, mode = "range", blockWeekends }: DemoProps) {
  const [range, setRange] = useState(initial);
  const shared = {
    today: TODAY,
    min: TODAY,
    max: "2027-10-15",
    months,
    onClear: () => setRange({ start: "", end: "" }),
    isDisabled: blockWeekends ? (iso: string) => [0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay()) : undefined,
  };
  return (
    <Box sx={{ maxWidth: months === 2 ? 720 : 380 }}>
      <Surface elevation="md">
        {mode === "range" ? (
          <Calendar {...shared} mode="range" value={range} onChange={setRange} maxNights={30} />
        ) : (
          <Calendar {...shared} mode="single" value={range.start} onChange={(start) => setRange({ start, end: "" })} />
        )}
      </Surface>
    </Box>
  );
}

const meta = {
  title: "Quintal/Forms/Calendar",
  component: Demo,
  tags: ["autodocs"],
  parameters: { design: { board: "Busca-Mapa" } },
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Sem data: dois meses, hoje com anel tracejado e dias passados apagados. */
export const Vazio: Story = { name: "REQ-CAL-004 Vazio" };

/** Só a chegada: o rodapé explica o limite de 30 noites e o dia seguinte ao limite fica apagado. */
export const SoChegada: Story = {
  name: "REQ-CAL-005 Só chegada",
  args: { initial: { start: "2026-10-20", end: "" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/até 30 noites/)).toBeVisible();
  },
};

/** Intervalo feito: pontas em coral, noites do meio na faixa verde e resumo no tom da casa. */
export const Intervalo: Story = {
  name: "REQ-CAL-005 Intervalo",
  args: { initial: { start: "2026-10-28", end: "2026-11-03" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("6 noites · 28 out a 3 nov")).toBeVisible();
  },
};

/** Dias bloqueados por regra (fins de semana, aqui) ficam apagados e não respondem ao toque. */
export const DiasBloqueados: Story = {
  name: "REQ-CAL-004 Dias bloqueados",
  args: { blockWeekends: true, mode: "single" },
};

/** Um mês só, como na folha de baixo do celular. */
export const Celular: Story = {
  name: "REQ-CAL-004 Celular",
  args: { months: 1, initial: { start: "2026-10-20", end: "2026-10-23" } },
  globals: { viewport: { value: "celular", isRotated: false } },
};

/** Teclado: setas movem o foco, PageDown troca o mês, Enter escolhe. */
export const Teclado: Story = {
  name: "REQ-CAL-006 Teclado",
  args: { months: 1, mode: "single" },
  play: async ({ canvas, userEvent }) => {
    const today = canvas.getByRole("button", { name: /15 de outubro de 2026, hoje/ });
    today.focus();
    await userEvent.keyboard("{ArrowRight}{PageDown}");
    await expect(canvas.getByRole("grid", { name: "novembro de 2026" })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText(/segunda-feira, 16 de novembro de 2026/)).toBeVisible();
  },
};
