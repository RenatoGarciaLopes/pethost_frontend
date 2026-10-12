"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Paper, Typography } from "@mui/material";
import { motion } from "motion/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { FormProvider, get, useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { ApiError, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { loginRedirectPath, registerPath } from "@/shared/config/appRoutes";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";
import { Notice } from "@/shared/ui/feedback/Notice";
import { FormActions } from "@/shared/ui/forms/FormActions";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { WizardProgress } from "@/shared/ui/navigation/WizardProgress";
import { useRegisterMutation } from "../../hooks/useRegisterMutation";
import { registrationCopy } from "../../lib/registrationCopy";
import { REGISTRATION_FIELDS, REGISTRATION_STEPS, stepIndexOf } from "../../lib/registrationSteps";
import {
  ownerRegistrationSchema,
  type OwnerRegistrationInput,
  type OwnerRegistrationValues,
} from "../../schemas/ownerRegistrationSchema";
import { AddressStep } from "./AddressStep";
import { PersonStep } from "./PersonStep";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { ServerFormError } from "./ServerFormError";

export interface RegistrationWizardProps {
  /** Destino pedido na URL; validado antes de virar link (REQ-OREG-013). */
  next: string | null;
  /** Faixa lateral do computador ("o que a gente faz com cada dado"), renderizada no servidor. */
  aside: ReactNode;
}

type RegistrationField = FieldPath<OwnerRegistrationInput>;

/** Aviso do topo do passo: qual situação e a frase pronta. */
type RegistrationNotice =
  | { kind: "error"; message: string }
  | { kind: "emailTaken"; message: string }
  | { kind: "rateLimited"; error: ApiError };

const EMPTY_VALUES: OwnerRegistrationInput = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  birthDate: "",
  cpf: "",
  address: { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
};

const { actions } = registrationCopy;

/** Campos com erro, na ordem da tela. */
const fieldsWithError = (errors: FieldErrors<OwnerRegistrationInput>) =>
  REGISTRATION_FIELDS.filter((field) => get(errors, field));

/**
 * Cadastro de tutor em 2 passos (spec 011). Um único formulário (React Hook Form) para os dois passos,
 * então voltar e trocar de passo nunca apaga nada (REQ-OREG-007). Valida cada campo ao sair dele e o
 * passo inteiro no "Continuar" (REQ-OREG-003); envia uma vez só (REQ-OREG-008) e leva os erros da API
 * ao passo e ao campo certos (REQ-OREG-009 a 012). Senha e CPF só existem em memória (REQ-OREG-014).
 *
 * O componente não assina valores do formulário: cada campo re-renderiza só a si mesmo ao digitar.
 *
 * @example <RegistrationWizard next={null} aside={<DataUseAside />} />
 */
export function RegistrationWizard({ next, aside }: RegistrationWizardProps) {
  const router = useRouter();
  const form = useForm<OwnerRegistrationInput, unknown, OwnerRegistrationValues>({
    resolver: zodResolver(ownerRegistrationSchema),
    mode: "onTouched",
    defaultValues: EMPTY_VALUES,
  });
  const mutation = useRegisterMutation();
  const countdown = useCountdown();
  const [stepIndex, setStepIndex] = useState(0);
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
    const index = stepIndexOf(fields);
    if (index === undefined || index === stepIndex) return;
    goToStep(index, fields.find((field) => REGISTRATION_STEPS[index].fields.includes(field)) ?? "heading");
  }

  function handleApiError(error: unknown) {
    const message = getErrorMessage(error, { role: "owner" });
    if (!isApiError(error)) {
      // Falha do próprio front (bug), não da API: aparece no console em desenvolvimento.
      if (process.env.NODE_ENV !== "production") console.error("[cadastro] falha inesperada", error);
      return setNotice({ kind: "error", message });
    }

    switch (error.code) {
      case "VALIDATION_ERROR":
        return showFieldsWithError(applyFieldErrors(form.setError, error, { fields: REGISTRATION_FIELDS }));
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
    if (await form.trigger(REGISTRATION_STEPS[0].fields, { shouldFocus: true })) goToStep(1, "heading");
  }

  function submit(event: FormEvent) {
    return form.handleSubmit(
      (values) => {
        if (mutation.isPending) return;
        setNotice(null);
        mutation.mutate(values, { onError: handleApiError });
      },
      (errors) => showFieldsWithError(fieldsWithError(errors)),
    )(event);
  }

  if (mutation.isSuccess) return <RegistrationSuccess fullName={mutation.data.user.fullName} next={next} />;

  const step = REGISTRATION_STEPS[stepIndex];
  const isLastStep = stepIndex === REGISTRATION_STEPS.length - 1;
  const blocked = countdown.isRunning;
  // Fim da contagem do limite: o aviso some e o envio volta.
  const visibleNotice = notice?.kind === "rateLimited" && !blocked ? null : notice;

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 2, md: 5 },
        gridTemplateColumns: { xs: "1fr", md: "180px minmax(0, 560px) minmax(0, 280px)" },
        justifyContent: "center",
        alignItems: "start",
      }}
    >
      <Reveal order={0}>
        <WizardProgress steps={REGISTRATION_STEPS} currentIndex={stepIndex} />
      </Reveal>

      <Reveal order={1}>
        <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: stepIndex === 0 ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={MOTION_ASSENTAR}
          >
            <Typography
              ref={headingRef}
              variant="h1"
              tabIndex={-1}
              sx={{ fontSize: { xs: 28, md: 36 }, mb: 3, "&:focus": { outline: "none" } }}
            >
              {step.title}
            </Typography>

            {visibleNotice && (
              <Box sx={{ mb: 3 }}>
                <Notice
                  ref={noticeRef}
                  tone={visibleNotice.kind === "rateLimited" ? "atencao" : "erro"}
                  action={
                    visibleNotice.kind === "emailTaken" ? (
                      <Button variant="contained" component={NextLink} href={loginRedirectPath(next, "owner")}>
                        {actions.login}
                      </Button>
                    ) : undefined
                  }
                >
                  {visibleNotice.kind === "rateLimited"
                    ? getErrorMessage(
                        new ApiError({ ...visibleNotice.error.toJSON(), retryAfterSeconds: countdown.remaining }),
                      )
                    : visibleNotice.message}
                </Notice>
              </Box>
            )}

            <FormProvider {...form}>
              <Box component="form" noValidate onSubmit={isLastStep ? submit : continueToAddress}>
                {isLastStep ? <AddressStep /> : <PersonStep />}
                <ServerFormError />
                <Box sx={{ mt: 4 }}>
                  <FormActions
                    backLabel={actions.back}
                    nextLabel={
                      isLastStep ? (mutation.isPending ? actions.submitting : actions.submit) : actions.toAddress
                    }
                    nextType="submit"
                    busy={mutation.isPending}
                    disabledReason={blocked ? actions.countdown(countdown.remaining) : undefined}
                    onBack={() =>
                      stepIndex === 0 ? router.push(registerPath(undefined, next)) : goToStep(0, "heading")
                    }
                  />
                </Box>
              </Box>
            </FormProvider>
          </motion.div>
        </Paper>
      </Reveal>

      <Reveal order={2} sx={{ display: { xs: "none", md: "block" } }}>
        {aside}
      </Reveal>
    </Box>
  );
}
