import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDetailFixture, listingPhotosFixture, listingReviewFixture } from "@/test/fixtures/listingPage";
import { renderWithProviders } from "@/test/render";
import { ListingPageScreen, type ListingPageStay } from "./ListingPageScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const stay: ListingPageStay = {
  today: "2026-12-01",
  search: "where=Zona+7&pets=pet-1&from=2026-12-20&to=2026-12-25",
  where: "Zona 7",
  from: "2026-12-20",
  to: "2026-12-25",
  petIds: ["pet-1"],
  pets: [{ id: "pet-1", name: "Pipoca", coverUrl: null }],
  closedPeriods: [],
};
const render = (ui: React.ReactElement) => renderWithProviders(ui, { theme: quintalTheme });

it.each(["owner", "host", "visitor"] as const)("contato em Quem cuida aparece só para tutor: %s", (accountRole) => {
  render(
    <ListingPageScreen
      listing={listingDetailFixture()}
      isOwner={false}
      accountRole={accountRole}
      reviews={[]}
      conversation={<button type="button">Conversar com anfitrião</button>}
    />,
  );
  const section = screen.getByRole("heading", { name: "Quem cuida" }).closest("section")!;
  if (accountRole === "owner")
    expect(within(section).getByRole("button", { name: "Conversar com anfitrião" })).toBeInTheDocument();
  else expect(screen.queryByRole("button", { name: "Conversar com anfitrião" })).not.toBeInTheDocument();
});

it("REQ-LPAGE-001/003/010 mostra a casa como na prancha, em português, sem rua e com as avaliações", () => {
  render(
    <ListingPageScreen
      listing={listingDetailFixture({ rating: { average: 4.9, count: 18 } })}
      isOwner={false}
      accountRole="owner"
      reviews={[listingReviewFixture()]}
      stay={stay}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Casa da Dona Cida" })).toBeVisible();
  expect(screen.getByText("Jd. Alvorada, Maringá · PR · casa com quintal · tem cachorro")).toBeVisible();
  expect(screen.getByText("O endereço chega quando a estadia for confirmada.", { exact: false })).toBeVisible();
  for (const label of ["Verificada", "Responde rápido", "Casa com quintal", "Experiente", "Vizinho"])
    expect(screen.getByText(label)).toBeVisible();
  expect(screen.queryByText(/neighbor|fast_responder/)).not.toBeInTheDocument();
  expect(screen.getByLabelText("Nota 4,9 em 18 avaliações")).toHaveTextContent("★ 4,9 (18)");
  expect(screen.getByText("As fotos da casa ainda estão chegando.")).toBeVisible();

  expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
    "Quem cuida",
    "Regras da casa",
    "O que os tutores contam",
  ]);
  const rules = screen.getByRole("heading", { name: "Regras da casa" }).parentElement!;
  expect(
    within(rules)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([
    "Pode subir no sofá, não na cama",
    "Buscar até as 18h",
    "Recebe cachorro e gato, de porte pequeno e médio",
    "Até 2 pets por vez",
    "Recebe nos dias: segunda, sexta e sábado",
  ]);
  const review = screen.getByRole("heading", { name: "O que os tutores contam" }).parentElement!;
  expect(review).toHaveTextContent("Marina");
  expect(review).toHaveTextContent("novembro de 2026");
  expect(within(review).getByRole("img", { name: "Nota 5 de 5" })).toHaveTextContent("★★★★★");
  expect(screen.getByText(/Aqui o pet fica solto no quintal/)).toBeVisible();
});

it("REQ-LPAGE-011 o voltar leva à home com a busca de origem, nunca a /search", () => {
  render(
    <ListingPageScreen listing={listingDetailFixture()} isOwner={false} accountRole="owner" reviews={[]} stay={stay} />,
  );
  expect(screen.getByRole("link", { name: "← Casas perto de Zona 7" })).toHaveAttribute("href", `/?${stay.search}`);
});

