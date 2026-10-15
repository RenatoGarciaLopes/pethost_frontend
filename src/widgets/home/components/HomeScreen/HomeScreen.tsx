"use client";

import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { loginRedirectPath } from "@/shared/config/appRoutes";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { DoorScene, DOOR_TARGET_ATTR, DOOR_WARM_ATTR } from "@/shared/ui/brand/DoorScene";
import { TurmaWalker } from "@/shared/ui/brand/TurmaWalker";
import { Notice } from "@/shared/ui/feedback/Notice";
import { TrustList } from "@/shared/ui/data-display/TrustList";
import { buildHomeSearchPath, type HomePetSpecies } from "../../lib/homeSearchPath";
import { homeCopy as copy } from "../../lib/homeCopy";

export interface HomePetOption {
  /** Id do pet ativo; usado na busca 041, nunca exibido na URL como dado de perfil. */
  id: string;
  /** Nome informado no perfil do pet. */
  name: string;
  /** Espécie da API; a home só precisa exibir o nome e preservar o id. */
  species: string;
}

export interface HomeScreenProps {
  /** Visitante é anônimo; owner e host são sessão pessoal confirmada no servidor. */
  viewer: "visitor" | PersonalRole;
  /** Pets ativos reduzidos a id/nome/espécie; sem URL de foto nem campo privado. */
  pets: readonly HomePetOption[];
  /** Indica que a consulta opcional de pets falhou e que o seletor usa espécie como alternativa. */
  petsUnavailable: boolean;
}

const PET_COUNTS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Página pública de início (spec 040): hero do quintal, busca simples e garantias. A consulta de sessão e
 * os pets ficam no Server Component da rota; esta ilha recebe somente estado serializável.
 * Use para compor `/` sem duplicar a cena, a turma ou o selo de confiança.
 *
 * @example <HomeScreen viewer="owner" pets={[{ id: "pet-1", name: "Mel", species: "dog" }]} petsUnavailable={false} />
 */
