"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { appShellCopy } from "@/shared/config/appShellCopy";
import { useInputModality } from "@/shared/hooks/useInputModality";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";
/** Último recurso se o layout raiz quebrar (REQ-SHELL-015), sem MUI, tema, fontes ou providers.
 * Recarrega o documento inteiro e não lê detalhes do erro.
 * @example <GlobalError /> // substitui o layout raiz pelo documento mínimo
 */
export default function GlobalError() {
  useInputModality();
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#FEFAF3", color: "#2F2017", fontFamily: "system-ui, sans-serif" }}>
        <style>{`:focus { outline: none; } ${keyboardFocus(":focus-visible")} { outline: ${focusRing.outline}; outline-offset: ${focusRing.outlineOffset}; }`}</style>
        <main
          style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" }}
        >
          <div role="alert" style={{ maxWidth: "32rem", textAlign: "center" }}>
            <h1>{appShellCopy.globalError.title}</h1>
            <p>{appShellCopy.globalError.description}</p>
            <button
              type="button"
              onClick={() => globalThis.location.reload()}
              style={{
                font: "inherit",
                padding: "12px 20px",
                border: "2px solid currentColor",
                borderRadius: `${quintalRadii.pill}px`,
                color: "inherit",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {appShellCopy.globalError.reload}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
