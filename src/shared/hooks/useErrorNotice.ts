"use client";

import { useState } from "react";
import { ApiError, isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { useCountdown } from "@/shared/hooks/useCountdown";

type ErrorNotice = { kind: "error"; message: string } | { kind: "rateLimited"; error: ApiError };

/**
 * Aviso de erro do topo de um formulário (specs 013 a 015): `429` vira contagem que trava o envio
 * (REQ-PWD-012, REQ-ACC-028); rede e desconhecido viram a frase genérica, sem apagar o que foi digitado.
 * Os erros que cada tela trata de outro jeito (campo, link vencido, trava) não passam por aqui.
 *
 * @returns `message` (ou `null`), `tone`, `blocked` (contagem correndo), `report(error)` e `clear()`.
 * @example const notice = useErrorNotice(); mutation.mutate(values, { onError: notice.report });
 */
export function useErrorNotice() {
  const [notice, setNotice] = useState<ErrorNotice | null>(null);
  const countdown = useCountdown();

  function report(error: unknown) {
    if (isApiError(error) && error.code === "TOO_MANY_REQUESTS") {
      countdown.start(error.retryAfterSeconds ?? 30);
      return setNotice({ kind: "rateLimited", error });
    }
    // Falha do próprio front (bug), não da API: aparece no console em desenvolvimento.
    if (!isApiError(error) && process.env.NODE_ENV !== "production")
      console.error("[formulário] falha inesperada", error);
    setNotice({ kind: "error", message: translateError(error) });
  }

  // Fim da contagem do limite: o aviso some e o envio volta.
  const visible = notice?.kind === "rateLimited" && !countdown.isRunning ? null : notice;

  return {
    message: !visible
      ? null
      : visible.kind === "rateLimited"
        ? translateError(new ApiError({ ...visible.error.toJSON(), retryAfterSeconds: countdown.remaining }))
        : visible.message,
    tone: visible?.kind === "rateLimited" ? ("atencao" as const) : ("erro" as const),
    blocked: countdown.isRunning,
    report,
    clear: () => setNotice(null),
  };
}
