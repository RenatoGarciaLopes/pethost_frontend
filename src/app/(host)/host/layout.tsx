import type { ReactNode } from "react";
import { RoleGate } from "@/shared/auth/server/RoleGate";

/** Área do anfitrião (`/host/...`), confirmada pela API (spec 004, REQ-SHELL-010). A casca entra na T7. */
export default function HostLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={"host"}>{children}</RoleGate>;
}
