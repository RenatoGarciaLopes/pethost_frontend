import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { DoorScene } from "@/shared/ui/brand/DoorScene";
import { TrustList } from "@/shared/ui/data-display/TrustList";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { authCopy } from "../lib/authCopy";
import { LoginForm } from "./client/LoginForm";

export interface LoginScreenProps {
  /** `account` (tutor e anfitrião, com a cena da porta) ou `admin` (sóbria, sem cena nem cadastro). */
  variant: "account" | "admin";
  initialRole: AccountRole;
  next: string | null;
}

/**
 * Tela de entrar (spec 010), Server Component. Ilhas client: o `LoginForm`, a `DoorScene` e os `Reveal`.
 * A tela se monta em ordem (REQ-AUTH-020): saudação, título, cartão e campos, um a um; a cena se
 * desenha sozinha ao lado; as garantias chegam por último.
 * - Computador: cena da porta e garantias à esquerda, formulário à direita (REQ-AUTH-016).
 * - Celular (abaixo de 900 px, breakpoint `md`): cena pequena e título centralizados acima do formulário, sem saudação nem
 *   garantias (REQ-AUTH-017). O mesmo `h1` serve aos dois tamanhos.
 * - Admin: só o formulário, com o logo (REQ-AUTH-015).
 */
export function LoginScreen({ variant, initialRole, next }: LoginScreenProps) {
  const form = <LoginForm variant={variant} initialRole={initialRole} next={next} />;

  if (variant === "admin") {
    return (
      <Container component="main" id="conteudo" maxWidth="xs" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} sx={{ alignItems: "center", mb: 3 }}>
          <Reveal order={0}>
            <DoorMark size="header" withWordmark title="PetHost" interactive={false} />
          </Reveal>
          <Reveal order={1}>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: 28, md: 34 }, textAlign: "center" }}>
              {authCopy.adminTitle}
            </Typography>
          </Reveal>
        </Stack>
        <Reveal order={2}>
          <Paper sx={{ p: { xs: 3, md: 4 } }}>{form}</Paper>
        </Reveal>
      </Container>
    );
  }

  return (
    <Box
      component="main"
      id="conteudo"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(360px, 460px)" },
        gap: { xs: 2, md: 8 },
        px: { xs: 2, md: 8 },
        py: { xs: 3, md: 6 },
        maxWidth: 1240,
        mx: "auto",
      }}
    >
      <Stack
        useFlexGap
        spacing={{ xs: 1, md: 4 }}
        sx={{ alignItems: { xs: "center", md: "flex-start" }, textAlign: { xs: "center", md: "left" } }}
      >
        <Box>
          <Reveal order={0} sx={{ display: { xs: "none", md: "block" } }}>
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
              {authCopy.greeting}
            </Typography>
          </Reveal>
          <Reveal order={1}>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: 26, md: 48 }, maxWidth: 520 }}>
              {authCopy.title}
            </Typography>
          </Reveal>
        </Box>

        {/* No celular a cena vem antes do título; a ordem do DOM (título primeiro) vale para leitores de tela.
            A cena é interativa (REQ-AUTH-021) e se monta sozinha. */}
        <Box sx={{ width: "100%", maxWidth: { xs: 200, md: 440 }, order: { xs: -1, md: 0 } }}>
          <DoorScene />
        </Box>

        <Reveal order={7} sx={{ display: { xs: "none", md: "block" } }}>
          <TrustList items={authCopy.trust} />
        </Reveal>
      </Stack>

      <Reveal order={2}>
        <Paper sx={{ p: { xs: 2.5, md: 4 } }}>{form}</Paper>
      </Reveal>
    </Box>
  );
}
