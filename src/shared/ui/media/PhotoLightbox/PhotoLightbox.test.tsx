import type { ReactElement } from "react";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PhotoLightbox } from "./PhotoLightbox";
const render = (ui: ReactElement) => renderWithProviders(ui, { theme: quintalTheme });

const photos = [
  { id: "1", url: "/one.jpg" },
  { id: "2", url: "/two.jpg" },
];

it("limita zoom a 1–4, restaura tamanho e reseta ao navegar", async () => {
  const user = userEvent.setup();
  render(<PhotoLightbox photos={photos} title="Casa" initialIndex={0} open onClose={vi.fn()} />);
  const image = () => screen.getByRole("img", { name: /^Foto/ });
  // jsdom não implementa a captura nativa de ponteiro usada pelo navegador.
  screen.getByTestId("photo-stage").setPointerCapture = vi.fn();
  expect(screen.getByRole("button", { name: "Diminuir zoom" })).toBeDisabled();
  for (let i = 0; i < 6; i++) await user.click(screen.getByRole("button", { name: "Aumentar zoom" }));
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(4)" });
  expect(screen.getByRole("button", { name: "Aumentar zoom" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Diminuir zoom" }));
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(3.5)" });
  await user.click(screen.getByText("Voltar ao tamanho"));
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
  fireEvent.wheel(screen.getByTestId("photo-stage"), { deltaY: -100 });
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(1.25)" });
  await user.dblClick(screen.getByTestId("photo-stage"));
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
  await user.dblClick(screen.getByTestId("photo-stage"));
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(2)" });
  await user.click(screen.getByRole("button", { name: "Próxima foto" }));
  expect(image()).toHaveStyle({ transform: "translate(0px, 0px) scale(1)" });
  expect(image()).toHaveAttribute("src", "/two.jpg");
  await user.click(screen.getByRole("button", { name: "Ver a foto 1" }));
  expect(screen.getByText("1 de 2")).toBeVisible();
});

it("não abre sem fotos e fecha pelo botão", async () => {
  const onClose = vi.fn();
  const { unmount } = render(<PhotoLightbox photos={[]} title="Casa" initialIndex={0} open onClose={onClose} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  unmount();
  render(<PhotoLightbox photos={photos} title="Casa" initialIndex={0} open onClose={onClose} />);
  await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(onClose).toHaveBeenCalledOnce();
});

it("uma única foto não oferece navegação e limita o índice inicial", () => {
  render(<PhotoLightbox photos={photos.slice(0, 1)} title="Casa" initialIndex={99} open onClose={vi.fn()} />);
  expect(screen.getByText("1 de 1")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Próxima foto" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Foto anterior" })).not.toBeInTheDocument();
});
