"use client";
import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { maskCpf, maskCnpj } from "@/shared/lib/masks";
import { Surface } from "@/shared/ui/layout/Surface";
import { adminReviewCopy as copy, type AdminApplication } from "@/features/admin-host-applications";
/** Dados enviados e dados da conta lado a lado, numa caixa (spec 005, REQ-UIC-002); CPF completo só sob ação local.
 * @example <ApplicantComparison application={application} />
 */
export function ApplicantComparison({ application: app }: { application: AdminApplication }) {
  const [showCpf, setShowCpf] = useState(false);
  const account = app.user;
  const address = (value: NonNullable<typeof account>["address"]) =>
    value ? Object.values(value).filter(Boolean).join(", ") : copy.unavailable;
  const sent = [
    [copy.cpf, showCpf ? maskCpf(app.cpf) : `***.***.***-${app.cpf.slice(-2)}`],
    [copy.type, copy.person[app.personType]],
    [copy.document, app.documentType.toUpperCase()],
    [copy.attempt, String(app.attemptNumber)],
    [copy.notice, app.noticeVersion],
    [copy.accepted, new Date(app.noticeAcceptedAt).toLocaleString("pt-BR")],
    ...(app.company
      ? [
          [copy.cnpj, maskCnpj(app.company.cnpj)],
          [copy.legalName, app.company.legalName],
          [copy.tradeName, app.company.tradeName],
          [copy.address, address(app.company.address)],
        ]
      : []),
  ];
  const registered = [
    [copy.name, account?.fullName],
    [copy.birth, account?.birthDate],
    [copy.email, account?.email],
    [copy.phone, account?.phone],
    [copy.address, address(account?.address)],
  ];
  return (
    <Surface
      elevation="md"
      sx={{ p: { xs: 2, md: 3 }, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}
    >
      {[
        [copy.sent, sent],
        [copy.account, registered],
      ].map(([title, pairs]) => (
        <Stack key={String(title)} component="section" spacing={1}>
          <Typography component="h2" variant="overline">
            {title as string}
          </Typography>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: "grid",
              gridTemplateColumns: "minmax(110px, auto) minmax(0, 1fr)",
              columnGap: 2,
              rowGap: 1,
            }}
          >
            {(pairs as (string | null | undefined)[][]).map(([label, value]) => (
              <Box key={label} sx={{ display: "contents" }}>
                <Typography component="dt" color="text.secondary">
                  {label}
                </Typography>
                <Typography component="dd" sx={{ m: 0, fontWeight: 700, overflowWrap: "anywhere" }}>
                  {value || copy.unavailable}
                </Typography>
              </Box>
            ))}
          </Box>
          {title === copy.sent && (
            <Button variant="quiet" sx={{ alignSelf: "flex-start" }} onClick={() => setShowCpf((value) => !value)}>
              {showCpf ? copy.hide : copy.show}
            </Button>
          )}
        </Stack>
      ))}
    </Surface>
  );
}
