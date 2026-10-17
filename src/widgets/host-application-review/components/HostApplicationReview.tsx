"use client";
import Link from "next/link";
import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminHostQueries, type AdminHost } from "@/features/hosts";
import {
  adminApplicationQueries,
  adminReviewCopy as copy,
  getDocumentLink,
  type AdminApplication,
} from "@/features/admin-host-applications";
import { useDecision } from "@/features/admin-host-applications/index.client";
import { documentDrawings } from "@/features/host-applications";
import { hasErrorCode, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { Hint } from "@/shared/ui/feedback/Hint";
import { Notice } from "@/shared/ui/feedback/Notice";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { StatusPill, type StatusPillTone } from "@/shared/ui/feedback/StatusPill";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { Surface } from "@/shared/ui/layout/Surface";
import { ApplicantComparison } from "./ApplicantComparison";
import { SignedDocumentViewer } from "./SignedDocumentViewer";
import { DecisionPanel } from "./DecisionPanel";

/** Tom do selo: em análise é espera (céu), aprovada é grama, o resto neutro. */
const STATUS_TONE: Readonly<Record<AdminApplication["status"], StatusPillTone>> = {
  draft: "neutro",
  submitted: "info",
  approved: "ok",
  rejected: "neutro",
  rejected_final: "neutro",
  cancelled: "neutro",
  expired: "neutro",
};
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

/** Detalhe administrativo (spec 031; composição da spec 005, REQ-UIC-002/009): à esquerda, quem pede, as fotos como
 * cartões com o desenho da vaga (a foto só abre sob clique, com link temporário) e os dados para comparar; à direita, a
 * caixa de decisão ou o resumo. Não recebe links assinados do servidor.
 * @example <HostApplicationReview accountId={user.id} applicationId={id} />
 */
export function HostApplicationReview({ accountId, applicationId }: { accountId: string; applicationId: string }) {
  const detail = useQuery(adminApplicationQueries.detail(accountId, applicationId));
  const decision = useDecision(accountId, applicationId);
  const next = useQuery({ ...adminApplicationQueries.queue(accountId, "submitted"), enabled: decision.isSuccess });
  const duplicateDocument =
    hasErrorCode(decision.error, "HOST_CPF_ALREADY_REGISTERED") ||
    hasErrorCode(decision.error, "HOST_CNPJ_ALREADY_REGISTERED");
  const existingHosts = useQuery({ ...adminHostQueries.list(accountId), enabled: duplicateDocument });
  const wide = useMediaQuery("(min-width:900px)");
  if (detail.isPending) return <SniffLoader />;
  if (detail.isError) return <ErrorState title={getErrorMessage(detail.error)} onRetry={() => void detail.refetch()} />;
  const app = detail.data;
  const conflict =
    hasErrorCode(decision.error, "HOST_APPLICATION_CONFLICT") ||
    hasErrorCode(decision.error, "HOST_APPLICATION_NOT_UNDER_REVIEW");
  const following = next.data
    ?.filter((item) => item.id !== app.id)
    .sort((a, b) => (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt))[0];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 380px" },
        gap: { xs: 3, md: 5 },
        alignItems: "start",
      }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Box component={Link} href="/admin/host-applications" sx={{ alignSelf: "flex-start", color: "text.primary" }}>
          {copy.back}
        </Box>
        <PageHeader
          eyebrow={<StatusPill label={copy.status[app.status]} tone={STATUS_TONE[app.status]} size="sm" />}
          title={
            <>
              <Box component="span" sx={visuallyHidden}>
                {`${copy.reviewTitle}:`}
              </Box>{" "}
              {app.user?.fullName ?? copy.unavailable}
            </>
          }
          subtitle={copy.requestLine(
            dayMonth.format(new Date(app.submittedAt ?? app.createdAt)),
            app.attemptNumber,
            copy.person[app.personType],
          )}
        />
        {decision.isSuccess && (
          <Notice
            tone="ok"
            title={copy.success}
            action={
              following ? (
                <Link href={`/admin/host-applications/${following.id}`}>{copy.next}</Link>
              ) : next.isError ? (
                <ErrorState onRetry={() => void next.refetch()} />
              ) : (
                <Typography>{next.isPending ? copy.loading : copy.noNext}</Typography>
              )
            }
          />
        )}
        {conflict ? (
          <Notice tone="info" title={copy.conflict} />
        ) : (
          decision.isError && (
            <Notice
              tone="erro"
              title={getErrorMessage(decision.error, { adminReview: true })}
              action={
                duplicateDocument && (
                  <ExistingHostLinks
                    application={app}
                    hosts={existingHosts.data ?? []}
                    loading={existingHosts.isPending}
                  />
                )
              }
            />
          )
        )}
        <Stack component="section" aria-label={copy.photos} spacing={1.5}>
          {app.documentsPurgedAt ? (
            <Notice tone="info" title={`${copy.purged} ${new Date(app.documentsPurgedAt).toLocaleString("pt-BR")}`} />
          ) : (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: { xs: 1, sm: 2 } }}>
                {(["front", "back", "selfie"] as const).map((kind) =>
                  app.documents.some((doc) => doc.kind === kind) ? (
                    <SignedDocumentViewer
                      key={`${app.id}-${kind}`}
                      label={copy.photo[kind]}
                      illustration={documentDrawings[kind]}
                      load={(signal) => getDocumentLink(app.id, kind, undefined, signal)}
                    />
                  ) : (
                    <Surface key={kind} sx={{ p: 2, borderStyle: "dashed", boxShadow: "none" }}>
                      <Typography sx={{ fontWeight: 800 }}>{copy.photo[kind]}</Typography>
                      <Typography color="text.secondary">{copy.missing}</Typography>
                    </Surface>
                  ),
                )}
              </Box>
              <Hint>{copy.photosAudit}</Hint>
            </>
          )}
        </Stack>
        <ApplicantComparison key={app.id} application={app} />
      </Stack>
      {app.status === "submitted" ? (
        wide ? (
          <DecisionPanel
            key={app.id}
            personType={app.personType}
            busy={decision.isPending}
            onDecide={decision.mutate}
            fieldErrors={isApiError(decision.error) ? decision.error.fieldErrors : undefined}
          />
        ) : (
          <Notice tone="info">{copy.mobile}</Notice>
        )
      ) : (
        <DecisionSummary application={app} />
      )}
    </Box>
  );
}

