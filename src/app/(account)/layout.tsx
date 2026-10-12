import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";

/** Rotas das duas contas (`/pets`, `/users/...`, `/conversations`): tutor ou anfitrião, confirmados pela API (spec 004, REQ-SHELL-010). A casca entra na T7. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={["owner", "host"]}>{children}</RoleGate>;
}
