import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { petProfileValuesFixture } from "@/test/fixtures/pets";
import { PetProfileCard } from "./PetProfileCard";
it("REQ-PNEW-013 carteirinha só mostra respostas conhecidas e foto decorativa", () => {
  renderWithProviders(
    <PetProfileCard
      values={{ name: "Mel", species: "cat" }}
      coverUrl="https://images.example.test/mel.jpg"
      now={new Date("2026-10-14")}
    />,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("article", { name: "Carteirinha de Mel" })).toHaveTextContent("Gato");
  expect(screen.queryByText("Saúde")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute("alt", "");
});
it("REQ-PNEW-013/015 convivência não é escondida quando a resposta é Não e edição indica o passo", async () => {
  const edit = vi.fn();
  const { user } = renderWithProviders(
    <PetProfileCard values={petProfileValuesFixture} coverUrl={null} now={new Date("2026-10-14")} onEdit={edit} />,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("article")).toHaveTextContent("Com gatos:Não");
  await user.click(screen.getByRole("button", { name: "Editar Saúde" }));
  expect(edit).toHaveBeenCalledWith(4);
});
