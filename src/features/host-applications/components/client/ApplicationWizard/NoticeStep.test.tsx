import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { verificationCopy as copy } from "../../../lib/verificationCopy";
import { NoticeStep, type NoticeStepProps } from "./NoticeStep";

function renderStep(props: Partial<NoticeStepProps> = {}) {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const view = renderWithProviders(
    <NoticeStep
      noticeVersion="2026-10-10"
      personType="pf"
      accepted={false}
      locked={false}
      onBack={onBack}
      onNext={onNext}
      {...props}
    />,
    { theme: quintalTheme },
  );
  return { ...view, onNext, onBack };
}

describe("NoticeStep", () => {
  it("REQ-HVER-003 mostra o aviso das fotos da versão vigente, uma linha por cartão, antes de pedir qualquer coisa", () => {
    renderStep();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([...copy.notice.versions["2026-10-10"]!]);
  });

  it("REQ-HVER-003 Voltar sai do assistente sem pedir nada", async () => {
    const { user, onBack, onNext } = renderStep();
    await user.click(screen.getByRole("button", { name: copy.notice.back }));
    expect(onBack).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("REQ-HVER-003 versão sem texto no front mostra o aviso mais recente", () => {
    renderStep({ noticeVersion: "2027-01-01" });
    expect(screen.getByText("Só a equipe da PetHost vê.")).toBeInTheDocument();
  });

  it("REQ-HVER-003 REQ-HVER-018 sem o 'Li e concordo' não avança; o erro diz o que falta e recebe o foco", async () => {
    const { user, onNext } = renderStep();
    await user.click(screen.getByRole("button", { name: copy.notice.next }));

    expect(onNext).not.toHaveBeenCalled();
    const checkbox = screen.getByRole("checkbox", { name: "Li e concordo" });
    expect(checkbox).toHaveFocus();
    expect(checkbox).toHaveAccessibleDescription(copy.notice.acceptMissing);
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
  });

  it("REQ-HVER-003 escolhe Pessoa física ou Empresa e segue com o aceite", async () => {
    const { user, onNext } = renderStep();
    await user.click(screen.getByRole("radio", { name: /^Empresa/ }));
    await user.click(screen.getByRole("checkbox", { name: "Li e concordo" }));
    await user.click(screen.getByRole("button", { name: copy.notice.next }));

    expect(onNext).toHaveBeenCalledWith({ acceptNotice: true, personType: "pj" });
  });

  it("REQ-HVER-003 com a verificação já aberta, o tipo fica travado e o aceite marcado", async () => {
    const { user, onNext } = renderStep({ personType: "pj", accepted: true, locked: true });
    expect(screen.getByRole("radio", { name: /^Pessoa física/ })).toBeDisabled();
    expect(screen.getByText(copy.notice.personTypeLocked)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Li e concordo" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: copy.notice.next }));
    expect(onNext).toHaveBeenCalledWith({ acceptNotice: true, personType: "pj" });
  });
});
