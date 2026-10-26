"use client";
import { useState } from "react";
import { Box, Button, ButtonBase, Drawer, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { OkIcon } from "@/shared/ui/feedback/feedbackIcons";
import { visuallyHidden } from "../../a11y/visuallyHidden";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";

export interface WizardStep {
  /** Identificador estável do passo. */
  id: string;
  /** Nome curto ("Você", "Onde você mora"). */
  label: string;
  /** Apoio opcional da trilha; não é uma etapa extra nem um controle. */
  description?: string;
}

export type WizardProgressVariant = "trail" | "ring" | "auto";

/** Trilha de edição (107): cada passo é um botão que leva direto a ele, em qualquer ordem. */
export interface WizardNavigation {
  /** Bloqueia a troca enquanto a seção está salvando. */
  disabled?: boolean;
  /** Pedido de ir ao passo; quem usa decide se vai (pergunta antes quando há alteração não salva). */
  onSelect: (index: number) => void;
  /** Botão do anel (celular) que abre a lista dos passos numa folha embaixo ("Ir para outra seção"). */
  menuLabel: string;
}

export interface WizardProgressProps {
  steps: readonly WizardStep[];
  /** Índice (base 0) do passo atual. */
  currentIndex: number;
  /**
   * `trail`: trilha vertical (computador). `ring`: anel "n/total" + "Próximo: …" (celular).
   * `auto` (padrão) escolhe pela largura: anel abaixo do breakpoint `md`.
   */
  variant?: WizardProgressVariant;
  /** Nome acessível da navegação (padrão "Etapas"). */
  label?: string;
  /** Cards da trilha de cadastro; o anel compacto mantém a mesma interface. */
  appearance?: "connected" | "cards";
  /**
   * Edição (107): a trilha vira botões, sem "concluído" nem "a fazer" (tudo já existe); a descrição de cada passo
   * mostra o valor atual. No anel, o "Próximo" dá lugar à descrição do passo atual e a um botão que abre a lista. Sem
   * ela, a trilha só mostra onde a pessoa está.
   */
  navigation?: WizardNavigation;
}

type StepState = "feito" | "atual" | "falta";

const stateText: Record<StepState, string> = { feito: "concluído", atual: "passo atual", falta: "a fazer" };

/**
 * Progresso de um assistente em passos (REQ-DS-012). O passo atual tem `aria-current="step"`;
 * cada passo diz o estado em texto (não só pela cor). Sem `navigation`, não navega: só mostra onde a pessoa está.
 * Com `navigation` (edição em seções, 107), cada passo é um botão e o anel ganha a lista numa folha embaixo.
 *
 * @example <WizardProgress steps={[{ id: "voce", label: "Você" }, { id: "endereco", label: "Onde você mora" }]} currentIndex={0} />
 * @example <WizardProgress steps={sections} currentIndex={2} navigation={{ onSelect: goTo, menuLabel: "Ir para outra seção" }} />
 */
export function WizardProgress({
  steps,
  currentIndex,
  variant = "auto",
  label = "Etapas",
  appearance = "connected",
  navigation,
}: WizardProgressProps) {
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down("md"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigatedFromMenu, setNavigatedFromMenu] = useState(false);
  const resolved = variant === "auto" ? (narrow ? "ring" : "trail") : variant;

  if (resolved === "ring") {
    const total = steps.length;
    const position = Math.min(currentIndex + 1, total);
    const current = steps[currentIndex];
    const next = steps[currentIndex + 1];
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    return (
      <Box component="nav" aria-label={label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true" focusable="false">
            <circle cx="28" cy="28" r={radius} fill="none" stroke={theme.palette.divider} strokeWidth="6" />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke={theme.palette.success.main}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - position / total)}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
            />
            <circle cx="28" cy="28" r={radius + 4} fill="none" stroke={theme.palette.quintal.tinta} strokeWidth="2" />
          </svg>
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "0.95rem",
            }}
          >
            {position}/{total}
          </Box>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography component="p" aria-current="step" sx={{ fontWeight: 800, m: 0 }}>
            <Box component="span" sx={visuallyHidden}>
              {navigation ? `${position} de ${total}: ` : `Passo ${position} de ${total}: `}
            </Box>
            {current?.label}
          </Typography>
          {navigation ? (
            current?.description && (
              <Typography component="p" noWrap sx={{ color: "text.secondary", fontSize: "0.9rem", m: 0 }}>
                {current.description}
              </Typography>
            )
          ) : next ? (
            <Typography component="p" sx={{ color: "text.secondary", fontSize: "0.9rem", m: 0 }}>
              Próximo: {next.label}
            </Typography>
          ) : null}
        </Box>
        {navigation && (
          <>
            <Button
              disabled={navigation.disabled}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => {
                setNavigatedFromMenu(false);
                setMenuOpen(true);
              }}
              sx={{ flexShrink: 0, px: 2 }}
            >
              {navigation.menuLabel}
            </Button>
            <Drawer
              disableRestoreFocus={navigatedFromMenu}
              anchor="bottom"
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              slotProps={{
                paper: {
                  "aria-label": label,
                  sx: {
                    bgcolor: "background.default",
                    backgroundImage: "none",
                    border: "2px solid",
                    borderColor: "text.primary",
                    borderBottom: 0,
                    borderRadius: `${quintalRadii.card}px ${quintalRadii.card}px 0 0`,
                    maxHeight: "92dvh",
                    px: 2,
                    pt: 2.5,
                    pb: "max(16px, env(safe-area-inset-bottom))",
                  },
                },
              }}
            >
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, mb: 1.5, px: 1.5 }}>
                {label}
              </Typography>
              <Trail
                steps={steps}
                currentIndex={currentIndex}
                appearance="cards"
                disabled={navigation.disabled}
                onSelect={(index) => {
                  setNavigatedFromMenu(true);
                  setMenuOpen(false);
                  navigation.onSelect(index);
                }}
              />
            </Drawer>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box component="nav" aria-label={label}>
      <Trail
        steps={steps}
        currentIndex={currentIndex}
        appearance={appearance}
        onSelect={navigation?.onSelect}
        disabled={navigation?.disabled}
      />
    </Box>
  );
}

