"use client";

import { Box, Button, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormProvider, get, useForm, type FieldErrors } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { ApiError, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { loginRedirectPath, registerPath } from "@/shared/config/appRoutes";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StepWizard, StepWizardActions } from "@/shared/ui/navigation/StepWizard";
import type { RegisterBody } from "../../api/contracts/registerBodies";
import { useRegisterMutation } from "../../hooks/useRegisterMutation";
import { registrationCopy } from "../../lib/registrationCopy";
import { stepIndexOf, type RegistrationField } from "../../lib/registrationSteps";
import { REGISTRATION_VARIANTS } from "../../lib/registrationVariants";
import type { RegistrationInput } from "../../schemas/registrationSchemas";
import { AddressStep } from "./AddressStep";
import { RegisterChoice } from "./RegisterChoice";
import { PersonStep } from "./PersonStep";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { ServerFormError } from "./ServerFormError";

export interface RegistrationWizardProps {
  /** Qual cadastro: tutor (spec 011) ou anfitrião (spec 012). */
  role: PersonalRole;
  /** Destino pedido na URL; validado antes de virar link (REQ-OREG-013). */
  next: string | null;
}

/** Aviso do topo do passo: qual situação e a frase pronta. */
type RegistrationNotice =
  | { kind: "error"; message: string }
  | { kind: "emailTaken"; message: string }
  | { kind: "rateLimited"; error: ApiError };

/** O anfitrião não mostra o CPF; a chave fica vazia e o mapper dele não a leva. */
const EMPTY_VALUES: RegistrationInput = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  birthDate: "",
  cpf: "",
  address: { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
};

const { actions } = registrationCopy;

/**
 * Cadastro de tutor (spec 011) ou de anfitrião (spec 012) em 2 passos; o que muda entre os dois vem de
 * `REGISTRATION_VARIANTS`. Um único formulário (React Hook Form) para os dois passos, então voltar e trocar de passo nunca apaga nada (REQ-OREG-007). Valida cada campo ao sair dele e o
 * passo inteiro no "Continuar" (REQ-OREG-003); envia uma vez só (REQ-OREG-008) e leva os erros da API
 * ao passo e ao campo certos (REQ-OREG-009 a 012). Senha e CPF só existem em memória (REQ-OREG-014).
 *
 * Só assina isDirty para confirmar a troca de papel; valores, senha e CPF ficam em memória no RHF.
 *
 * @example <RegistrationWizard role="host" next={null} />
 */
