import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname, useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { AppHeader } from "@/widgets/app-shell";
import { HomeScreen, type HomeScreenProps } from "@/widgets/home";

/** Abre o calendário pela célula Chegada e escolhe o 2º e o 7º dia livres do mês: sempre cinco noites, qualquer que seja o hoje. */
async function pickFiveNights(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(within(canvasElement).getByLabelText("Chegada"));
  const dialog = await body.findByRole("dialog", { name: "Escolher as datas da estadia" });
  const free = [...dialog.querySelectorAll<HTMLElement>("[data-iso]:not([aria-disabled])")];
  await userEvent.click(free[1]!);
  await userEvent.click(dialog.querySelector<HTMLElement>(`[data-iso="${free[6]!.dataset.iso}"]`)!);
}

/** Composição real da rota sem sessão HTTP: cache só da story e mesmos widgets, sem layout paralelo. */
function HomePreview(props: HomeScreenProps) {
  const [client] = useState(() => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    cache.setQueryData(accountQueryKey("story-home", "linked-accounts"), []);
    return cache;
  });
  return (
    <QueryClientProvider client={client}>
      <AppHeader
        variant="home"
        user={
          props.viewer === "visitor"
            ? null
            : { id: "story-home", fullName: "Camila Souza", role: props.viewer, avatarUrl: null }
        }
      />
      <HomeScreen {...props} />
    </QueryClientProvider>
  );
}

const meta = {
  title: "Home/T7 · Prancha completa",
  component: HomePreview,
  parameters: { layout: "fullscreen", a11y: { test: "error" }, design: { board: "Quintal-Visitante / Quintal-Casas" } },
  globals: { viewport: { value: "desktop", isRotated: false } },
  args: { viewer: "visitor", pets: [], petsUnavailable: false },
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "story" });
    usePathname.mockReturnValue("/");
  },
} satisfies Meta<typeof HomePreview>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Regressão do corte causado por altura fixa e padding responsivo herdado. */
async function checkHeader(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvasElement.ownerDocument.fonts.ready;
  const header = canvas.getByRole("banner").getBoundingClientRect();
  const brand = canvas.getByRole("link", { name: "PetHost" });
  await expect(getComputedStyle(brand).textDecorationLine).toBe("none");
  await expect(getComputedStyle(brand).color).toBe("rgb(31, 26, 23)");
  for (const element of [brand.querySelector("svg")!, canvas.getByRole("link", { name: "Entrar" })]) {
    const bounds = element.getBoundingClientRect();
    await expect(bounds.top - header.top).toBeGreaterThanOrEqual(8);
    await expect(header.bottom - bounds.bottom).toBeGreaterThanOrEqual(10);
  }
}

export const Visitante: Story = {
  name: "REQ-UIC-003/007/009 Visitante · 1440",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await checkHeader(canvasElement);
    await expect(canvas.getByRole("banner")).toBeVisible();
    await canvasElement.ownerDocument.fonts.ready;
    const title = canvas.getByRole("heading", { level: 1 });
    const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight);
    await expect(title.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 3.1);
    await expect(
      Math.abs(
        title.getBoundingClientRect().left - canvas.getByRole("link", { name: "PetHost" }).getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
    await expect(canvas.getAllByRole("main")).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: "Como funciona" })).toHaveAttribute("href", "#como-funciona");
    await userEvent.type(canvas.getByRole("textbox", { name: "Onde" }), "Zona 7, Maringá");
    await pickFiveNights(canvasElement);
    await expect(canvas.getByText(/, a partir das 14h$/)).toBeVisible();
    await expect(canvas.getByText(/ · 5 noites$/)).toBeVisible();
    const form = canvas.getByRole("form", { name: "Busca de cantinhos" });
    await expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth);
    await expect(canvas.getByRole("list", { name: "Garantias da PetHost" }).children).toHaveLength(3);
  },
};

export const Tutor: Story = {
  name: "REQ-UIC-003/009 Tutor com Pipoca",
  args: { viewer: "owner", pets: [{ id: "story-pipoca", name: "Pipoca", species: "dog" }] },
};

export const Anfitriao: Story = { name: "REQ-HOME-004 Anfitrião", args: { viewer: "host" } };

export const Celular: Story = {
  name: "REQ-UIC-007/009 Celular · 390",
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await checkHeader(canvasElement);
    const open = canvas.getByRole("button", { name: "Onde, datas e pet" });
    await expect(open).toBeVisible();
    await expect(open).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(open);
    await expect(canvas.getByRole("textbox", { name: "Onde" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Fechar busca" })).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("button", { name: "Buscar cantinhos" })).toBeVisible();
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.ownerDocument.defaultView!.innerWidth,
    );
    await userEvent.click(canvas.getByRole("button", { name: "Fechar busca" }));
    await expect(open).toHaveAttribute("aria-expanded", "false");
  },
};

/** A pílula com nome e o menu da casca também precisam caber no celular, não só a entrada anônima. */
export const TutorCelular: Story = {
  name: "REQ-UIC-003/009 Tutor · 390",
  args: { viewer: "owner", pets: [{ id: "story-pipoca", name: "Pipoca", species: "dog" }] },
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /Menu da conta de Camila Souza/ })).toHaveTextContent("Camila");
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.ownerDocument.defaultView!.innerWidth,
    );
  },
};
