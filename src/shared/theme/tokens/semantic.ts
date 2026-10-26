import type { AccountRole } from "@/shared/auth/contracts/session";
import { quintalColors as c } from "./colors";

/**
 * Cores derivadas da paleta Quintal, com um papel fixo na interface.
 * Fonte: vault `design/09-componentes-mui.md`, `design/21-mapa-de-telas.md`, `design/06-movimento.md` e `design/10-hero.md`.
 * Componentes leem pelo tema (`theme.palette.account`, `theme.palette.scene`), nunca pelo hex.
 */

/** Superfícies: página em papel, papel (MUI `paper`) branco, painel em cartão. */
export const surfaceColors = {
  page: c.papel,
  paper: "#FFFFFF",
  panel: c.cartao,
} as const;

/** Iniciais humanas: branco AA mesmo em 14px. Coral recomendado; café para revisão visual (076). */
export const avatarTones = {
  coral: { background: "#B6533A", foreground: surfaceColors.paper },
  earth: { background: c.texto2, foreground: surfaceColors.paper },
} as const;
/**
 * Tom do cabeçalho por conta (REQ-SHELL-001). Ajuda quem tem conta de tutor e de anfitrião
 * a saber onde está. Visitante usa o mesmo tom do tutor.
 */
export const accountTones: Readonly<Record<AccountRole | "visitor", string>> = {
  visitor: c.papel,
  owner: c.papel,
  host: "#EEF3D6",
  admin: "#EDE6DA",
};

/** Peças de marca: a luz da porta respira entre `doorLight` e `doorGlow` (3,6 s). */
export const sceneColors = {
  doorLight: c.luz,
  doorGlow: "#FFD86B",
  /** Degradê do céu da cena, de cima para baixo. */
  skyTop: "#D7ECF1",
  skyMiddle: "#EAF2E6",
  skyBottom: "#F5F0DD",
  /** Gramado amplo e suave da prancha; seleção/feedback conserva quintal.grama. */
  ground: "#CFE3A0",
  /** Camadas de terra do rodapé de gramado, da mais clara (logo abaixo da grama) à mais escura (fim da página). */
  soilLight: "#E2C99E",
  soilMid: "#C09566",
  /** Última camada, contínua sob o conteúdo: papel e indicadores coral passam AA. */
  soilDeep: "#493323",
  /** Pedrinhas do rodapé, mais claras que a terra para aparecerem no traço de tinta. */
  stone: "#F1E3C6",
} as const;

/** Mapeamento de feedback do MUI para a paleta (aviso nunca é vermelho; erro tem cor própria). */
export const feedbackColors = {
  success: c.grama,
  info: c.ceu,
  warning: c.gema,
  error: c.erro,
} as const;
