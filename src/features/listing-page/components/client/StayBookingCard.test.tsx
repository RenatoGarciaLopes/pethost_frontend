import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { pickCalendarDays } from "@/test/calendar";
import { renderWithProviders } from "@/test/render";
import { StayBookingCard, type StayBookingCardProps } from "./StayBookingCard";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const LISTING = "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c";
const base: StayBookingCardProps = {
  listingId: LISTING,
  nightlyRate: 60,
  hostName: "Dona Cida",
  today: "2026-12-01",
  search: "where=Zona+7&pets=pet-1&from=2026-12-20&to=2026-12-25",
  from: "2026-12-20",
  to: "2026-12-25",
  petIds: ["pet-1"],
  pets: [
    { id: "pet-1", name: "Pipoca", coverUrl: null },
    { id: "pet-2", name: "Mel", coverUrl: null },
  ],
};
const render = (props: Partial<StayBookingCardProps> = {}) =>
  renderWithProviders(<StayBookingCard {...base} {...props} />, { theme: quintalTheme });
const lastUrl = () => new URL(replace.mock.lastCall![0] as string, "http://test");

beforeEach(() => replace.mockClear());

it("REQ-LPAGE-004 com datas e pet, mostra a conta, o total e o pedido com os mesmos parâmetros", () => {
  render();
  expect(screen.getByText(/R\$\s60,00 × 5 noites × 1 pet/)).toBeVisible();
  expect(screen.getAllByText(/R\$\s300,00/).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Pipoca" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Mel" })).toHaveAttribute("aria-pressed", "false");
  for (const link of screen.getAllByRole("link", { name: "Pedir estadia" })) {
    const url = new URL(link.getAttribute("href")!, "http://test");
    expect(url.pathname).toBe(`/listings/${LISTING}/request`);
    expect(url.searchParams.get("from")).toBe("2026-12-20");
    expect(url.searchParams.get("to")).toBe("2026-12-25");
    expect(url.searchParams.getAll("pets")).toEqual(["pet-1"]);
  }
  expect(screen.getByText(/Você só paga depois que Dona Cida aceitar\./)).toBeVisible();
});

it("REQ-LPAGE-004 escolher outro pet vai para a URL, somando na conta e preservando a busca de origem", () => {
  render();
  fireEvent.click(screen.getByRole("button", { name: "Mel" }));
  expect(lastUrl().pathname).toBe(`/listings/${LISTING}`);
  expect(lastUrl().searchParams.getAll("pets")).toEqual(["pet-1", "pet-2"]);
  expect(lastUrl().searchParams.get("where")).toBe("Zona 7");
  expect(screen.getByText(/× 5 noites × 2 pets/)).toBeVisible();
});

it("REQ-LPAGE-004 sem datas não há total; as datas só vão para a URL quando formam uma estadia válida", async () => {
  const { user } = render({ search: "", from: undefined, to: undefined, petIds: [] });
  expect(screen.queryByText("Total")).not.toBeInTheDocument();
  await pickCalendarDays(user, screen.getByLabelText("Chegada e saída"), "2026-12-20", "2026-12-22");
  // Só a estadia completa vai para a URL: a chegada sozinha não navegou.
  expect(replace).toHaveBeenCalledTimes(1);
  expect(lastUrl().searchParams.get("from")).toBe("2026-12-20");
  expect(lastUrl().searchParams.get("to")).toBe("2026-12-22");
  // Sem pet escolhido e sem "quantos pets" da busca, ainda não dá pra fazer a conta.
  expect(screen.queryByText("Total")).not.toBeInTheDocument();
});

it("tutor sem pet é convidado a cadastrar um", () => {
  render({ pets: [], petIds: [] });
  expect(screen.getByRole("link", { name: "Cadastrar pet" })).toHaveAttribute("href", "/pets/new");
});

it("REQ-LPAGE-012 visitante escolhe as datas sem 'Quem vai' e pedir leva ao login de tutor, voltando à página", () => {
  render({ pets: null, petIds: [], search: "where=Zona+7&from=2026-12-20&to=2026-12-25" });
  expect(screen.queryByText("Quem vai")).not.toBeInTheDocument();
  expect(screen.getByText(/Pra pedir, você entra com sua conta de tutor/)).toBeVisible();
  for (const link of screen.getAllByRole("link", { name: "Pedir estadia" })) {
    const url = new URL(link.getAttribute("href")!, "http://test");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("as")).toBe("owner");
    expect(url.searchParams.get("next")).toBe(`/listings/${LISTING}?where=Zona+7&from=2026-12-20&to=2026-12-25`);
  }
});