function ExistingHostLinks({
  application,
  hosts,
  loading,
}: {
  application: AdminApplication;
  hosts: readonly AdminHost[];
  loading: boolean;
}) {
  const cpf = application.cpf.replace(/\D/g, "");
  const cnpj = application.company?.cnpj.replace(/\D/g, "");
  const matches = hosts.filter(
    (host) =>
      !host.identityReleasedAt &&
      (host.cpf.replace(/\D/g, "") === cpf || Boolean(cnpj && host.company?.cnpj.replace(/\D/g, "") === cnpj)),
  );
  if (loading) return <Typography>{copy.loading}</Typography>;
  return (
    <Stack spacing={0.5}>
      <Typography>{copy.duplicateHostAccounts}</Typography>
      {matches.length ? (
        <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
          {matches.map((host) => (
            <li key={host.id}>
              <Link href={`/admin/users/hosts/${host.id}`}>
                {copy.openDuplicateHost(host.user?.fullName ?? copy.unavailable)}
              </Link>
            </li>
          ))}
        </Stack>
      ) : (
        <Typography>{copy.noDuplicateHost}</Typography>
      )}
    </Stack>
  );
}

/** Resumo somente leitura para solicitação fora de análise, na caixa à direita. @example <DecisionSummary application={application} /> */
function DecisionSummary({ application: app }: { application: AdminApplication }) {
  return (
    <Surface component="aside" aria-label={copy.decision} elevation="md" sx={{ p: 3, display: "grid", gap: 1 }}>
      <Typography component="h2" variant="overline">
        {copy.decision}
      </Typography>
      <Typography sx={{ fontWeight: 800 }}>{copy.status[app.status]}</Typography>
      {app.rejectionReason && <Typography>{copy.rejection[app.rejectionReason]}</Typography>}
      <Typography>
        {copy.reason}: {app.reviewNotes ?? copy.unavailable}
      </Typography>
      <Typography>
        {copy.reviewedBy}: {app.reviewedBy ?? copy.unavailable}
      </Typography>
      <Typography>
        {copy.reviewedAt}: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleString("pt-BR") : copy.unavailable}
      </Typography>
    </Surface>
  );
}
