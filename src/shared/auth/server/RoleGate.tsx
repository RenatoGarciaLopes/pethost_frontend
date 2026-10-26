import "server-only";
import { Box } from "@mui/material";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import type { AccountRole, SessionUser } from "../contracts/session";
import { requireRole } from "./requireRole";

export interface RoleGateProps {
  /** Papel ou papéis aceitos na área. */
  roles: AccountRole | readonly AccountRole[];
  /** A área; como função, recebe a conta confirmada (a casca usa para o cabeçalho e o menu). */
  children: ReactNode | ((user: SessionUser) => ReactNode);
}

/**
 * Guarda de área para layouts (spec 004, REQ-SHELL-010): confirma o papel pela API e só então
 * renderiza a área. Com Cache Components, a leitura de cookie fica dentro de `<Suspense>`,
 * com o loader da marca enquanto confere.
 *
 * @example export default function HostLayout({ children }) { return <RoleGate roles="host">{children}</RoleGate>; }
 * @example <RoleGate roles="host">{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>
 */
export function RoleGate({ roles, children }: RoleGateProps) {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "60dvh", display: "grid", placeItems: "center" }}>
          <SniffLoader />
        </Box>
      }
    >
      <ConfirmedArea roles={roles}>{children}</ConfirmedArea>
    </Suspense>
  );
}

async function ConfirmedArea({ roles, children }: RoleGateProps) {
  await connection();
  const user = await requireRole(roles);
  return typeof children === "function" ? children(user) : children;
}
