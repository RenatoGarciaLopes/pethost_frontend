"use client";
import { isApiError } from "@/shared/api/errors/ApiError";
import { appShellCopy } from "@/shared/config/appShellCopy";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
/** Erro de rota (REQ-SHELL-013): texto fixo, reset e traceId apenas de ApiError 5xx identificado.
 * Detalhes técnicos e digest de erros serializados não são apresentados.
 * @example <RouteError error={error} reset={reset} />
 */
export default function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  const traceId = isApiError(error) && error.status >= 500 && error.status < 600 ? error.traceId : undefined;
  return (
    <ErrorState
      title={appShellCopy.error.title}
      description={appShellCopy.error.description}
      onRetry={reset}
      traceId={traceId}
      headingComponent="h1"
    />
  );
}
