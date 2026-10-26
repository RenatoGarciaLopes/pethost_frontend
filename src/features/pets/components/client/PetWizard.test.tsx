import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { renderWithProviders } from "@/test/render";
import { petProfileValuesFixture } from "@/test/fixtures/pets";
import { petDraftKey } from "../../lib/petDraft";
import { ageBucketToBirthDate } from "../../lib/ageBucketToBirthDate";
import type { PetSpecies } from "../../types";
import { PetWizardProvider } from "../../stores/PetWizardProvider";
import { PetWizard } from "./PetWizard";
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
beforeEach(() => sessionStorage.clear());
function setup(step = 1, values: object = {}, initialSpecies?: PetSpecies) {
  if (step !== 1) sessionStorage.setItem(petDraftKey("test"), JSON.stringify({ step, values }));
  return renderWithProviders(
    <AnnouncerProvider>
      <PetWizardProvider initialSpecies={initialSpecies}>
        <PetWizard accountId="test" />
      </PetWizardProvider>
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
}
const next = () => screen.getByRole("button", { name: "Continuar" });
it("REQ-PNEW-002/014 espécie inicial marcada; nome obrigatório recebe foco e voltar não valida", async () => {
  const { user } = setup(1, {}, "dog");
  expect(screen.getByRole("radio", { name: "Cachorro" })).toBeChecked();
  await user.click(next());
  await user.click(next());
  expect(await screen.findByText("Falta o nome do pet.")).toBeVisible();
  expect(screen.getByLabelText(/^Nome/)).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Que bicho é o seu?");
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(push).toHaveBeenCalledWith("/pets");
}, 15_000);
it("REQ-PNEW-014 espécie sem resposta foca a primeira opção", async () => {
  const { user } = setup();
  await user.click(next());
  expect(await screen.findByText("Escolhe que bicho é o seu.")).toBeVisible();
  expect(screen.getByRole("radio", { name: "Cachorro" })).toHaveFocus();
}, 15_000);
it("REQ-PNEW-003 exótico pede descrição antes de avançar", async () => {
  const { user } = setup(1, {}, "exotic");
  await user.click(next());
  expect(await screen.findByText("Conta que bicho é o seu.")).toBeVisible();
  expect(screen.getByLabelText(/^Que bicho é\?/)).toHaveFocus();
  await user.type(screen.getByLabelText(/^Que bicho é\?/), "Iguana verde");
  await user.click(next());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Como seu pet se chama?");
}, 15_000);
it.each(["dog", "cat", "rabbit"] as const)(
  "REQ-PNEW-004 porte aparece apenas para cachorro: %s",
  async (species) => {
    const { user } = setup(3, { species, name: "Mel", sex: "unknown" });
    await screen.findByRole("heading", { name: "Sobre o corpo de Mel" });
    if (species === "dog") {
      await user.click(next());
      expect(await screen.findByText("Escolhe o porte do cachorro.")).toBeVisible();
      expect(screen.getByRole("radio", { name: "Pequeno (P)" })).toHaveFocus();
      await user.click(screen.getByRole("radio", { name: "Pequeno (P)" }));
    } else expect(screen.queryByRole("radiogroup", { name: "Porte" })).not.toBeInTheDocument();
    await user.click(next());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Saúde");
  },
  15_000,
);
it("REQ-PNEW-005 trocar cachorro por coelho poda porte e mostra dica", async () => {
  const { user } = setup(3, petProfileValuesFixture);
  await screen.findByRole("heading", { name: "Sobre o corpo de Mel" });
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  await user.click(screen.getByRole("radio", { name: "Coelho" }));
  await user.click(next());
  expect(screen.getByText("O porte saiu: esse bicho não tem porte.")).toBeVisible();
  await user.click(next());
  expect(screen.queryByRole("radiogroup", { name: "Porte" })).not.toBeInTheDocument();
}, 15_000);
it("REQ-PNEW-009 peso com texto inválido não é descartado silenciosamente", async () => {
  const { user } = setup(3, { species: "cat", name: "Mel", sex: "unknown" });
  await screen.findByLabelText("Peso aproximado (kg)");
  await user.type(screen.getByLabelText("Peso aproximado (kg)"), "abc");
  await user.click(next());
  expect(
    await screen.findByText("O peso precisa ser maior que zero, até 150 kg, com até 3 casas decimais."),
  ).toBeVisible();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sobre o corpo de Mel");
}, 15_000);
it("REQ-PNEW-009 gramas e faixa de idade ficam convertidos ao voltar", async () => {
  const { user } = setup(3, { species: "hamster", name: "Mel", sex: "unknown" });
  await screen.findByLabelText("Peso aproximado (g)");
  await user.type(screen.getByLabelText("Peso aproximado (g)"), "35");
  await user.click(screen.getByRole("radio", { name: "Filhote" }));
  await user.click(next());
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(screen.getByLabelText("Peso aproximado (g)")).toHaveValue("35");
  expect(screen.getByLabelText("Data de nascimento")).toHaveValue(
    ageBucketToBirthDate("puppy", new Date()).split("-").reverse().join("/"),
  );
}, 15_000);
it("REQ-PNEW-010 Sim/Não são obrigatórios e toggles revelam e apagam os textos", async () => {
  const { user } = setup(4, { species: "cat", name: "Mel", sex: "female" });
  await screen.findByRole("heading", { name: "Saúde" });
  await user.click(next());
  expect(await screen.findAllByText("Marca Sim ou Não.")).toHaveLength(2);
  const vaccinated = within(screen.getByRole("radiogroup", { name: "Está com as vacinas em dia?" }));
  expect(vaccinated.getByRole("radio", { name: "Sim" })).toHaveFocus();
  await user.click(vaccinated.getByRole("radio", { name: "Não" }));
  await user.click(within(screen.getByRole("radiogroup", { name: "É castrado?" })).getByRole("radio", { name: "Sim" }));
  await user.click(screen.getByRole("switch", { name: "Toma algum remédio?" }));
  await user.click(screen.getByLabelText("Qual remédio e como dar"));
  await user.paste("Uma gota");
  await user.click(screen.getByRole("switch", { name: "Tem alguma alergia?" }));
  await user.click(screen.getByLabelText("Alergias"));
  await user.paste("Frango");
  await user.click(screen.getByRole("switch", { name: "Toma algum remédio?" }));
  await user.click(next());
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(screen.queryByLabelText("Qual remédio e como dar")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Alergias")).toHaveValue("Frango");
}, 15_000);
it("REQ-PNEW-011/012 chips inserem sem repetir e convivência exige três respostas", async () => {
  const { user } = setup(5, petProfileValuesFixture);
  await screen.findByRole("heading", { name: "Rotina e manias" });
  const feeding = screen.getByRole("group", { name: "Atalhos de alimentação" });
  const habits = screen.getByRole("group", { name: "Atalhos de manias" });
  expect(within(feeding).queryByRole("button", { name: "medo de fogos" })).not.toBeInTheDocument();
  expect(within(habits).queryByRole("button", { name: "come 2× ao dia" })).not.toBeInTheDocument();
  const food = screen.getByLabelText("Alimentação");
  const notes = screen.getByLabelText("Manias e jeito de ser");
  await user.clear(food);
  await user.type(food, "Porção da manhã");
  await user.clear(notes);
  const chip = within(feeding).getByRole("button", {
    name: "come 2× ao dia",
  });
  await user.click(chip);
  await user.click(chip);
  expect(food).toHaveValue("Porção da manhã, come 2× ao dia");
  expect(notes).toHaveValue("");
  await user.click(within(habits).getByRole("button", { name: "medo de fogos" }));
  expect(notes).toHaveValue("medo de fogos");
  expect(food).toHaveValue("Porção da manhã, come 2× ao dia");
  await user.click(next());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Com quem Mel se dá bem?");
  // Rascunho sem respostas de convivência em outro render é coberto no próximo caso.
}, 15_000);
it("REQ-PNEW-012 convivência não inventa respostas", async () => {
  const { user } = setup(6, { species: "cat", name: "Mel", sex: "female", isVaccinated: false, isNeutered: false });
  await screen.findByRole("heading", { name: "Com quem Mel se dá bem?" });
  await user.click(next());
  expect(await screen.findAllByText("Marca Sim ou Não.")).toHaveLength(3);
  for (const label of ["Com cachorros", "Com gatos", "Com crianças"])
    await user.click(within(screen.getByRole("radiogroup", { name: label })).getByRole("radio", { name: "Não" }));
  await user.click(next());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Confere a ficha");
}, 15_000);
it("REQ-PNEW-015 Editar por bloco volta ao passo e retorna à revisão", async () => {
  const { user } = setup(7, petProfileValuesFixture);
  await screen.findByRole("heading", { name: "Confere a ficha" });
  expect(screen.getAllByRole("button", { name: /^Editar/ })).toHaveLength(6);
  await user.click(screen.getByRole("button", { name: "Editar Nome e fotos" }));
  await user.clear(screen.getByLabelText(/^Nome/));
  await user.type(screen.getByLabelText(/^Nome/), "Pipoca");
  await user.click(next());
  await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Confere a ficha"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar a ficha de Pipoca" })).toBeVisible());
}, 15_000);
