import type { ReactElement } from "react";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { listingPhotosFixture } from "@/test/fixtures/listingPage";
import { ListingGallery } from "./ListingGallery";
const render = (ui: ReactElement) => renderWithProviders(ui, { theme: quintalTheme });

it("abre na foto escolhida, navega por botão e teclado, fecha com Esc e restaura foco", async () => {
  const user = userEvent.setup();
  render(<ListingGallery title="Casa" photos={listingPhotosFixture} neighbor={false} />);
  const opener = screen.getByRole("button", { name: "Ver a foto 2 de 3 de Casa" });
  await user.click(opener);
  expect(screen.getByText("2 de 3")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Próxima foto" }));
  expect(screen.getByText("3 de 3")).toBeVisible();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByText("1 de 3")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Foto anterior" }));
  expect(screen.getByText("3 de 3")).toBeVisible();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByText("2 de 3")).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});

it("não abre durante o arraste do carrossel e aceita a próxima ativação pelo teclado", async () => {
  render(<ListingGallery title="Casa" photos={listingPhotosFixture} neighbor={false} />);
  const photo = screen.getByRole("button", { name: "Ver a foto 1 de 3 de Casa" });
  // jsdom não implementa PointerEvent; os eventos MouseEvent preservam as coordenadas do gesto.
  fireEvent(photo, new MouseEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 30 }));
  fireEvent(photo, new MouseEvent("pointermove", { bubbles: true, clientX: 80, clientY: 30 }));
  fireEvent.click(photo, { detail: 1 });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  photo.focus();
  await userEvent.keyboard("{Enter}");
  expect(screen.getByText("1 de 3")).toBeVisible();
});

it("oferece todas as cinco fotos e preserva o vazio", async () => {
  const user = userEvent.setup();
  const photos = [
    ...listingPhotosFixture,
    { ...listingPhotosFixture[0], id: "4" },
    { ...listingPhotosFixture[1], id: "5" },
  ];
  const { unmount } = render(<ListingGallery title="Casa" photos={photos} neighbor={false} />);
  await user.click(screen.getByRole("button", { name: "Ver as 5 fotos" }));
  expect(screen.getByText("1 de 5")).toBeVisible();
  await user.keyboard("{Escape}");
  unmount();
  render(<ListingGallery title="Casa" photos={[]} neighbor={false} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
