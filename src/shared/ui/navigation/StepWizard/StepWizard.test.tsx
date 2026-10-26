import { screen, within } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { StepWizard, StepWizardActions } from "./StepWizard";

const steps = [
  { id: "you", label: "Você", description: "Nome e contato" },
  { id: "address", label: "Onde você mora" },
  { id: "pet", label: "Seu pet" },
];

function renderWizard(props: Partial<Parameters<typeof StepWizard>[0]> = {}) {
  return renderWithProviders(
    <StepWizard
      steps={steps}
      currentIndex={1}
      progressTitle="Criar conta"
      progressLabel="Etapas do cadastro"
      position="Passo 2 de 3"
      title="Onde você mora"
      {...props}
    >
      <p>conteúdo do passo</p>
    </StepWizard>,
    { theme: quintalTheme },
  );
}

describe("StepWizard", () => {
  it("REQ-DS-012 mostra o passo atual na trilha, a posição por extenso, o título e o conteúdo", () => {
    renderWizard();
    const items = within(screen.getByRole("navigation", { name: "Etapas do cadastro" })).getAllByRole("listitem");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).toHaveTextContent("Nome e contato");
    expect(screen.getByText("Passo 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Onde você mora" })).toBeInTheDocument();
    expect(screen.getByText("conteúdo do passo")).toBeInTheDocument();
  });

  it("REQ-DS-012 o título aceita foco por ref (o assistente foca ao trocar de passo) e a frase de apoio, o aviso e o rodapé são opcionais", () => {
    const titleRef = createRef<HTMLHeadingElement>();
    const { rerender } = renderWizard({ titleRef });
    titleRef.current?.focus();
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    expect(screen.queryByText("apoio")).not.toBeInTheDocument();

    rerender(
      <StepWizard
        steps={steps}
        currentIndex={1}
        progressTitle="Criar conta"
        position="Passo 2 de 3"
        title="Onde você mora"
        intro="apoio"
        notice={<p role="alert">aviso</p>}
        footer={<p>rodapé</p>}
      >
        <p>conteúdo do passo</p>
      </StepWizard>,
    );
    expect(screen.getByText("apoio")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("aviso");
    expect(screen.getByText("rodapé")).toBeInTheDocument();
  });

  it("REQ-DS-012 trocar de passo troca o título e a posição sem perder a trilha", () => {
    const { rerender } = renderWizard({ currentIndex: 0, position: "Passo 1 de 3", title: "Você" });
    expect(screen.getByRole("heading", { level: 1, name: "Você" })).toBeInTheDocument();
    rerender(
      <StepWizard steps={steps} currentIndex={2} progressTitle="Criar conta" position="Passo 3 de 3" title="Seu pet">
        <p>outro</p>
      </StepWizard>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Seu pet" })).toBeInTheDocument();
    expect(screen.getByText("Passo 3 de 3")).toBeInTheDocument();
    expect(screen.getByRole("navigation").querySelector('[aria-current="step"]')).toHaveTextContent("Seu pet");
  });
});

describe("StepWizardActions", () => {
  it("REQ-DS-012 Voltar e Continuar chamam o que o passo definiu", async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const { user } = renderWithProviders(
      <StepWizardActions backLabel="Voltar" nextLabel="Continuar: fotos" onBack={onBack} onNext={onNext} />,
      { theme: quintalTheme },
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(screen.getByRole("button", { name: "Continuar: fotos" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("REQ-DS-012 o motivo do bloqueio desabilita o Continuar e fica associado ao botão", () => {
    renderWithProviders(
      <StepWizardActions
        backLabel="Voltar"
        nextLabel="Continuar"
        onBack={vi.fn()}
        onNext={vi.fn()}
        disabledReason="Falta a frente."
      />,
      { theme: quintalTheme },
    );
    const next = screen.getByRole("button", { name: "Continuar" });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription("Falta a frente.");
  });
});

describe("StepWizard com aside", () => {
  it("104 a terceira coluna mostra o resultado ao lado sem mudar o passo", () => {
    renderWizard({ aside: <aside aria-label="Prévia">card ao vivo</aside> });
    expect(screen.getByRole("complementary", { name: "Prévia" })).toHaveTextContent("card ao vivo");
    expect(screen.getByRole("heading", { level: 1, name: "Onde você mora" })).toBeInTheDocument();
  });
});
