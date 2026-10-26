"use client";
import { useState } from "react";
import { Box, Button, Checkbox, Divider, FormControlLabel, Link, Stack, Typography } from "@mui/material";
import { Notice } from "@/shared/ui/feedback/Notice";
import { ReasonField } from "@/shared/ui/forms/ReasonField";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
import { Surface } from "@/shared/ui/layout/Surface";
import {
  adminReviewCopy as copy,
  approveSchema,
  rejectSchema,
  fraudSchema,
  commonRejectionSchema,
} from "@/features/admin-host-applications";

interface DecisionPanelProps {
  personType: "pf" | "pj";
  busy: boolean;
  onDecide: (body: {
    reason: string;
    rejectionReason?: (typeof commonRejectionSchema.options)[number] | "suspected_fraud";
  }) => void;
  /** Frase já traduzida de cada campo (`translateFieldErrors`). */
  fieldErrors?: Record<string, string>;
}
/** Caixa de decisão (spec 005, REQ-UIC-002): checklist efêmero, motivo, "Aprovar" em grama, recusa por motivo com a
 * frase que a pessoa vai ler numa caixa de orientação e a fraude separada, em vermelho de erro e com confirmação.
 * O pai só deve montar em submitted e tela >=900px.
 * @example <DecisionPanel personType="pf" busy={decision.isPending} onDecide={decision.mutate} />
 */
export function DecisionPanel({ personType, busy, onDecide, fieldErrors }: DecisionPanelProps) {
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [rejection, setRejection] = useState<(typeof commonRejectionSchema.options)[number]>();
  const [fraud, setFraud] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const items: readonly string[] = personType === "pj" ? [...copy.checklist, ...copy.companyChecklist] : copy.checklist;
  const validReason = approveSchema.safeParse({ reason }).success;
  return (
    <Surface component="aside" aria-label={copy.decision} elevation="md" sx={{ p: 3, display: "grid", gap: 2 }}>
      <Typography component="h2" variant="overline">
        {copy.checklistTitle}
      </Typography>
      <Box>
        {items.map((item) => (
          <FormControlLabel
            key={item}
            sx={{ display: "flex", minHeight: 44 }}
            control={
              <Checkbox
                disabled={busy}
                checked={checked.includes(item)}
                onChange={(_, value) =>
                  setChecked((current) => (value ? [...current, item] : current.filter((entry) => entry !== item)))
                }
              />
            }
            label={item}
          />
        ))}
      </Box>
      {personType === "pj" && (
        <Link href={copy.registryUrl} target="_blank" rel="noopener noreferrer">
          {copy.registry}
        </Link>
      )}
      <ReasonField
        label={copy.reason}
        value={reason}
        onChange={setReason}
        helperText={copy.reasonHelp}
        disabled={busy}
        error={fieldErrors?.reason}
      />
      <Typography variant="body2" color="text.secondary">
        {copy.checklistHelp}
      </Typography>
      <Button
        variant="contained"
        color="success"
        fullWidth
        disabled={busy || !validReason || checked.length !== items.length}
        onClick={() => onDecide(approveSchema.parse({ reason }))}
      >
        {copy.approve}
      </Button>
      <ChipPicker
        label={copy.chooseReason}
        options={commonRejectionSchema.options.map((key) => copy.rejection[key])}
        selected={rejection ? [copy.rejection[rejection]] : []}
        disabled={busy}
        onPick={(label) => setRejection(commonRejectionSchema.options.find((key) => copy.rejection[key] === label))}
      />
      {fieldErrors?.rejectionReason && <Typography role="alert">{fieldErrors.rejectionReason}</Typography>}
      {rejection && (
        <Notice tone="atencao" title={copy.recipientLabel}>
          {copy.recipient[rejection]}
        </Notice>
      )}
      <Button
        disabled={busy || !validReason || !rejection}
        onClick={() => onDecide(rejectSchema.parse({ reason, rejectionReason: rejection }))}
      >
        {copy.reject}
      </Button>
      <Divider />
      <Box component="section">
        <Button
          variant="quiet"
          sx={{ color: "error.main", textDecoration: "underline", px: 1 }}
          disabled={busy}
          onClick={() => {
            setFraud((value) => !value);
            setConfirmed(false);
          }}
        >
          {copy.fraud}
        </Button>
        {fraud && (
          <Stack spacing={1}>
            <Typography>{copy.recipient.suspected_fraud}</Typography>
            <FormControlLabel
              control={<Checkbox checked={confirmed} disabled={busy} onChange={(_, value) => setConfirmed(value)} />}
              label={copy.fraudConfirm}
            />
            <Button
              disabled={busy || !fraudSchema.safeParse({ reason, confirmed }).success}
              onClick={() => onDecide({ reason: reason.trim(), rejectionReason: "suspected_fraud" })}
            >
              {copy.confirmFraud}
            </Button>
          </Stack>
        )}
      </Box>
    </Surface>
  );
}
