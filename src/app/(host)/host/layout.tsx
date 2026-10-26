import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";
import { AppShell } from "@/widgets/app-shell/index.server";

/** Área do anfitrião (`/host/...`), confirmada pela API (spec 004, REQ-SHELL-010). Com a casca da conta (REQ-SHELL-001). */
export default function HostLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={"host"}>{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>;
}
