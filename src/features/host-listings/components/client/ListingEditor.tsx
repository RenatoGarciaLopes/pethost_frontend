"use client";

import { Box, Button, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useCallback, useMemo, useState } from "react";
import { translateError, translateFieldErrors } from "@/shared/api/errors/translateError";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { toUpdateListingRequest } from "../../api/mappers";
import { listingQueries } from "../../api/queries";
import { useDeactivateListing, useReactivateListing, useUpdateListing } from "../../hooks/useListingMutations";
import { listingCopy as copy } from "../../lib/listingCopy";
import { HOST_HOME_PATH } from "../../lib/listingPaths";
import { mergeSection, sectionOfField } from "../../lib/listingSections";
import { createListingSchemas, type ListingFormValues, type ListingSectionId } from "../../schemas/listingSchema";
import type { HostKind, Listing } from "../../types";
import { ListingPhotosSection } from "./ListingPhotosSection";
import { ListingSections } from "./ListingSections";
import type { ListingSectionHostValue, SectionSaveOutcome } from "./sections/ListingSectionHost";

export interface ListingEditorProps {
  accountId: string;
  listingId: string;
  kind: HostKind;
  firstName: string;
}

/**
 * O cantinho do dono (spec 044, REQ-LIST-013, 015 e 017): as mesmas seções do cadastro, cada uma com "Salvar {seção}"
 * e só os campos alterados; "Nada mudou por aqui." sem chamar a API; sair com alteração pergunta antes. "Pausar meu
 * cantinho" pede confirmação neutra; pausado continua editável, com "Reabrir". Endereço completo só aqui, para o dono.
 *
 * @example <ListingEditor accountId={user.id} listingId={id} kind="person" firstName="Cida" />
 */
export function ListingEditor({ accountId, listingId, kind, firstName }: ListingEditorProps) {
  const query = useQuery(listingQueries.detail(accountId, listingId));
  if (query.isPending) return <ListingEditorSkeleton />;
  if (query.isError)
    return (
      <ErrorState
        title={copy.loadError}
        description={translateError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  return <ListingEditorView accountId={accountId} listing={query.data} kind={kind} firstName={firstName} />;
}

/** Esqueleto do cantinho enquanto busca. */
function ListingEditorSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true" aria-label={copy.loading}>
      <Skeleton variant="rounded" height={64} />
      <Skeleton variant="rounded" height={320} />
    </Stack>
  );
}

function ListingEditorView({
  accountId,
  listing,
  kind,
  firstName,
}: Omit<ListingEditorProps, "listingId"> & { listing: Listing }) {
  const schemas = useMemo(() => createListingSchemas(kind), [kind]);
  const update = useUpdateListing(accountId, listing.id);
  const [saving, setSaving] = useState<ListingSectionId | null>(null);
  const [serverErrors, setServerErrors] = useState<ListingSectionHostValue["serverErrors"]>({});
  const [dirty, setDirty] = useState<ReadonlySet<ListingSectionId>>(() => new Set());
  const { dialog } = useUnsavedChangesGuard(dirty.size > 0);

  const reportDirty = useCallback((section: ListingSectionId, isDirty: boolean) => {
    setDirty((current) => {
      if (current.has(section) === isDirty) return current;
      const next = new Set(current);
      if (isDirty) next.add(section);
      else next.delete(section);
      return next;
    });
  }, []);

  function reportError(section: ListingSectionId, error: unknown) {
    const fields: Record<string, string> = {};
    const others: string[] = [];
    for (const [field, message] of Object.entries(translateFieldErrors(error))) {
      if (sectionOfField(field) === section) fields[field] = message;
      else others.push(message);
    }
    const notice =
      Object.keys(fields).length > 0 && others.length === 0 ? undefined : others.join(" ") || translateError(error);
    setServerErrors((current) => ({ ...current, [section]: { fields, notice } }));
  }

  async function save(section: ListingSectionId, submitted: ListingFormValues): Promise<SectionSaveOutcome> {
    const original = schemas.listing.safeParse(listing.values);
    const edited = schemas.listing.safeParse(mergeSection(listing.values, section, submitted));
    if (!original.success || !edited.success) return "failed";
    const body = toUpdateListingRequest(original.data, edited.data);
    if (Object.keys(body).length === 0) return "unchanged";
    setSaving(section);
    setServerErrors((current) => ({ ...current, [section]: undefined }));
    try {
      await update.mutateAsync(body);
      return "saved";
    } catch (error) {
      reportError(section, error);
      return "failed";
    } finally {
      setSaving(null);
    }
  }

  const host: ListingSectionHostValue = {
    kind,
    firstName,
    values: listing.values,
    schemas,
    mode: "edit",
    save,
    saving,
    serverErrors,
    focusSection: null,
    reportDirty,
  };

  return (
    <Stack spacing={4}>
      <Link component={NextLink} href={HOST_HOME_PATH} sx={{ alignSelf: "flex-start" }}>
        {copy.editor.back}
      </Link>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {listing.title}
        </Typography>
        <StatusPill
          label={listing.isActive ? copy.editor.active : copy.editor.paused}
          tone={listing.isActive ? "ok" : "neutro"}
        />
      </Stack>
      <PauseControls accountId={accountId} listing={listing} />
      <ListingPhotosSection accountId={accountId} listing={listing} />
      <ListingSections host={host} />
      {dialog}
    </Stack>
  );
}

/** "Pausar meu cantinho" com confirmação neutra, ou, pausado, o aviso e "Reabrir" (REQ-LIST-015). */
function PauseControls({ accountId, listing }: { accountId: string; listing: Listing }) {
  const pause = useDeactivateListing(accountId, listing.id);
  const reopen = useReactivateListing(accountId, listing.id);
  const [asking, setAsking] = useState(false);

  if (!listing.isActive)
    return (
      <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Notice tone="info" title={copy.editor.pausedNotice} />
        <Button
          variant="outlined"
          disabled={reopen.isPending}
          aria-busy={reopen.isPending || undefined}
          onClick={() => reopen.mutate()}
        >
          {copy.editor.reopen}
        </Button>
        {reopen.isError && <Notice tone="erro" title={translateError(reopen.error)} />}
      </Stack>
    );

  return (
    <Box>
      <Button variant="quiet" onClick={() => setAsking(true)}>
        {copy.editor.pause}
      </Button>
      <ConfirmDialog
        open={asking}
        title={copy.editor.pauseTitle}
        message={copy.editor.pauseMessage}
        confirmLabel={copy.editor.pauseConfirm}
        cancelLabel={copy.editor.keepOpen}
        busy={pause.isPending}
        error={pause.isError ? translateError(pause.error) : null}
        onConfirm={() => pause.mutate(undefined, { onSuccess: () => setAsking(false) })}
        onCancel={() => {
          pause.reset();
          setAsking(false);
        }}
      />
    </Box>
  );
}
