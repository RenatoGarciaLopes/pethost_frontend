import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { DoorScene } from "@/shared/ui/brand/DoorScene";
import { TrustList } from "@/shared/ui/data-display/TrustList";
import { authCopy } from "../lib/authCopy";
import { LoginForm } from "./client/LoginForm";

export interface LoginScreenProps {
  /** `account` (tutor e anfitrião, com a cena da porta) ou `admin` (sóbria, sem cena nem cadastro). */
  variant: "account" | "admin";
  initialRole: AccountRole;
  next: string | null;
}

/**
 * Tela de entrar (spec 010), Server Component. A cena, o título e as garantias são servidor;
 * a única ilha é o `LoginForm`.
 * - Computador: cena da porta e garantias à esquerda, formulário à direita (REQ-AUTH-016).
 * - Celular (até 700 px): título e cena pequena centralizados acima do formulário, sem garantias (REQ-AUTH-017).
 * - Admin: só o formulário, com o logo (REQ-AUTH-015).
 */
export function LoginScreen({ variant, initialRole, next }: LoginScreenProps) {
  const form = <LoginForm variant={variant} initialRole={initialRole} next={next} />;

  if (variant === "admin") {
    return (
      <Container component="main" id="conteudo" maxWidth="xs" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} sx={{ alignItems: "center", mb: 3 }}>
          <DoorMark size="header" withWordmark title="PetHost" interactive={false} />
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: 28, md: 34 }, textAlign: "center" }}>
            {authCopy.adminTitle}
          </Typography>
        </Stack>
        <Paper sx={{ p: { xs: 3, md: 4 } }}>{form}</Paper>
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
      {/* Computador: cena grande, título e garantias. */}
      <Stack spacing={4} sx={{ display: { xs: "none", md: "flex" }, alignItems: "flex-start" }}>
        <Box>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {authCopy.greeting}
          </Typography>
          <Typography variant="h1" component="h1" sx={{ fontSize: 48, maxWidth: 520 }}>
            {authCopy.title}
          </Typography>
        </Box>
        <DoorScene size="lg" />
        <TrustList items={authCopy.trust} />
      </Stack>

      {/* Celular: título e cena pequena acima do formulário, para o botão caber sem rolar. */}
      <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", textAlign: "center" }}>
        <DoorScene size="sm" />
        <Typography variant="h1" component="p" aria-hidden sx={{ fontSize: 26 }}>
          {authCopy.title}
        </Typography>
      </Stack>

      <Paper sx={{ p: { xs: 2.5, md: 4 } }}>{form}</Paper>
    </Box>
  );
}
