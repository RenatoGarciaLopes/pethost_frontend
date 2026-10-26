"use client";

import { useEffect, useRef, useState } from "react";
import type { AccountRole } from "@/shared/auth/contracts/session";
import type { ForgotPasswordValues } from "../../schemas/forgotPasswordSchema";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetLinkSent } from "./ResetLinkSent";

export interface ForgotPasswordFlowProps {
  /** Conta marcada ao abrir (`?as=`); `admin` esconde a escolha (REQ-PWD-001). */
  initialRole: AccountRole;
}

/** Pedido (formulário) ou link enviado, com o que foi pedido para reenviar. */
type Stage = { step: "request"; role: AccountRole } | { step: "sent"; values: ForgotPasswordValues };

/**
 * Esqueci a senha (spec 013): pedir o link e, com o `200`, a mesma tela neutra para qualquer e-mail
 * (REQ-PWD-002, 003). Cada etapa é um componente; trocar de etapa leva o foco ao título novo.
 *
 * @example <ForgotPasswordFlow initialRole="host" />
 */
export function ForgotPasswordFlow({ initialRole }: ForgotPasswordFlowProps) {
  const [stage, setStage] = useState<Stage>({ step: "request", role: initialRole });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const changedStep = useRef(false);

  // Foco no título só depois de uma troca de etapa (na primeira renderização o foco fica onde está).
  useEffect(() => {
    if (changedStep.current) headingRef.current?.focus();
    changedStep.current = true;
  }, [stage.step]);

  return stage.step === "request" ? (
    <ForgotPasswordForm
      headingRef={headingRef}
      initialRole={stage.role}
      onSent={(values) => setStage({ step: "sent", values })}
    />
  ) : (
    <ResetLinkSent
      headingRef={headingRef}
      values={stage.values}
      onUseOtherEmail={() => setStage({ step: "request", role: stage.values.role })}
    />
  );
}
