"use client";
import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { maskCpf, maskCnpj } from "@/shared/lib/masks";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { toAccountRow, type AccountSource } from "../lib/accountRows";
import { accountsCopy as copy } from "../lib/accountsCopy";
/** Dados pessoais só no detalhe; CPF/CNPJ completos exigem ação e não são persistidos.
 * Monte com key do recurso ao trocar de conta para voltar a ocultar os documentos.
 * @example <AccountSummary key={owner.id} source={{ kind: "owners", value: owner }} />
 */
export function AccountSummary({ source }: { source: AccountSource }) {
  const [showCpf, setShowCpf] = useState(false);
  const [showCnpj, setShowCnpj] = useState(false);
  const row = toAccountRow(source);
  const data = source.value;
  const user = data.user;
  const pairs: [string, string | null | undefined][] = [
    [copy.name, user?.fullName],
    [copy.email, user?.email],
    [
      copy.cpf,
      row.cpfDigits ? (showCpf ? maskCpf(row.cpfDigits) : `***.***.***-${row.cpfDigits.slice(-2)}`) : copy.unavailable,
    ],
    [copy.phone, user?.phone],
    [copy.birth, user?.birthDate],
    [copy.address, user?.address ? Object.values(user.address).filter(Boolean).join(", ") : undefined],
    [copy.created, new Date(data.createdAt).toLocaleString("pt-BR")],
  ];
  if (data.suspendedAt || user?.suspendedAt)
    pairs.push(
      [copy.suspendedAt, new Date(data.suspendedAt ?? user!.suspendedAt!).toLocaleString("pt-BR")],
      [copy.suspensionReason, user?.suspensionReason],
    );
  if (source.kind === "hosts") {
    const host = source.value;
    pairs.push(
      [copy.personType, copy.person[host.personType]],
      [copy.verified, new Date(host.verifiedAt).toLocaleString("pt-BR")],
      [copy.stripeLabel, copy.stripe[host.stripeStatus]],
      [copy.receives, host.stripePayoutsEnabled ? copy.yes : copy.no],
    );
    if (host.identityReleasedAt)
      pairs.push([copy.releasedAt, new Date(host.identityReleasedAt).toLocaleString("pt-BR")]);
    if (host.company)
      pairs.push(
        [copy.cnpj, showCnpj ? maskCnpj(host.company.cnpj) : `**.***.***/****-${host.company.cnpj.slice(-2)}`],
        [copy.legalName, host.company.legalName],
        [copy.tradeName, host.company.tradeName],
        [copy.address + " (" + copy.company + ")", Object.values(host.company.address).filter(Boolean).join(", ")],
      );
  }
  return (
    <Stack spacing={2} component="section" aria-label={copy.details}>
      <Typography component="h1" variant="h4">
        {row.fullName}
      </Typography>
      <StatusPill label={copy.status[row.status]} />
      <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        {pairs.map(([label, value]) => (
          <Box key={label}>
            <Typography component="dt" sx={{ fontWeight: 700 }}>
              {label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>
              {value || copy.unavailable}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {row.cpfDigits && (
          <Button onClick={() => setShowCpf((value) => !value)}>{showCpf ? copy.hideCpf : copy.showCpf}</Button>
        )}
        {row.cnpj && (
          <Button onClick={() => setShowCnpj((value) => !value)}>{showCnpj ? copy.hideCnpj : copy.showCnpj}</Button>
        )}
      </Box>
    </Stack>
  );
}
