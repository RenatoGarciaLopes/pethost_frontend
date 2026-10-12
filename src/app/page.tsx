import { Box, Button, Card, Chip, Stack, TextField, Typography } from "@mui/material";

/** Temporary theme verification page, replaced by product home in spec 040. */
export default function Home() {
  return (
    <Box component="main" sx={{ maxWidth: 960, mx: "auto", p: { xs: 3, md: 6 } }}>
      <Typography variant="h1" gutterBottom>
        PetHost · Quintal
      </Typography>
      <Typography component="p" sx={{ mb: 3 }}>
        Um cantinho acolhedor para cada pet.
      </Typography>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h2">Seu próximo passo</Typography>
          <TextField label="Como seu pet se chama?" helperText="Página temporária de verificação do tema" />
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <Chip label="Tudo certo" variant="ok" />
            <Chip label="Atenção" variant="attention" />
          </Stack>
          <Button variant="contained">Continuar</Button>
          <Button variant="quiet">Voltar</Button>
        </Stack>
      </Card>
    </Box>
  );
}
