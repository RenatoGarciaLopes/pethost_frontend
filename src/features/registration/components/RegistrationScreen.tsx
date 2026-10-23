import { Box } from "@mui/material";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { RegistrationWizard } from "./client/RegistrationWizard";
export interface RegistrationScreenProps {
  role: PersonalRole;
  next: string | null;
}
/** Composição server do cadastro, sem card externo nem coluna de dados. A ilha cuida dos dois passos reais. */
export function RegistrationScreen({ role, next }: RegistrationScreenProps) {
  return (
    <Box component="main" id="conteudo" sx={{ maxWidth: 1168, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
      <RegistrationWizard role={role} next={next} />
    </Box>
  );
}
