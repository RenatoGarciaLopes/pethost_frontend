"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { useSessionDraft } from "@/shared/hooks/useSessionDraft";
import { Notice } from "@/shared/ui/feedback/Notice";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import { StepWizard, StepWizardActions } from "@/shared/ui/navigation/StepWizard";
import { toCreateListingRequest } from "../../api/mappers";
import { useCreateListing } from "../../hooks/useListingMutations";
import { listingCopy as copy } from "../../lib/listingCopy";
import { listingDraftKey, listingDraftSchema } from "../../lib/listingDraft";
import { HOST_HOME_PATH } from "../../lib/listingPaths";
import {
  firstStepWithError,
  LISTING_FIELDS,
  LISTING_STEP_IDS,
  LISTING_STEPS,
  REVIEW_INDEX,
  stepIndexOf,
  toFormField,
  type ListingField,
  type ListingStepId,
} from "../../lib/listingSteps";
import { listingErrors, listingResolver } from "../../schemas/listingResolver";
import { createListingSchemas, emptyListingValues, type ListingFormValues } from "../../schemas/listingSchema";
import type { HostListingProfile } from "../../types";
import { CapacityField, SizesField, SpeciesField } from "./fields/GuestsFields";
import { DescriptionField, HomeTypeField, TitleField } from "./fields/HomeFields";
import { HouseholdFields } from "./fields/HouseholdFields";
import { ListingYesNo } from "./fields/ListingYesNo";
import { RateField, RateSimulation, RulesField, WeekdaysField } from "./fields/StayFields";
import { ListingOpened } from "./ListingOpened";
import { ListingPreview } from "./ListingPreview";
import { ListingReview } from "./ListingReview";

export interface ListingDraftProps {
  accountId: string;
  profile: HostListingProfile;
}

type DraftNotice = { tone: "atencao" | "erro"; text: string };
/** O que focar quando o passo novo aparecer: o título (navegação) ou o campo com erro. */
type FocusTarget = ListingField | "heading";

const ADDRESS_INDEX = LISTING_STEP_IDS.indexOf("address");

/**
 * O cadastro do cantinho em passos (104; spec 044, REQ-LIST-003 a 012), na casca do cadastro de conta (`StepWizard`):
 * uma ideia por tela, de "Sua casa" a "Confere e abre", com o card do cantinho se montando ao lado no computador. Um
 * formulário só (React Hook Form), então voltar nunca apaga; cada campo é validado ao sair dele e o passo inteiro no
 * "Continuar", pelos schemas das seções. O rascunho fica na sessão do navegador com o passo em que a pessoa parou; ao
 * voltar, abre nesse passo com o aviso "Continuando de onde você parou." (o formato antigo, sem passo, abre no
 * primeiro passo que falta). "Abrir meu cantinho" manda um `POST` só; erro de campo volta ao passo e ao campo certos;
 * endereço que o mapa não acha volta ao endereço com o aviso; mapa fora do ar mantém o rascunho.
 *
 * @example <ListingDraft accountId={user.id} profile={profile} />
 */
