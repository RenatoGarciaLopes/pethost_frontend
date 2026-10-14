import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";
import { AppShell } from "@/widgets/app-shell/index.server";

/** Rotas das duas contas (`/pets`, `/users/...`, `/conversations`): tutor ou anfitrião, confirmados pela API (spec 004, REQ-SHELL-010). Com a casca da conta (REQ-SHELL-001). */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={["owner", "host"]}>{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>;
}
