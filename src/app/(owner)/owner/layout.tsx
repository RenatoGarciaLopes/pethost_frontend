import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";
import { AppShell } from "@/widgets/app-shell/index.server";

/** Área só do tutor (`/owner/...`), confirmada pela API (spec 004, REQ-SHELL-010). Com a casca da conta (REQ-SHELL-001). */
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={"owner"}>{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>;
}
