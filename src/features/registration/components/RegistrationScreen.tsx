import { Box, Stack, Typography } from "@mui/material";
import { registrationCopy } from "../lib/registrationCopy";
import { RegistrationWizard } from "./client/RegistrationWizard";

const { dataUse } = registrationCopy;

export interface RegistrationScreenProps {
  next: string | null;
}

/**
 * Tela de criar conta de tutor (spec 011), Server Component. A ilha é o `RegistrationWizard`;
 * a faixa lateral do computador ("o que a gente faz com cada dado") é servidor e entra como `aside`.
 * Celular: uma coluna, anel "1/2" e botão fixo embaixo (REQ-OREG-017).
 */
export function RegistrationScreen({ next }: RegistrationScreenProps) {
  return (
    <Box component="main" id="conteudo" sx={{ maxWidth: 1180, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 3, md: 8 } }}>
      <RegistrationWizard next={next} aside={<DataUseAside />} />
    </Box>
  );
}

/** Por que pedimos cada dado: responde ao medo de entregar CPF e endereço sem saber por quê. */
function DataUseAside() {
  return (
    <Stack component="aside" aria-labelledby="uso-dos-dados" spacing={2}>
      <Typography id="uso-dos-dados" variant="h2" sx={{ fontSize: 20 }}>
        {dataUse.title}
      </Typography>
      <Stack component="dl" spacing={1.5} sx={{ m: 0 }}>
        {dataUse.items.map((item) => (
          <Box key={item.field}>
            <Typography component="dt" sx={{ fontWeight: 700 }}>
              {item.field}
            </Typography>
            <Typography component="dd" color="text.secondary" sx={{ m: 0 }}>
              {item.use}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
