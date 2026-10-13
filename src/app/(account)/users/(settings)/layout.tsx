import type { ReactNode } from "react";
import { AccountSettingsLayout } from "@/features/account/index.server";

/** Perfil, senha e pausar conta (spec 015): a guarda de papel é a do layout `(account)`. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <AccountSettingsLayout>{children}</AccountSettingsLayout>;
}
