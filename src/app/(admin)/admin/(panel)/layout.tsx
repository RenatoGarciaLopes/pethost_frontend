import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";
import { AppShell } from "@/widgets/app-shell/index.server";

/** Painel do admin, fora de `/admin/login`, confirmado pela API (REQ-SHELL-011) (spec 004, REQ-SHELL-010). Com a casca da conta (REQ-SHELL-001). */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={"admin"}>{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>;
}
