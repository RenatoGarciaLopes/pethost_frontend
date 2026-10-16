"use client";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import type { AuditEntry } from "../../../api/contracts";
import { auditActionCopy } from "../../../lib/auditActionCopy";
import { auditCopy as copy } from "../../../lib/auditCopy";
import { auditActorFilterHref, auditTargetFilterHref, auditTargetLink } from "../../../lib/auditTargetLink";
import { formatDateTime } from "@/shared/lib/date/formatDateTime";
import { CopyButton } from "@/shared/ui/data-display/CopyButton";

/** Detalhe auditável, incluindo IP apenas dentro do diálogo.
 * @example <AuditEntryDetail entry={entry} onClose={close} />
 */
export interface AuditEntryDetailProps {
  entry: AuditEntry | null;
  onClose: () => void;
}

/** Mostra campos textuais validados, ids filtráveis e rotas conhecidas.
 * @example <AuditEntryDetail entry={selected} onClose={close} />
 */
export function AuditEntryDetail({ entry, onClose }: AuditEntryDetailProps) {
  if (!entry) return null;
  const action = auditActionCopy(entry.action);
  const targetLabel = copy.targetTypes.find((target) => target.value === entry.targetType)?.label ?? entry.targetType;
  const targetHref = auditTargetLink(entry.targetType, entry.targetId);

  return (
    <Dialog open aria-labelledby="audit-entry-title" onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle id="audit-entry-title">Detalhes do registro</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography component="h3" variant="h6">
            {action.label}
          </Typography>
          {!action.known && <Typography component="code">{entry.action}</Typography>}
          <Typography>{formatDateTime(entry.occurredAt)}</Typography>
          <Stack spacing={0.5}>
            <Typography component="h4" variant="subtitle1">
              {copy.target}: {targetLabel}
            </Typography>
            <Typography component="code">{entry.targetId ?? copy.unavailable}</Typography>
            {entry.targetId && (
              <Stack direction="row" spacing={2}>
                <Link component={NextLink} href={auditTargetFilterHref(entry.targetType, entry.targetId)}>
                  {copy.filterTarget}
                </Link>
                {targetHref && (
                  <Link component={NextLink} href={targetHref}>
                    {copy.openTarget}
                  </Link>
                )}
              </Stack>
            )}
          </Stack>
          <Stack spacing={0.5}>
            <Typography component="h4" variant="subtitle1">
              {copy.actor}
            </Typography>
            <Typography>
              {entry.actorRole ? (copy.roles[entry.actorRole] ?? entry.actorRole) : copy.unavailable}
            </Typography>
            <Typography component="code">{entry.actorId ?? copy.unavailable}</Typography>
            {entry.actorId && (
              <Link component={NextLink} href={auditActorFilterHref(entry.actorId)}>
                {copy.filterActor}
              </Link>
            )}
          </Stack>
          <Stack spacing={0.5}>
            <Typography component="h4" variant="subtitle1">
              {copy.reason}
            </Typography>
            <Typography>{entry.reason ?? copy.unavailable}</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography component="h4" variant="subtitle1">
              {copy.details}
            </Typography>
            {Object.keys(entry.details).length ? (
              <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "minmax(8rem, auto) 1fr", gap: 1, m: 0 }}>
                {Object.entries(entry.details)
                  .sort(([left], [right]) => left.localeCompare(right))
                  .map(([key, value]) => (
                    <Box key={key} sx={{ display: "contents" }}>
                      <Typography component="dt" sx={{ fontWeight: 700 }}>
                        {key}
                      </Typography>
                      <Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            ) : (
              <Typography>{copy.unavailable}</Typography>
            )}
          </Stack>
          <Stack spacing={0.5}>
            <Typography component="h4" variant="subtitle1">
              {copy.ipAddress}
            </Typography>
            <Typography component="code">{entry.ipAddress ?? copy.unavailable}</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography component="h4" variant="subtitle1">
              {copy.traceId}
            </Typography>
            {entry.traceId ? (
              <Stack component="div" direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Typography component="code" sx={{ overflowWrap: "anywhere" }}>
                  {entry.traceId}
                </Typography>
                <CopyButton value={entry.traceId} label={copy.traceId} />
              </Stack>
            ) : (
              <Typography>{copy.unavailable}</Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>
          {copy.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
