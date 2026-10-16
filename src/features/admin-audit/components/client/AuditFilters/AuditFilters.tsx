"use client";
import { useState, type FormEvent } from "react";
import { Autocomplete, Box, Button, MenuItem, Stack, TextField } from "@mui/material";
import { auditActionGroups, auditActionOptions } from "../../../lib/auditActionCopy";
import { auditCopy as copy } from "../../../lib/auditCopy";
import {
  hasInvalidAuditDateRange,
  sanitizeAuditSearchParams,
  type AuditSearch,
} from "../../../schemas/auditSearchSchema";

/** Filtros completos em URL; valores são validados antes de aplicados.
 * @example <AuditFilters filters={filters} onApply={setFilters} onClear={clearFilters} invalidFields={[]} />
 */
export interface AuditFiltersProps {
  filters: AuditSearch;
  invalidFields: readonly string[];
  onApply: (filters: AuditSearch) => void;
  onClear: () => void;
}

/** Campos de ação, alvo, autor e período local.
 * @example <AuditFilters {...filterProps} />
 */
export function AuditFilters({ filters, invalidFields, onApply, onClear }: AuditFiltersProps) {
  const [draft, setDraft] = useState<AuditSearch>(filters);
  const [submittedErrors, setSubmittedErrors] = useState<string[]>([]);
  const errors = new Set([...invalidFields, ...submittedErrors]);
  const rangeInvalid = hasInvalidAuditDateRange(draft);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = sanitizeAuditSearchParams(draft);
    setSubmittedErrors(parsed.invalid);
    if (parsed.invalid.length || hasInvalidAuditDateRange(parsed.filters)) return;
    onApply({
      action: parsed.filters.action,
      targetType: parsed.filters.targetType,
      targetId: parsed.filters.targetId,
      actorId: parsed.filters.actorId,
      from: parsed.filters.from,
      to: parsed.filters.to,
      page: 1,
      pageSize: parsed.filters.pageSize,
    });
  }

  const groupLabels = Object.fromEntries(auditActionGroups.map((group) => [group.id, group.label]));
  const targetTypes = copy.targetTypes.some((option) => option.value === draft.targetType)
    ? copy.targetTypes
    : [...copy.targetTypes, { value: draft.targetType ?? "", label: draft.targetType ?? "" }];

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Stack spacing={2}>
        <Autocomplete<string, false, false, true>
          freeSolo
          options={auditActionOptions.map((option) => option.code)}
          groupBy={(code) =>
            groupLabels[auditActionOptions.find((option) => option.code === code)?.group ?? "outros"] ?? "Outras ações"
          }
          value={draft.action ?? null}
          onChange={(_, value) => setDraft((current) => ({ ...current, action: value || undefined }))}
          onInputChange={(_, value, reason) => {
            if (reason === "input" || reason === "clear")
              setDraft((current) => ({ ...current, action: value || undefined }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={copy.action}
              error={errors.has("action")}
              helperText={
                errors.has("action")
                  ? "Digite um código como owner.suspended."
                  : "Escolha uma ação ou digite um código."
              }
            />
          )}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={copy.targetType}
            value={draft.targetType ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, targetType: event.target.value || undefined }))}
            error={errors.has("targetType")}
            helperText={errors.has("targetType") ? "Use o tipo de alvo sem espaços." : undefined}
          >
            <MenuItem value="">Todos os tipos</MenuItem>
            {targetTypes.map((option) => (
              <MenuItem value={option.value} key={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label={copy.targetId}
            value={draft.targetId ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, targetId: event.target.value || undefined }))}
            error={errors.has("targetId")}
            helperText={errors.has("targetId") ? "Informe um UUID válido." : undefined}
          />
          <TextField
            fullWidth
            label={copy.actorId}
            value={draft.actorId ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, actorId: event.target.value || undefined }))}
            error={errors.has("actorId")}
            helperText={errors.has("actorId") ? "Informe um UUID válido." : undefined}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            type="date"
            fullWidth
            label={copy.from}
            value={draft.from ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value || undefined }))}
            error={errors.has("from")}
            helperText={errors.has("from") ? "Escolha uma data válida." : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            fullWidth
            label={copy.to}
            value={draft.to ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value || undefined }))}
            error={errors.has("to") || rangeInvalid}
            helperText={rangeInvalid ? copy.invalidRange : errors.has("to") ? "Escolha uma data válida." : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" sx={{ minHeight: 48 }}>
            Buscar registros
          </Button>
          <Button type="button" onClick={onClear} sx={{ minHeight: 48 }}>
            {copy.clear}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
