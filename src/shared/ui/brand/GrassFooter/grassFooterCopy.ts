import { LOGIN_PATH, registerPath } from "@/shared/config/appRoutes";

/** Conteúdo editorial e destinos existentes do rodapé público. */
export const grassFooterCopy = {
  brand: "PetHost",
  tagline: "Um cantinho de confiança para quem faz parte da família.",
  navigation: "Navegue",
  contact: "Fale com a gente",
  rights: "PetHost. Todos os direitos reservados.",
  links: [
    { label: "Início / Buscar", href: "/" },
    { label: "Como funciona", href: "/#como-funciona" },
    { label: "Abrir meu cantinho", href: registerPath("host") },
    { label: "Entrar", href: LOGIN_PATH },
    { label: "Criar conta", href: registerPath("owner") },
  ],
} as const;
