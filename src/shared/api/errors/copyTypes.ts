import type { ErrorParams } from "../contracts/envelope";

/** Contexto opcional que muda a frase (ex.: o tipo de conta da tela). */
export interface ErrorCopyContext {
  role?: "owner" | "host";
  /** Orientação para a equipe ao decidir verificação; preserva a copy pessoal fora do admin. */
  adminReview?: boolean;
  /** Copy contextual para a gestão de contas, sem alterar a mensagem pessoal da área logada. */
  adminAccounts?: boolean;
}

/** O que uma frase dinâmica recebe: os `params` do código, o contexto da tela e o `Retry-After` (429). */
export interface CopyInput {
  params: ErrorParams;
  context: ErrorCopyContext;
  retryAfterSeconds?: number;
}

/** Frase fixa ou função dos dados do erro. */
export type CopyEntry = string | ((input: CopyInput) => string);

/** Catálogo de um domínio: código da API → frase. Cada arquivo de `copy/` exporta um e `errorCopy` compõe todos. */
export type CopyCatalog = Record<string, CopyEntry>;
