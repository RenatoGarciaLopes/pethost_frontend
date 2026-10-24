"use client";

import { Box, Button, Link, Typography } from "@mui/material";
import { motion } from "motion/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormProvider, get, useForm, type FieldErrors } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { ApiError, isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { loginRedirectPath, registerPath } from "@/shared/config/appRoutes";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { Notice } from "@/shared/ui/feedback/Notice";
import { FormActions } from "@/shared/ui/forms/FormActions";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { WizardProgress } from "@/shared/ui/navigation/WizardProgress";
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
    const message = translateError(error, { role });
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

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 3, md: 6 },
        gridTemplateColumns: { xs: "1fr", md: "272px minmax(0, 720px)" },
        justifyContent: "center",
        alignItems: "start",
        "& .MuiOutlinedInput-root": { boxShadow: "none" },
      }}
    >
      <Reveal order={0}>
        <Typography
          sx={{
            display: { xs: "none", md: "block" },
            textTransform: "uppercase",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: ".06em",
            mb: 1.5,
            px: 1.5,
          }}
        >
          {registrationCopy.progress.label}
        </Typography>
        <WizardProgress steps={progressSteps} currentIndex={stepIndex} appearance="cards" />
      </Reveal>

      <Reveal order={1}>
        <Box>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: stepIndex === 0 ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={MOTION_ASSENTAR}
          >
            <Typography
              sx={{ textTransform: "uppercase", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", mb: 1 }}
            >
              {registrationCopy.progress.position(stepIndex + 1, progressSteps.length)}
            </Typography>
            <Typography
              ref={headingRef}
              variant="h1"
              tabIndex={-1}
              sx={{ fontSize: { xs: 32, md: 40 }, mb: 1, "&:focus": { outline: "none" } }}
            >
              {step.title}
            </Typography>

            {stepIndex === 0 && (
              <Typography sx={{ mb: 3, color: "text.secondary" }}>{registrationCopy.steps.person.intro}</Typography>
            )}

            {visibleNotice && (
              <Box sx={{ mb: 3 }}>
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
                    ? translateError(
                        new ApiError({ ...visibleNotice.error.toJSON(), retryAfterSeconds: countdown.remaining }),
                      )
                    : visibleNotice.message}
                </Notice>
              </Box>
            )}

            <FormProvider {...form}>
              <Box component="form" noValidate onSubmit={isLastStep ? submit : continueToAddress}>
                {stepIndex === 0 && (
                  <Box sx={{ mb: 3 }}>
                    <RegisterChoice role={role} onChoose={chooseRole} />
                  </Box>
                )}
                {isLastStep ? <AddressStep variant={variant} /> : <PersonStep variant={variant} />}
                <ServerFormError />
                <Box sx={{ mt: 4, pt: 3, borderTop: "1px dashed", borderColor: "divider" }}>
                  <FormActions
                    backLabel={actions.back}
                    nextLabel={
                      isLastStep ? (mutation.isPending ? actions.submitting : actions.submit) : actions.toAddress
                    }
                    nextType="submit"
                    busy={mutation.isPending}
                    disabledReason={blocked ? actions.countdown(countdown.remaining) : undefined}
                    onBack={() => (stepIndex === 0 ? router.back() : goToStep(0, "heading"))}
                  />
                </Box>
              </Box>
            </FormProvider>
            <Typography sx={{ mt: 3, pb: { xs: 10, md: 0 } }}>
              {registrationCopy.choice.hasAccount}{" "}
              <Link component={NextLink} href={loginRedirectPath(next, role)}>
                {registrationCopy.choice.login}
              </Link>
            </Typography>
          </motion.div>
        </Box>
      </Reveal>

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
    </Box>
  );
}
