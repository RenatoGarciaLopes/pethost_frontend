import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { HomeScreen, type HomeScreenProps } from "./HomeScreen";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

const petOptions = [
  { id: "pet-pipoca", name: "Pipoca", species: "dog" },
  { id: "pet-tico", name: "Tico", species: "cat" },
];

function renderHome(overrides: Partial<HomeScreenProps> = {}) {
  navigation.push.mockReset();
  return renderWithProviders(<HomeScreen viewer="visitor" pets={[]} petsUnavailable={false} {...overrides} />, {
    theme: quintalTheme,
  });
}

it("REQ-HOME-002 visitante prepara a busca por espécie e segue pelo login com os parâmetros", async () => {
  const { user } = renderHome();
  expect(screen.getByRole("heading", { name: "Um quintal pro seu pet enquanto você viaja." })).toBeVisible();
  expect(screen.getByText("Entre para ver os cantinhos disponíveis.")).toBeVisible();

  await user.type(screen.getByRole("textbox", { name: "Onde" }), "Zona 7");
  fireEvent.change(screen.getByLabelText("Chegada"), { target: { value: "2026-11-01" } });
  fireEvent.change(screen.getByLabelText("Saída"), { target: { value: "2026-11-05" } });
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "Cão" }));
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));

  expect(navigation.push).toHaveBeenCalledWith(
    "/login?next=%2Fsearch%3Fwhere%3DZona%2B7%26from%3D2026-11-01%26to%3D2026-11-05%26species%3Ddog",
  );
});

it("REQ-HOME-002 tutor sem pet pode escolher espécie e vai direto à busca", async () => {
  const { user } = renderHome({ viewer: "owner" });
  expect(screen.getByText("Você pode buscar antes de cadastrar seu pet.")).toBeVisible();
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "Gato" }));
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(navigation.push).toHaveBeenCalledWith("/search?species=cat");
});

it("REQ-HOME-003 tutor com pets começa personalizado e manda só os ids selecionados", async () => {
  const { user } = renderHome({ viewer: "owner", pets: petOptions });
  expect(screen.getByRole("heading", { name: "Um quintal pra Pipoca enquanto você viaja." })).toBeVisible();
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "Tico" }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("heading", { name: "Um quintal pros seus pets enquanto você viaja." })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(navigation.push).toHaveBeenCalledWith("/search?pets=pet-pipoca&pets=pet-tico");
});

it("REQ-HOME-004 anfitrião escolhe quantidade sem consultar pets da casa", async () => {
  const { user } = renderHome({ viewer: "host" });
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "3 pets" }));
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(navigation.push).toHaveBeenCalledWith("/search?pets=3");
});

it("REQ-HOME-006 no celular a pílula expande e anuncia os campos", async () => {
  const { user } = renderHome();
  const openSearch = screen.getByRole("button", { name: "Onde, datas e pet" });
  expect(openSearch).toHaveAttribute("aria-expanded", "false");
  await user.click(openSearch);
  expect(screen.getByRole("button", { name: "Fechar busca" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("textbox", { name: "Onde" })).toBeInTheDocument();
});

it("REQ-UIC-007 faixa única mostra datas legíveis e mantém quatro controles rotulados", () => {
  renderHome();
  const from = screen.getByLabelText("Chegada");
  const to = screen.getByLabelText("Saída");
  fireEvent.change(from, { target: { value: "2026-12-20" } });
  fireEvent.change(to, { target: { value: "2026-12-25" } });
  expect(screen.getByText("20 dez, a partir das 14h")).toBeVisible();
  expect(screen.getByText("25 dez · 5 noites")).toBeVisible();
  expect(from).toHaveValue("2026-12-20");
  expect(to).toHaveValue("2026-12-25");
  expect(screen.getByRole("textbox", { name: "Onde" })).toBeEnabled();
  expect(screen.getByRole("combobox", { name: "Pet" })).toBeEnabled();
});

it("REQ-UIC-007 pergunta de quantidade do anfitrião fica fora da faixa de busca", () => {
  renderHome({ viewer: "host" });
  expect(screen.getByRole("form", { name: "Busca de cantinhos" })).not.toContainElement(
    screen.getByText("Quantos pets viajam com você?"),
  );
});

it("REQ-UIC-007 teclado alcança as quatro células sem controles nativos de seleção extras", async () => {
  const { user } = renderHome();
  screen.getByRole("textbox", { name: "Onde" }).focus();
  await user.tab();
  expect(screen.getByLabelText("Chegada")).toHaveFocus();
  await user.tab();
  expect(screen.getByLabelText("Saída")).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("combobox", { name: "Pet" })).toHaveFocus();
});

it("REQ-HOME-009 falha ao carregar pets mantém espécie e alternativa de busca", () => {
  renderHome({ viewer: "owner", petsUnavailable: true });
  expect(screen.getByRole("status")).toHaveTextContent("Não conseguimos carregar seus pets agora.");
  expect(screen.getByRole("combobox", { name: "Pet" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Achar um cantinho" })).toBeEnabled();
});
