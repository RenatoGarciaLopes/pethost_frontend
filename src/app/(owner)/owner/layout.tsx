import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";

/** Área só do tutor (`/owner/...`), confirmada pela API (spec 004, REQ-SHELL-010). A casca entra na T7. */
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={"owner"}>{children}</RoleGate>;
}