export function RegistrationWizard({ role, next }: RegistrationWizardProps) {
  const variant = REGISTRATION_VARIANTS[role];
  const router = useRouter();
  const form = useForm<RegistrationInput, unknown, RegisterBody>({
    resolver: variant.resolver,
    mode: "onTouched",
    defaultValues: EMPTY_VALUES,
  });
  const { isDirty } = form.formState;
  const mutation = useRegisterMutation(variant.path);
  const countdown = useCountdown();
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingRole, setPendingRole] = useState<PersonalRole | null>(null);
  const [notice, setNotice] = useState<RegistrationNotice | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  // O que focar depois que o passo novo aparecer: o título (navegação) ou o campo com erro.
  const pendingFocus = useRef<RegistrationField | "heading" | null>(null);

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

  function goToStep(index: number, focus: RegistrationField | "heading" | null) {
    pendingFocus.current = focus;
    setStepIndex(index);
  }

  /** Erros do formulário (do envio ou da API) em outro passo: volta para ele e foca o primeiro campo. */
  function showFieldsWithError(fields: readonly RegistrationField[]) {
    const index = stepIndexOf(variant.steps, fields);
    if (index === undefined || index === stepIndex) return;
    goToStep(index, fields.find((field) => variant.steps[index].fields.includes(field)) ?? "heading");
  }

  function handleApiError(error: unknown) {
    const message = getErrorMessage(error, { role });
    if (!isApiError(error)) {
      // Falha do próprio front (bug), não da API: aparece no console em desenvolvimento.
      if (process.env.NODE_ENV !== "production") console.error("[cadastro] falha inesperada", error);
      return setNotice({ kind: "error", message });
    }

    switch (error.code) {
      case "VALIDATION_ERROR":
        return showFieldsWithError(applyFieldErrors(form.setError, error, { fields: variant.fields }));
      case "AUTH_EMAIL_ALREADY_REGISTERED":
        setNotice({ kind: "emailTaken", message });
        return goToStep(0, null);
      case "OWNER_CPF_ALREADY_REGISTERED":
        form.setError("cpf", { type: "server", message });
        return goToStep(0, "cpf");
      case "TOO_MANY_REQUESTS":
        countdown.start(error.retryAfterSeconds ?? 30);
        return setNotice({ kind: "rateLimited", error });
      default:
        return setNotice({ kind: "error", message });
    }
  }

  async function continueToAddress(event: FormEvent) {
    event.preventDefault();
    if (await form.trigger(variant.steps[0].fields, { shouldFocus: true })) goToStep(1, "heading");
  }

  function submit(event: FormEvent) {
    return form.handleSubmit(
      (body) => {
        if (mutation.isPending) return;
        setNotice(null);
        mutation.mutate(body, { onError: handleApiError });
      },
      (errors) => showFieldsWithError(fieldsWithError(errors)),
    )(event);
  }

  /** Campos com erro, na ordem da tela. */
  function fieldsWithError(errors: FieldErrors<RegistrationInput>) {
    return variant.fields.filter((field) => get(errors, field));
  }

  if (mutation.isSuccess) {
    return <RegistrationSuccess role={role} fullName={mutation.data.user.fullName} next={next} />;
  }

  const progressSteps =
    role === "owner"
      ? [
          ...variant.steps,
          { id: "pet", label: registrationCopy.progress.pet, description: registrationCopy.progress.petDescription },
        ]
      : variant.steps;
  const step = variant.steps[stepIndex];
  function chooseRole(chosen: PersonalRole) {
    if (chosen === role) return;
    if (isDirty) setPendingRole(chosen);
    else router.push(registerPath(chosen, next));
  }
  const isLastStep = stepIndex === variant.steps.length - 1;
  const blocked = countdown.isRunning;
  // Fim da contagem do limite: o aviso some e o envio volta.
  const visibleNotice = notice?.kind === "rateLimited" && !blocked ? null : notice;

  const notices = visibleNotice && (
    <Notice
      ref={noticeRef}
      tone={visibleNotice.kind === "rateLimited" ? "atencao" : "erro"}
      action={
        visibleNotice.kind === "emailTaken" ? (
          <Button variant="contained" component={NextLink} href={loginRedirectPath(next, role)}>
            {actions.login}
          </Button>
        ) : undefined
      }
    >
      {visibleNotice.kind === "rateLimited"
        ? getErrorMessage(new ApiError({ ...visibleNotice.error.toJSON(), retryAfterSeconds: countdown.remaining }))
        : visibleNotice.message}
    </Notice>
  );

  return (
    <>
      <StepWizard
        steps={progressSteps}
        currentIndex={stepIndex}
        progressTitle={registrationCopy.progress.label}
        position={registrationCopy.progress.position(stepIndex + 1, progressSteps.length)}
        title={step.title}
        titleRef={headingRef}
        intro={stepIndex === 0 ? registrationCopy.steps.person.intro : undefined}
        notice={notices}
        footer={
          <Typography>
            {registrationCopy.choice.hasAccount}{" "}
            <Link component={NextLink} href={loginRedirectPath(next, role)}>
              {registrationCopy.choice.login}
            </Link>
          </Typography>
        }
      >
        <FormProvider {...form}>
          <Box component="form" noValidate onSubmit={isLastStep ? submit : continueToAddress}>
            {stepIndex === 0 && (
              <Box sx={{ mb: 3 }}>
                <RegisterChoice role={role} onChoose={chooseRole} />
              </Box>
            )}
            {isLastStep ? <AddressStep variant={variant} /> : <PersonStep variant={variant} />}
            <ServerFormError />
            <StepWizardActions
              backLabel={actions.back}
              nextLabel={isLastStep ? (mutation.isPending ? actions.submitting : actions.submit) : actions.toAddress}
              nextType="submit"
              busy={mutation.isPending}
              disabledReason={blocked ? actions.countdown(countdown.remaining) : undefined}
              onBack={() => (stepIndex === 0 ? router.back() : goToStep(0, "heading"))}
            />
          </Box>
        </FormProvider>
      </StepWizard>

      <ConfirmDialog
        open={pendingRole !== null}
        title={registrationCopy.switchRole.title}
        message={registrationCopy.switchRole.message}
        confirmLabel={registrationCopy.switchRole.confirm}
        cancelLabel={registrationCopy.switchRole.cancel}
        onCancel={() => setPendingRole(null)}
        onConfirm={() => {
          if (pendingRole) router.push(registerPath(pendingRole, next));
          setPendingRole(null);
        }}
      />
    </>
  );
}
