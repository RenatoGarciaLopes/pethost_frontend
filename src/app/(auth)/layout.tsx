import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Telas de conta (entrar, criar conta, senha): sem atalhos de navegação e fora dos buscadores. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
