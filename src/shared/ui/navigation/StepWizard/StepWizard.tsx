"use client";
import { Box, Typography } from "@mui/material";
import { motion } from "motion/react";
import type { ReactNode, Ref } from "react";
import { MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";
import { FormActions, type FormActionsProps } from "@/shared/ui/forms/FormActions";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { WizardProgress, type WizardStep } from "@/shared/ui/navigation/WizardProgress";

export interface StepWizardProps {
  /** Passos da trilha. Pode ter mais passos do que telas (o cadastro do tutor mostra "Seu pet" como próximo). */
  steps: readonly WizardStep[];
  /** Índice (base 0) do passo atual. */
  currentIndex: number;
  /** Título pequeno em maiúsculas acima da trilha, só no computador ("Criar conta"). */
  progressTitle: string;
  /** Nome acessível da navegação da trilha. */
  progressLabel?: string;
  /** Posição por extenso acima do título ("Passo 1 de 3"). */
  position: string;
  /** Título (`h1`) do passo; recebe o foco quando o passo troca. */
  title: string;
  titleRef?: Ref<HTMLHeadingElement>;
  /** Frase de apoio logo abaixo do título. */
  intro?: ReactNode;
  /** Aviso do passo (erro, limite), entre a frase de apoio e o conteúdo. */
  notice?: ReactNode;
  /** Conteúdo do passo: o formulário com os campos e os botões (`StepWizardActions`). */
  children: ReactNode;
  /** Linha depois do formulário ("Já tem conta? Entrar"). */
  footer?: ReactNode;
  /**
   * Terceira coluna, só no computador largo (`lg` em diante): o resultado se montando ao vivo (o card do cantinho,
   * 104). Fica presa ao rolar. Abaixo de `lg` some, e quem usa mostra o resultado em outro lugar (na revisão). Sem
   * ela, a casca é a de duas colunas do cadastro.
   */
  aside?: ReactNode;
}

/**
 * Casca de um assistente em passos, a do cadastro de conta (074): trilha de cartões à esquerda (anel no celular),
 * posição, título e conteúdo do passo à direita, com a entrada animada a cada troca; com `aside`, uma terceira coluna
 * com o resultado ao vivo. Só apresentação: quem usa decide o passo, o formulário, a validação e o foco. Reúne o
 * cadastro (011/012), a verificação do anfitrião (098) e o cadastro do cantinho (104).
 *
 * @example
 * <StepWizard steps={steps} currentIndex={0} progressTitle="Criar conta" position="Passo 1 de 2" title="Você">
 *   <form>…<StepWizardActions backLabel="Voltar" nextLabel="Continuar" nextType="submit" onBack={back} /></form>
 * </StepWizard>
 */
export function StepWizard({
  steps,
  currentIndex,
  progressTitle,
  progressLabel,
  position,
  title,
  titleRef,
  intro,
  notice,
  children,
  footer,
  aside,
}: StepWizardProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 3, md: 6, ...(aside ? { lg: 5 } : {}) },
        // Com a coluna ao vivo, as três cabem na grade do cabeçalho (1136 px a partir de `lg`).
        gridTemplateColumns: {
          xs: "1fr",
          md: "272px minmax(0, 720px)",
          ...(aside ? { lg: "240px minmax(0, 1fr) 288px" } : {}),
        },
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
          {progressTitle}
        </Typography>
        <WizardProgress steps={steps} currentIndex={currentIndex} label={progressLabel} appearance="cards" />
      </Reveal>

      <Reveal order={1}>
        <Box>
          <motion.div
            key={steps[currentIndex]?.id}
            initial={{ opacity: 0, x: currentIndex === 0 ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={MOTION_ASSENTAR}
          >
            <Typography
              sx={{ textTransform: "uppercase", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", mb: 1 }}
            >
              {position}
            </Typography>
            <Typography
              ref={titleRef}
              variant="h1"
              tabIndex={-1}
              sx={{ fontSize: { xs: 32, md: 40 }, mb: 1, "&:focus": { outline: "none" } }}
            >
              {title}
            </Typography>
            {intro && <Typography sx={{ mb: 3, color: "text.secondary" }}>{intro}</Typography>}
            {notice && <Box sx={{ mb: 3 }}>{notice}</Box>}
            {children}
            {footer && <Box sx={{ mt: 3, pb: { xs: 10, md: 0 } }}>{footer}</Box>}
          </motion.div>
        </Box>
      </Reveal>

      {aside && (
        <Box sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 24 }}>
          <Reveal order={2}>{aside}</Reveal>
        </Box>
      )}
    </Box>
  );
}

/** Botões Voltar/Continuar do passo, separados do conteúdo pela linha tracejada. Mesmas props do `FormActions`. */
export function StepWizardActions(props: FormActionsProps) {
  return (
    <Box sx={{ mt: 4, pt: 3, borderTop: "1px dashed", borderColor: "divider" }}>
      <FormActions {...props} />
    </Box>
  );
}