export function ListingDraft({ accountId, profile }: ListingDraftProps) {
  const router = useRouter();
  const schemas = useMemo(() => createListingSchemas(profile.kind), [profile.kind]);
  const resolver = useMemo(() => listingResolver(schemas), [schemas]);
  const initial = useMemo<ListingFormValues>(
    () => ({ ...emptyListingValues, address: profile.address ?? emptyListingValues.address }),
    [profile.address],
  );
  const form = useForm<ListingFormValues>({ resolver, mode: "onTouched", defaultValues: initial });
  const storage = useSessionDraft(listingDraftKey(accountId), listingDraftSchema);
  const saveDraft = storage.save;
  const create = useCreateListing(accountId);
  const [stepIndex, setStepIndex] = useState(0);
  // Entrou no passo pelo "Editar" da revisão: o botão principal volta para ela.
  const [fromReview, setFromReview] = useState(false);
  const [restored, setRestored] = useState(false);
  const [notice, setNotice] = useState<DraftNotice | null>(null);
  const [addressNotice, setAddressNotice] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const opening = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<FocusTarget | null>(null);
  // O rascunho da sessão só é restaurado uma vez, ao abrir, e nunca depois de a pessoa mexer.
  const restoreChecked = useRef(false);
  // O passo atual para o rascunho, lido fora da renderização (na assinatura do formulário).
  const stepRef = useRef<ListingStepId>("home");

  useEffect(() => {
    stepRef.current = LISTING_STEP_IDS[stepIndex]!;
  }, [stepIndex]);

  useEffect(() => {
    if (restoreChecked.current || !storage.draft) return;
    restoreChecked.current = true;
    const { values, step } = storage.draft;
    form.reset(values);
    setStepIndex(step ? LISTING_STEP_IDS.indexOf(step) : firstStepWithError(listingErrors(schemas, values)));
    setRestored(true);
  }, [storage.draft, form, schemas]);

  // Cada mudança vai para o rascunho, com o passo (o hook espera 500 ms antes de escrever). Campo que já mostra erro
  // é conferido de novo na hora: escolher o cartão apaga o "Escolhe se é casa ou apartamento." sem esperar o
  // "Continuar" (cartões e Sim/Não não têm "sair do campo").
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values, name }) => {
          restoreChecked.current = true;
          saveDraft({ values, step: stepRef.current });
          if (name && form.getFieldState(name as ListingField).invalid) void form.trigger(name as ListingField);
        },
      }),
    [form, saveDraft],
  );

  useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === "heading") headingRef.current?.focus();
    else if (target) form.setFocus(target);
  }, [stepIndex, form]);

  // O aviso recebe o foco para o leitor de tela anunciar e o teclado continuar dali.
  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  function goTo(index: number, focus: FocusTarget = "heading") {
    restoreChecked.current = true;
    saveDraft({ values: form.getValues(), step: LISTING_STEP_IDS[index]! });
    if (index === stepIndex) {
      if (focus === "heading") headingRef.current?.focus();
      else form.setFocus(focus);
      return;
    }
    pendingFocus.current = focus;
    setStepIndex(index);
  }

  /** Erros de campo (da API ou do envio) num passo: volta para ele e foca o primeiro campo com erro. */
  function showFieldsWithError(fields: readonly string[]) {
    const index = stepIndexOf(fields);
    if (index === undefined) return;
    setFromReview(true);
    goTo(index, LISTING_STEPS[index]!.fields.find((field) => fields.includes(field)) ?? "heading");
  }

  function reportError(error: unknown) {
    if (isApiError(error) && error.code === "VALIDATION_ERROR") {
      const fields = applyFieldErrors(form.setError, error, { fields: LISTING_FIELDS, rename: toFormField });
      return showFieldsWithError(fields);
    }
    if (isApiError(error) && error.code === "LISTING_ADDRESS_NOT_LOCATED") {
      setAddressNotice(translateError(error));
      setFromReview(true);
      return goTo(ADDRESS_INDEX);
    }
    setNotice({
      tone: isApiError(error) && error.code === "LISTING_GEOCODER_UNAVAILABLE" ? "atencao" : "erro",
      text: translateError(error),
    });
  }

  async function open() {
    if (opening.current) return;
    form.clearErrors("root");
    if (!(await form.trigger()))
      return showFieldsWithError(LISTING_FIELDS.filter((field) => form.getFieldState(field).invalid));
    const parsed = schemas.listing.safeParse(form.getValues());
    if (!parsed.success) return;
    opening.current = true;
    setNotice(null);
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

  async function next() {
    const step = LISTING_STEPS[stepIndex]!;
    if (!(await form.trigger(step.fields, { shouldFocus: true }))) return;
    setRestored(false);
    if (step.id === "address") setAddressNotice(null);
    setFromReview(false);
    goTo(fromReview ? REVIEW_INDEX : stepIndex + 1);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (stepIndex === REVIEW_INDEX) void open();
    else void next();
  }

  function restart() {
    // O reset avisa o rascunho; limpar por último cancela a gravação vazia que ele agenda.
    form.reset(initial);
    storage.clear();
    setRestored(false);
    setFromReview(false);
    setNotice(null);
    setAddressNotice(null);
    // Sem `goTo`: ele gravaria o passo de novo no rascunho que acabou de sair.
    if (stepIndex === 0) return headingRef.current?.focus();
    pendingFocus.current = "heading";
    setStepIndex(0);
  }

  if (openedId) return <ListingOpened listingId={openedId} />;

  const step = LISTING_STEPS[stepIndex]!;
  const isReview = stepIndex === REVIEW_INDEX;
  const nextLabel = isReview
    ? create.isPending
      ? copy.draft.opening
      : copy.draft.open
    : fromReview
      ? copy.wizard.backToReview
      : copy.wizard.next(LISTING_STEPS[stepIndex + 1]!.next!);

  const notices = (restored || notice || (addressNotice && step.id === "address")) && (
    <Stack spacing={2}>
      {restored && (
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
      {addressNotice && step.id === "address" && <Notice tone="atencao" title={addressNotice} />}
      {notice && <Notice ref={noticeRef} tone={notice.tone} title={notice.text} />}
    </Stack>
  );

  return (
    <FormProvider {...form}>
      <StepWizard
        steps={LISTING_STEPS}
        currentIndex={stepIndex}
        progressTitle={copy.wizard.progressTitle}
        progressLabel={copy.wizard.progressLabel}
        position={copy.wizard.position(stepIndex + 1, LISTING_STEPS.length)}
        title={step.title}
        titleRef={headingRef}
        intro={step.intro}
        notice={notices}
        aside={<ListingPreview firstName={profile.firstName} />}
      >
        <Box component="form" noValidate onSubmit={submit}>
          <Stack spacing={3.5}>
            {step.id === "home" && (
              <>
                {profile.kind === "person" && <HomeTypeField />}
                <ListingYesNo name="hasYard" label={copy.home.hasYard} />
              </>
            )}
            {step.id === "title" && (
              <>
                <TitleField firstName={profile.firstName} />
                <DescriptionField />
              </>
            )}
            {step.id === "household" && <HouseholdFields />}
            {step.id === "guests" && (
              <>
                <SpeciesField />
                <SizesField />
                <CapacityField kind={profile.kind} />
              </>
            )}
            {step.id === "address" && (
              <>
                {profile.address && <Typography>{copy.address.suggested}</Typography>}
                <AddressFields name="address" />
              </>
            )}
            {step.id === "rules" && <RulesField />}
            {step.id === "weekdays" && <WeekdaysField />}
            {step.id === "rate" && (
              <>
                <RateField />
                <RateSimulation />
              </>
            )}
            {isReview && (
              <ListingReview
                firstName={profile.firstName}
                onEdit={(id) => {
                  setFromReview(true);
                  goTo(LISTING_STEP_IDS.indexOf(id));
                }}
              />
            )}
          </Stack>
          <StepWizardActions
            backLabel={copy.wizard.back}
            nextLabel={nextLabel}
            nextType="submit"
            busy={create.isPending}
            onBack={() => (stepIndex === 0 ? router.push(HOST_HOME_PATH) : goTo(stepIndex - 1))}
          />
        </Box>
      </StepWizard>
    </FormProvider>
  );
}