interface TrailProps {
  disabled?: boolean;
  steps: readonly WizardStep[];
  currentIndex: number;
  appearance: "connected" | "cards";
  onSelect?: (index: number) => void;
}

/** A lista dos passos: só leitura (cadastro) ou com um botão por passo (edição). */
function Trail({ steps, currentIndex, appearance, onSelect, disabled }: TrailProps) {
  const theme = useTheme();
  const navigable = Boolean(onSelect);
  const cards = appearance === "cards";
  const stateOf = (index: number): StepState =>
    index < currentIndex ? "feito" : index === currentIndex ? "atual" : "falta";

  return (
    <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: cards ? 0.5 : 0 }}>
      {steps.map((step, index) => {
        // Na edição nada está "feito" nem "a fazer": só o atual se destaca.
        const state = navigable ? (index === currentIndex ? "atual" : "falta") : stateOf(index);
        const current = state === "atual";
        const last = index === steps.length - 1;
        const box = {
          display: "grid",
          gridTemplateColumns: "32px 1fr",
          columnGap: 1.5,
          minHeight: last && !navigable ? 32 : 56,
          ...(cards
            ? {
                p: 1.5,
                border: "2px solid",
                borderColor: current ? "text.primary" : "transparent",
                borderRadius: `${quintalRadii.field}px`,
                bgcolor: current ? "background.paper" : "transparent",
                boxShadow: current ? hardShadow(3) : "none",
              }
            : {}),
        } as const;
        const content = (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  border: `2px solid ${theme.palette.quintal.tinta}`,
                  backgroundColor: cards
                    ? current
                      ? theme.palette.text.primary
                      : "transparent"
                    : state === "feito"
                      ? theme.palette.success.main
                      : current
                        ? theme.palette.primary.main
                        : theme.palette.background.paper,
                  color: cards && current ? theme.palette.background.paper : "inherit",
                  boxShadow: !cards && current ? `2px 2px 0 ${theme.palette.quintal.tinta}` : "none",
                  "& svg": { width: 18, height: 18 },
                }}
              >
                {state === "feito" ? <OkIcon /> : index + 1}
              </Box>
              {last || cards ? null : (
                <Box
                  aria-hidden="true"
                  sx={{
                    flex: 1,
                    width: 0,
                    my: 0.5,
                    borderLeft: `2px ${state === "feito" ? "solid" : "dashed"} ${theme.palette.quintal.tinta}`,
                  }}
                />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="span"
                sx={{
                  // No botão, o rótulo e o valor atual empilham; na trilha só leitura, o rótulo segue em linha.
                  display: navigable ? "block" : undefined,
                  pt: "4px",
                  fontWeight: current ? 800 : navigable ? 700 : 500,
                  color: state === "falta" && !navigable ? "text.secondary" : "text.primary",
                }}
              >
                {step.label}
                {!navigable && (
                  <Box component="span" sx={visuallyHidden}>
                    {" "}
                    ({stateText[state]})
                  </Box>
                )}
              </Typography>
              {step.description && (
                <Typography
                  component="span"
                  // Na edição o valor atual pode ser longo (a alimentação): uma linha só, com reticências.
                  noWrap={navigable}
                  sx={{ display: "block", mt: 0.5, fontSize: 13, color: "text.secondary" }}
                >
                  {step.description}
                </Typography>
              )}
            </Box>
          </>
        );
        return (
          <Box
            component="li"
            key={step.id}
            aria-current={!navigable && current ? "step" : undefined}
            data-state={state}
            sx={navigable ? undefined : box}
          >
            {onSelect ? (
              <ButtonBase
                disabled={disabled}
                aria-current={current ? "step" : undefined}
                onClick={() => onSelect(index)}
                sx={{
                  ...box,
                  width: "100%",
                  textAlign: "left",
                  alignItems: "start",
                  justifyContent: "stretch",
                  font: "inherit",
                  color: "inherit",
                  "&:hover": current ? undefined : { bgcolor: "quintal.cartao" },
                  [keyboardFocus()]: focusRing,
                }}
              >
                {content}
              </ButtonBase>
            ) : (
              content
            )}
          </Box>
        );
      })}
    </Box>
  );
}
