"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useId, useMemo, useRef, useState } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { useSessionDraft } from "@/shared/hooks/useSessionDraft";
import { Notice } from "@/shared/ui/feedback/Notice";
import { toCreateListingRequest } from "../../api/mappers";
import { useCreateListing } from "../../hooks/useListingMutations";
import { listingCopy as copy } from "../../lib/listingCopy";
import { listingDraftKey, listingDraftSchema, type ListingDraft as Draft } from "../../lib/listingDraft";
import { LISTING_SECTIONS, mergeSection, sectionOfField } from "../../lib/listingSections";
import {
  createListingSchemas,
  emptyListingValues,
  type ListingFormValues,
  type ListingSectionId,
} from "../../schemas/listingSchema";
import type { HostListingProfile } from "../../types";
import { ListingOpened } from "./ListingOpened";
import { ListingSections } from "./ListingSections";
import { ListingSectionsPanel } from "./ListingSectionsPanel";
import type { ListingSectionHostValue } from "./sections/ListingSectionHost";

type ServerErrors = ListingSectionHostValue["serverErrors"];

/** Erros de campo do `400` agrupados por seção; o que não é de seção nenhuma volta à parte. */
function groupFieldErrors(fieldErrors: Record<string, string[]>) {
  const bySection: ServerErrors = {};
  const orphan: string[] = [];
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const section = sectionOfField(field);
    if (!section) {
      orphan.push(...messages);
      continue;
    }
    const current = bySection[section] ?? { fields: {} };
    bySection[section] = { ...current, fields: { ...current.fields, [field]: messages.join(" ") } };
  }
  return { bySection, orphan };
}

export interface ListingDraftProps {
  accountId: string;
  profile: HostListingProfile;
}

/**
 * O cadastro do cantinho (spec 044, REQ-LIST-003 a 012): as sete seções em qualquer ordem, num rascunho por conta na
 * sessão do navegador (a API só cadastra tudo de uma vez, já aberto). Cada seção salva fica pronta; com todas prontas,
 * "Abrir meu cantinho" manda um `POST` só. Erro de campo volta à seção certa, que deixa de estar pronta e recebe o
 * foco; mapa fora do ar mantém o rascunho.
 *
 * @example <ListingDraft accountId={user.id} profile={profile} />
 */
export function ListingDraft({ accountId, profile }: ListingDraftProps) {
  const schemas = useMemo(() => createListingSchemas(profile.kind), [profile.kind]);
  const storage = useSessionDraft(listingDraftKey(accountId), listingDraftSchema);
  const initial = useMemo<Draft>(
    () => ({ values: { ...emptyListingValues, address: profile.address ?? emptyListingValues.address }, done: [] }),
    [profile.address],
  );
  const current = storage.draft ?? initial;
  const create = useCreateListing(accountId);
  const opening = useRef(false);
  const reasonId = useId();
  // Já salvou ou recomeçou nesta visita: o aviso de rascunho restaurado sai.
  const [continued, setContinued] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerErrors>({});
  const [focusSection, setFocusSection] = useState<ListingSectionId | null>(null);
  const [notice, setNotice] = useState<{ tone: "atencao" | "erro"; text: string } | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);

  const ready = new Set(current.done.filter((section) => schemas.sections[section].safeParse(current.values).success));

  function saveDraft(values: ListingFormValues, done: readonly ListingSectionId[]) {
    storage.save({ values, done: LISTING_SECTIONS.filter((section) => done.includes(section)) });
  }

  async function save(section: ListingSectionId, submitted: ListingFormValues) {
    setContinued(true);
    setServerErrors((current) => {
      const next = { ...current };
      delete next[section];
      return next;
    });
    saveDraft(mergeSection(current.values, section, submitted), [...current.done, section]);
    return "saved" as const;
  }

  function restart() {
    storage.clear();
    setContinued(true);
    setServerErrors({});
    setNotice(null);
  }

  function reportError(error: unknown) {
    if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
      const { bySection, orphan } = groupFieldErrors(error.fieldErrors);
      const sections = LISTING_SECTIONS.filter((section) => bySection[section]);
      setServerErrors(bySection);
      saveDraft(
        current.values,
        current.done.filter((section) => !sections.includes(section)),
      );
      setFocusSection(sections[0] ?? null);
      return setNotice(orphan.length > 0 ? { tone: "erro", text: orphan.join(" ") } : null);
    }
    if (isApiError(error) && error.code === "LISTING_GEOCODER_UNAVAILABLE")
      return setNotice({ tone: "atencao", text: getErrorMessage(error) });
    if (isApiError(error) && error.code === "LISTING_ADDRESS_NOT_LOCATED") {
      setServerErrors({ address: { fields: {}, notice: getErrorMessage(error) } });
      saveDraft(
        current.values,
        current.done.filter((section) => section !== "address"),
      );
      return setFocusSection("address");
    }
    setNotice({ tone: "erro", text: getErrorMessage(error) });
  }

  async function open() {
    if (opening.current) return;
    const parsed = schemas.listing.safeParse(current.values);
    if (!parsed.success) return;
    opening.current = true;
    setNotice(null);
    setFocusSection(null);
    try {
      const listing = await create.mutateAsync(toCreateListingRequest(parsed.data));
      storage.clear();
      setOpenedId(listing.id);
    } catch (error) {
      reportError(error);
    } finally {
      opening.current = false;
    }
  }

  if (openedId) return <ListingOpened listingId={openedId} />;

  const host: ListingSectionHostValue = {
    kind: profile.kind,
    firstName: profile.firstName,
    values: current.values,
    schemas,
    mode: "draft",
    save,
    saving: null,
    serverErrors,
    focusSection,
  };
  const allReady = ready.size === LISTING_SECTIONS.length;

  return (
    <Stack spacing={4}>
      <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
        {copy.draft.heading}
      </Typography>
      {storage.draft && !continued && (
        <Notice
          tone="info"
          title={copy.draft.restored}
          action={
            <Button size="small" onClick={restart}>
              {copy.draft.restart}
            </Button>
          }
        />
      )}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 260px" },
          alignItems: "start",
        }}
      >
        <Box sx={{ position: { md: "sticky" }, top: { md: 24 }, order: { md: 2 } }}>
          <ListingSectionsPanel ready={ready} />
        </Box>
        <Box sx={{ order: { md: 1 }, minWidth: 0 }}>
          <ListingSections host={host} addressSuggested={profile.address !== null} />
        </Box>
      </Box>
      {notice && <Notice tone={notice.tone} title={notice.text} />}
      <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
        {!allReady && <Typography id={reasonId}>{copy.draft.openDisabled}</Typography>}
        <Button
          variant="contained"
          size="large"
          disabled={!allReady || create.isPending}
          aria-busy={create.isPending || undefined}
          aria-describedby={allReady ? undefined : reasonId}
          onClick={() => void open()}
        >
          {create.isPending ? copy.draft.opening : copy.draft.open}
        </Button>
      </Stack>
    </Stack>
  );
}
