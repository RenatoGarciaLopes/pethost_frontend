import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";

/** Painel do admin, fora de `/admin/login`, confirmado pela API (REQ-SHELL-011) (spec 004, REQ-SHELL-010). A casca entra na T7. */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={"admin"}>{children}</RoleGate>;
}