export function HomeScreen({ viewer, pets, petsUnavailable }: HomeScreenProps) {
  const router = useRouter();
  const ids = useId();
  const [where, setWhere] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [petIds, setPetIds] = useState<string[]>(viewer === "owner" && pets[0] ? [pets[0].id] : []);
  const [species, setSpecies] = useState<HomePetSpecies | "">("");
  const [petCount, setPetCount] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedPets = pets.filter((pet) => petIds.includes(pet.id));
  const title =
    viewer === "owner" && selectedPets.length > 0
      ? copy.petsTitle(selectedPets.map((pet) => pet.name))
      : copy.genericTitle;
  const subtitle = viewer === "owner" && selectedPets.length > 0 ? copy.supportWithPets : copy.support;
  const isPetList = viewer === "owner" && pets.length > 0 && !petsUnavailable;
  const isHost = viewer === "host";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchPath = buildHomeSearchPath({
      where,
      from,
      to,
      ...(isPetList ? { petIds } : isHost ? { petCount } : { species: species ? [species] : [] }),
    });
    router.push(viewer === "visitor" ? loginRedirectPath(searchPath) : searchPath);
  }

  function handlePetIdsChange(value: string | string[]) {
    setPetIds(typeof value === "string" ? value.split(",") : value);
  }

  return (
    <Box component="main" id="conteudo" sx={{ color: "text.primary", bgcolor: "background.default" }}>
      <Box
        component="header"
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1320,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 1.5, md: 2 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <NextLink href="/" aria-label="PetHost, início" prefetch={false} style={{ display: "inline-flex" }}>
          <DoorMark withWordmark interactive={false} />
        </NextLink>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {viewer === "visitor" ? (
            <>
              <Link
                component={NextLink}
                href="/login"
                underline="hover"
                sx={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}
              >
                {copy.signIn}
              </Link>
              <Button component={NextLink} href="/register" variant="outlined" sx={{ minHeight: 44 }}>
                {copy.signUp}
              </Button>
            </>
          ) : (
            <Button component={NextLink} href="/users/profile" variant="outlined" sx={{ minHeight: 44 }}>
              {copy.account}
            </Button>
          )}
        </Stack>
      </Box>

      <Box
        component="section"
        aria-labelledby="home-title"
        sx={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: "background.default",
          backgroundImage:
            "linear-gradient(135deg, rgba(215,236,241,.78), rgba(245,240,221,.84)), url('/brand/paper-grain.png')",
          backgroundBlendMode: "normal, multiply",
          backgroundSize: "cover, 420px 420px",
          borderBottom: 2,
          borderColor: "divider",
          pt: { xs: 3, md: 5 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, .92fr) minmax(0, 1.08fr)" },
              gap: { xs: 1, md: 4 },
              alignItems: "center",
            }}
          >
            <Box sx={{ py: { xs: 1, md: 4 }, maxWidth: { md: 560 }, order: { xs: 1, md: 0 } }}>
              <Typography
                component="h1"
                id="home-title"
                sx={{
                  fontFamily: "var(--font-display)",
                  fontSize: { xs: "clamp(2.7rem, 11vw, 3.6rem)", md: "clamp(3.2rem, 5vw, 4.25rem)" },
                  lineHeight: 1.02,
                  letterSpacing: "-.025em",
                  maxWidth: "15ch",
                  mb: 2,
                }}
              >
                {title}
              </Typography>
              <Typography sx={{ fontSize: { xs: "1.05rem", md: "1.2rem" }, maxWidth: "40ch" }}>{subtitle}</Typography>
            </Box>

            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: 560,
                mx: "auto",
                aspectRatio: { xs: "1.3 / 1", md: "1.42 / 1" },
                order: { xs: 0, md: 1 },
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "absolute", inset: 0 }}>
                <DoorScene />
              </Box>
              <Box sx={{ position: "absolute", left: "3%", right: "3%", bottom: { xs: "11%", md: "10%" } }}>
                <TurmaWalker dogHeight={68} crossingMs={4000} intervalMs={14000} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ position: "relative", mt: { xs: -1, md: -3 }, zIndex: 1 }}>
        {petsUnavailable && <Notice tone="atencao">{copy.petError}</Notice>}
        <Paper
          component="form"
          aria-label="Busca de cantinhos"
          onSubmit={handleSubmit}
          elevation={0}
          {...{ [DOOR_TARGET_ATTR]: "" }}
          sx={{
            p: { xs: 2, md: 2.5 },
            border: 2,
            borderColor: "divider",
            borderRadius: { xs: 3, md: 4 },
            boxShadow: "6px 7px 0 rgba(41, 38, 35, .16)",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: { xs: "flex", md: "none" }, mb: mobileOpen ? 2 : 0 }}>
            <Button
              type="button"
              variant="text"
              aria-expanded={mobileOpen}
              aria-controls={`${ids}-fields`}
              onClick={() => setMobileOpen((open) => !open)}
              sx={{ minHeight: 48, px: 1.5, fontWeight: 700 }}
            >
              {mobileOpen ? copy.closeSearch : copy.openSearch}
            </Button>
          </Box>
          {(viewer === "visitor" || (viewer === "owner" && pets.length === 0)) && !petsUnavailable ? (
            <Typography sx={{ mb: 2, color: "text.secondary" }}>
              {viewer === "visitor" ? copy.guestHint : copy.ownerEmptyHint}
            </Typography>
          ) : null}
          {viewer === "owner" && isPetList && (
            <Typography sx={{ mb: 2, color: "text.secondary" }}>{copy.ownerPetsHint}</Typography>
          )}
          {isHost && <Typography sx={{ mb: 2, color: "text.secondary" }}>{copy.hostHint}</Typography>}

          <Box
            id={`${ids}-fields`}
            sx={{
              display: { xs: mobileOpen ? "grid" : "none", md: "grid" },
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(180px, 1.5fr) repeat(2, minmax(145px, 1fr)) minmax(180px, 1.3fr) auto",
              },
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <TextField
              id={`${ids}-where`}
              label={copy.location}
              placeholder={copy.locationPlaceholder}
              value={where}
              onChange={(event) => setWhere(event.target.value)}
              fullWidth
            />
            <TextField
              id={`${ids}-from`}
              label={copy.checkIn}
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              id={`${ids}-to`}
              label={copy.checkOut}
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            {isPetList ? (
              <FormControl fullWidth>
                <InputLabel id={`${ids}-pet-label`}>{copy.pet}</InputLabel>
                <Select<string[]>
                  id={`${ids}-pet`}
                  labelId={`${ids}-pet-label`}
                  label={copy.pet}
                  multiple
                  value={petIds}
                  onChange={(event) => handlePetIdsChange(event.target.value)}
                  renderValue={(selected) =>
                    pets
                      .filter((pet) => selected.includes(pet.id))
                      .map((pet) => pet.name)
                      .join(", ")
                  }
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet.id} value={pet.id}>
                      <Checkbox checked={petIds.includes(pet.id)} />
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : isHost ? (
              <FormControl fullWidth>
                <InputLabel id={`${ids}-pet-label`}>{copy.pet}</InputLabel>
                <Select<number>
                  id={`${ids}-pet`}
                  labelId={`${ids}-pet-label`}
                  label={copy.pet}
                  value={petCount}
                  onChange={(event) => setPetCount(Number(event.target.value))}
                >
                  {PET_COUNTS.map((amount) => (
                    <MenuItem key={amount} value={amount}>
                      {copy.count(amount)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth>
                <InputLabel id={`${ids}-pet-label`}>{copy.pet}</InputLabel>
                <Select<HomePetSpecies | "">
                  id={`${ids}-pet`}
                  labelId={`${ids}-pet-label`}
                  label={copy.pet}
                  value={species}
                  onChange={(event) => setSpecies(event.target.value as HomePetSpecies | "")}
                >
                  <MenuItem value="">
                    <em>{copy.speciesPrompt}</em>
                  </MenuItem>
                  <MenuItem value="dog">{copy.species.dog}</MenuItem>
                  <MenuItem value="cat">{copy.species.cat}</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button
              type="submit"
              variant="contained"
              {...{ [DOOR_WARM_ATTR]: "" }}
              sx={{ minHeight: 56, px: 2.5, whiteSpace: "nowrap", display: { xs: "none", md: "inline-flex" } }}
            >
              {copy.search}
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ minHeight: 52, display: { xs: "inline-flex", md: "none" } }}
            >
              {copy.searchMobile}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ maxWidth: 1000, mx: "auto", py: { xs: 3, md: 4 } }}>
          <TrustList items={copy.trust} label="Garantias da PetHost" />
        </Box>
      </Container>
    </Box>
  );
}
