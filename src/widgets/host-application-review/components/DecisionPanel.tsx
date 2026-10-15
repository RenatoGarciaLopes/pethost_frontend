"use client";
import { useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { ReasonField } from "@/shared/ui/forms/ReasonField";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
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
  fieldErrors?: Record<string, string[]>;
}
/** Checklist efêmero e decisão explícita. O pai só deve montar em submitted e tela >=900px.
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
    <Stack spacing={2} component="section" aria-label={copy.decision}>
      <Typography component="h2" variant="h5">
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
        <a href={copy.registryUrl} target="_blank" rel="noopener noreferrer">
          {copy.registry}
        </a>
      )}
      <ReasonField
        label={copy.reason}
        value={reason}
        onChange={setReason}
        helperText={copy.reasonHelp}
        disabled={busy}
        error={fieldErrors?.reason?.join(" ")}
      />
      <Typography>{copy.checklistHelp}</Typography>
      <Button
        variant="contained"
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
      {fieldErrors?.rejectionReason && <Typography role="alert">{fieldErrors.rejectionReason.join(" ")}</Typography>}
      {rejection && (
        <Box>
          <Typography>{copy.recipientLabel}</Typography>
          <Typography>{copy.recipient[rejection]}</Typography>
        </Box>
      )}
      <Button
        disabled={busy || !validReason || !rejection}
        onClick={() => onDecide(rejectSchema.parse({ reason, rejectionReason: rejection }))}
      >
        {copy.reject}
      </Button>
      <Box component="section" sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
        <Button
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
    </Stack>
  );
}
