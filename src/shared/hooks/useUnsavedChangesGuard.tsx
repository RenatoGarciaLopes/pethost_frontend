"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { ConfirmDialog } from "../ui/feedback/ConfirmDialog";
import { unsavedChangesGuardCopy as copy } from "./unsavedChangesGuardCopy";

/** Destino interno do clique (caminho, busca e âncora), ou `null` quando o navegador deve seguir sozinho. */
function internalHrefOf(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return null;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  // Âncora na própria página não sai da seção.
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

function warnBeforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault();
  // Navegadores antigos só mostram o aviso nativo com `returnValue` preenchido.
  event.returnValue = "";
}

/**
 * Pergunta "Sair sem salvar?" quando a pessoa tenta deixar uma seção com alteração não salva (spec 022,
 * REQ-PEDIT-017). Enquanto `dirty`:
 * - fechar a aba ou recarregar mostra o aviso nativo do navegador (`beforeunload`);
 * - clique em link interno (mesma origem, botão esquerdo sem modificador, sem `target` externo nem `download`)
 *   é interceptado na fase de captura e abre o `ConfirmDialog`; "Sair sem salvar" segue com `router.push`,
 *   "Continuar editando" (ação segura, com o foco) fica.
 *
 * Fica de fora o botão voltar do navegador: o App Router não oferece bloqueio dessa navegação sem gambiarra
 * (reescrever o histórico), então ela passa sem perguntar. Também não cobre navegação feita por código
 * (`router.push` da própria tela): quem navega por código sabe se há alteração.
 *
 * Quando não usar: formulário de um passo só, que salva ao continuar.
 *
 * @returns `dialog`, o elemento da pergunta, para a tela renderizar.
 * @example
 * const { dialog } = useUnsavedChangesGuard(form.formState.isDirty);
 * return <form>{fields}{dialog}</form>;
 */
export function useUnsavedChangesGuard(dirty: boolean): { dialog: ReactElement } {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;
    function interceptLink(event: MouseEvent) {
      const href = internalHrefOf(event);
      if (href === null) return;
      // Antes do `Link` do Next: nem o navegador nem o roteador seguem.
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", interceptLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", interceptLink, true);
    };
  }, [dirty]);

  const dialog = (
    <ConfirmDialog
      open={pendingHref !== null}
      title={copy.title}
      message={copy.message}
      confirmLabel={copy.leave}
      cancelLabel={copy.stay}
      onConfirm={() => {
        if (pendingHref !== null) router.push(pendingHref);
        setPendingHref(null);
      }}
      onCancel={() => setPendingHref(null)}
    />
  );
  return { dialog };
}