it("REQ-LPAGE-001 galeria com a capa primeiro e o selo Vizinho; sem avaliação, a seção some", () => {
  render(
    <ListingPageScreen
      listing={listingDetailFixture({ photos: [...listingPhotosFixture].reverse() })}
      isOwner={false}
      accountRole="owner"
      reviews={[]}
      stay={stay}
    />,
  );
  const gallery = screen.getByRole("list", { name: "Fotos de Casa da Dona Cida" });
  expect(
    within(gallery)
      .getAllByRole("img")
      .map((img) => img.getAttribute("alt")),
  ).toEqual(["Foto 1 de Casa da Dona Cida", "Foto 2 de Casa da Dona Cida", "Foto 3 de Casa da Dona Cida"]);
  expect(within(gallery).getAllByRole("listitem")[0]).toHaveTextContent("Vizinho");
  expect(screen.queryByRole("heading", { name: "O que os tutores contam" })).not.toBeInTheDocument();
});

it("REQ-LPAGE-005 a caixa de compatibilidade da rota aparece logo abaixo dos selos", () => {
  render(
    <ListingPageScreen
      listing={listingDetailFixture()}
      isOwner={false}
      accountRole="owner"
      reviews={[]}
      stay={stay}
      compatibility={<p>Caixa de compatibilidade</p>}
    />,
  );
  expect(screen.getByText("Caixa de compatibilidade")).toBeVisible();
});

it("REQ-LPAGE-003/006 só mostra a rua na visão da pessoa anfitriã dona do cantinho, sem pedir estadia", () => {
  const listing = listingDetailFixture({
    address: { neighborhood: "Jd. Alvorada", city: "Maringá", state: "PR", street: "Rua da Casa", number: "10" },
  });
  render(<ListingPageScreen listing={listing} isOwner accountRole="host" reviews={[]} />);
  expect(screen.getByText("Rua da Casa, 10")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("É assim que os tutores veem seu cantinho (sem a rua)");
  expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
    "href",
    "/host/listings/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c/edit",
  );
  expect(screen.queryByRole("link", { name: "Pedir estadia" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Voltar|Casas perto/ })).not.toBeInTheDocument();
});

it("REQ-LPAGE-007 outra conta de anfitrião vê o card de compra, e o pedir passa pela troca para a conta de tutor", () => {
  render(
    <ListingPageScreen
      listing={listingDetailFixture()}
      isOwner={false}
      accountRole="host"
      reviews={[]}
      stay={{ ...stay, search: "from=2026-12-20&to=2026-12-25", petIds: [], pets: [] }}
    />,
  );
  expect(screen.getByLabelText("Chegada e saída")).toBeVisible();
  expect(screen.queryByText("Quem vai se hospedar")).not.toBeInTheDocument();
  expect(screen.queryByText(/Pra pedir uma estadia|Trocar de conta/)).not.toBeInTheDocument();
  const url = new URL(screen.getAllByRole("link", { name: "Pedir estadia" })[0]!.getAttribute("href")!, "http://test");
  expect(url.pathname).toBe("/users/switch");
  expect(url.searchParams.get("to")).toBe("owner");
  expect(url.searchParams.get("next")).toBe(
    "/listings/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c?from=2026-12-20&to=2026-12-25",
  );
});

it("076 mant?m o nome exibido e usa iniciais sem observa??o no avatar humano", () => {
  const base = listingDetailFixture();
  const listing = { ...base, host: { ...base.host!, name: "Ana Souza (teste)", avatarUrl: null } };
  render(<ListingPageScreen listing={listing} isOwner={false} accountRole="owner" reviews={[]} stay={stay} />);
  expect(screen.getByText("AS")).toBeVisible();
  expect(screen.getByText("Ana Souza (teste)")).toBeVisible();
  expect(screen.queryByText("A(")).not.toBeInTheDocument();
});
