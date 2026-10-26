/** Canal público aprovado da PetHost. Nunca preencher com dados presumidos. */
export interface ContactChannel {
  readonly label: string;
  readonly href: `mailto:${string}` | `tel:${string}` | `https://${string}`;
}

/** Fonte única dos contatos públicos. Lista vazia até aprovação dos dados pelo responsável. */
export const CONTACT_CHANNELS: readonly ContactChannel[] = [];
