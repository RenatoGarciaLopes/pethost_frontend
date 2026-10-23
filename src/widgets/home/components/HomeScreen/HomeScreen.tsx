"use client";

import { Box, Button, Checkbox, FormControl, FormLabel, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { loginRedirectPath } from "@/shared/config/appRoutes";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { focusRing } from "@/shared/theme/overrides/Button";
import { DoorScene, DOOR_TARGET_ATTR, DOOR_WARM_ATTR } from "@/shared/ui/brand/DoorScene";
import { GroundLine } from "@/shared/ui/brand/GroundLine";
import { Notice } from "@/shared/ui/feedback/Notice";
import { TrustList } from "@/shared/ui/data-display/TrustList";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { Surface } from "@/shared/ui/layout/Surface";
import { NearbyListings } from "../NearbyListings";
import { buildHomeSearchPath, type HomePetSpecies } from "../../lib/homeSearchPath";
import { homeDateLabel } from "../../lib/homeDateLabel";
import { homeCopy as copy } from "../../lib/homeCopy";

export interface HomePetOption {
  id: string;
  name: string;
  species: string;
}

export interface HomeScreenProps {
  /** Sessão confirmada pela rota; visitante não consulta pets. */
  viewer: "visitor" | PersonalRole;
  /** Só id/nome/espécie dos pets ativos, sem dados privados. */
  pets: readonly HomePetOption[];
  petsUnavailable: boolean;
  /** Id da conta logada; `null` para visitante. Separa o cache da vitrine "perto de você". */
  accountId?: string | null;
}

const PET_COUNTS = [1, 2, 3, 4, 5, 6] as const;
// Keep focus on the control: a cell must never draw a colored :focus-within ring.
const cell = {
  position: "relative",
  minWidth: 0,
  minHeight: 56,
  px: { xs: 1, md: 2 },
  py: 0.5,
  // Represent native keyboard focus on the whole cell, including icon and label.
  "&:has(:focus-visible)": { ...focusRing, borderRadius: `${quintalRadii.control}px` },
  // The cell owns this indicator; don't draw a second rectangle through its label.
  "& .MuiInputBase-root .MuiInputBase-input:focus-visible": { outline: "none" },
} as const;
const separator = { borderRight: { xs: "none", md: "1px dashed" }, borderColor: "divider" } as const;
const label = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  lineHeight: "20px",
  color: "text.primary",
} as const;
const control = {
  width: "100%",
  fontSize: 14,
  lineHeight: "24px",
  "& input": { p: 0, minHeight: 28 },
  "& .MuiSelect-select": { py: 0, minHeight: "28px !important", display: "flex", alignItems: "center" },
} as const;

/**
 * Hero e faixa única de reserva da 040/T7. O AppHeader é composto pela rota, fora do único main.
 * Células mantêm rótulos, foco e seletores do sistema; o texto de datas é somente apresentação.
 * Visitante passa pelo login com next seguro; tutor seleciona ids; host informa quantidade fora da faixa.
 * @example <HomeScreen viewer="visitor" pets={[]} petsUnavailable={false} />
 */
export function HomeScreen({ viewer, pets, petsUnavailable, accountId = null }: HomeScreenProps) {
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
  const personalized = viewer === "owner" && selectedPets.length > 0;
  const title = personalized ? copy.petsTitle(selectedPets.map((pet) => pet.name)) : copy.genericTitle;
  const isPetList = viewer === "owner" && pets.length > 0 && !petsUnavailable;
  const isHost = viewer === "host";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const path = buildHomeSearchPath({
      where,
      from,
      to,
      ...(isPetList ? { petIds } : isHost ? { petCount } : { species: species ? [species] : [] }),
    });
    router.push(viewer === "visitor" ? loginRedirectPath(path) : path);
  }

  return (
    <Box
      component="main"
      id="conteudo"
      tabIndex={-1}
      sx={{ color: "text.primary", bgcolor: "background.default", outline: "none" }}
    >
      <Box
        component="section"
        aria-labelledby="home-title"
        sx={(theme) => ({
          position: "relative",
          overflow: "hidden",
          backgroundImage: `url('/brand/paper-grain.png'), linear-gradient(180deg, ${theme.palette.scene.skyTop}, ${theme.palette.scene.skyMiddle} 65%, ${theme.palette.scene.skyBottom})`,
          backgroundSize: "256px 256px, cover",
          backgroundBlendMode: "multiply, normal",
        })}
      >
        <PageContainer width="page" sx={{ py: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.1fr) minmax(0, 1fr)" },
              alignItems: "end",
              pt: { xs: 4, md: 5 },
              minHeight: { md: 370 },
            }}
          >
            <Box sx={{ alignSelf: "start", pb: { xs: 1, md: 5 }, position: "relative", zIndex: 1 }}>
              <Typography
                component="h1"
                id="home-title"
                sx={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(44px, 5vw, 68px)",
                  lineHeight: 1.04,
                  letterSpacing: "-.025em",
                  maxWidth: "15ch",
                  m: 0,
                  mb: 2.5,
                }}
              >
                {title}
              </Typography>
              <Typography sx={{ fontSize: { xs: 17, md: 19 }, lineHeight: 1.65 }}>
                <Box component="span" sx={{ display: "block" }}>
                  {personalized ? copy.supportWithPets : copy.support}
                </Box>
                <Box component="span" sx={{ display: "block" }}>
                  {copy.supportSecond}
                </Box>
              </Typography>
            </Box>
            <Box
              aria-hidden="true"
              sx={{
                width: "100%",
                maxWidth: { xs: 390, md: 560 },
                mx: "auto",
                mb: -1,
                // O chão da cena fica acima do fundo do viewBox; no computador ela desce até pousar no gramado.
                transform: { md: "translateY(11%)" },
                position: "relative",
                zIndex: 1,
              }}
            >
              <DoorScene variant="house" />
            </Box>
          </Box>
        </PageContainer>
        <Box
          sx={{
            position: "relative",
            mt: { xs: -1, md: 0 },
            bgcolor: "scene.ground",
            borderBottom: "2px solid",
            borderColor: "text.primary",
          }}
        >
          <Box sx={{ position: "absolute", top: -40, left: 0, right: 0 }}>
            <GroundLine variant="wave" height={56} />
          </Box>
          <PageContainer
            width="page"
            sx={{ pt: { xs: 2, md: 2 }, pb: { xs: 4, md: 4 }, position: "relative", zIndex: 2 }}
          >
            {petsUnavailable && (
              <Box sx={{ mb: 2 }}>
                <Notice tone="atencao">{copy.petError}</Notice>
              </Box>
            )}
            <Surface
              component="form"
              aria-label="Busca de cantinhos"
              onSubmit={handleSubmit}
              elevation="md"
              {...{ [DOOR_TARGET_ATTR]: "" }}
              sx={{
                p: { xs: 1, md: 1.25 },
                boxShadow: "0 5px 0 var(--mui-palette-quintal-tinta)",
                borderRadius: {
                  xs: `${mobileOpen ? quintalRadii.card : quintalRadii.pill}px`,
                  md: `${quintalRadii.card}px`,
                },
              }}
            >
              <Button
                type="button"
                variant="text"
                aria-expanded={mobileOpen}
                aria-controls={`${ids}-fields`}
                onClick={() => setMobileOpen((open) => !open)}
                sx={{
                  minHeight: 56,
                  width: "100%",
                  justifyContent: "flex-start",
                  px: 2,
                  fontWeight: 700,
                  display: { xs: "flex", md: "none" },
                  mb: mobileOpen ? 1 : 0,
                }}
              >
                {mobileOpen ? copy.closeSearch : copy.openSearch}
              </Button>
              <Box
                id={`${ids}-fields`}
                sx={{
                  display: { xs: mobileOpen ? "grid" : "none", md: "grid" },
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1.25fr) minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(0, 1fr) auto",
                  },
                  alignItems: "center",
                  gap: { xs: 1, md: 0 },
                }}
              >
                <Box sx={{ ...cell, ...separator }}>
                  <FormLabel htmlFor={`${ids}-where`} sx={label}>
                    {copy.location}
                  </FormLabel>
                  <InputBase
                    id={`${ids}-where`}
                    placeholder={copy.locationPlaceholder}
                    value={where}
                    onChange={(event) => setWhere(event.target.value)}
                    sx={control}
                  />
                </Box>
                <Box sx={{ ...cell, ...separator }}>
                  <FormLabel htmlFor={`${ids}-from`} sx={label}>
                    {copy.checkIn}
                  </FormLabel>
                  <Typography aria-hidden="true" sx={{ fontSize: 14, lineHeight: "28px", whiteSpace: "nowrap" }}>
                    {homeDateLabel(from, "arrival")}
                  </Typography>
                  <Box
                    component="input"
                    id={`${ids}-from`}
                    type="date"
                    value={from}
                    onClick={(event) => event.currentTarget.showPicker?.()}
                    onChange={(event) => setFrom(event.target.value)}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  />
                </Box>
                <Box sx={{ ...cell, ...separator }}>
                  <FormLabel htmlFor={`${ids}-to`} sx={label}>
                    {copy.checkOut}
                  </FormLabel>
                  <Typography aria-hidden="true" sx={{ fontSize: 14, lineHeight: "28px", whiteSpace: "nowrap" }}>
                    {homeDateLabel(to, "departure", from)}
                  </Typography>
                  <Box
                    component="input"
                    id={`${ids}-to`}
                    type="date"
                    value={to}
                    onClick={(event) => event.currentTarget.showPicker?.()}
                    min={from || undefined}
                    onChange={(event) => setTo(event.target.value)}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  />
                </Box>
                <Box sx={{ ...cell, display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="svg"
                    viewBox="0 0 40 40"
                    aria-hidden="true"
                    focusable="false"
                    sx={{ width: 36, height: 36, flexShrink: 0, color: "text.primary" }}
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    <g fill="currentColor">
                      <ellipse cx="20" cy="24" rx="6" ry="5" />
                      <circle cx="11" cy="17" r="2.5" />
                      <circle cx="17" cy="12" r="2.5" />
                      <circle cx="24" cy="12" r="2.5" />
                      <circle cx="29" cy="18" r="2.5" />
                    </g>
                  </Box>
                  <FormControl fullWidth>
                    <FormLabel id={`${ids}-pet-label`} sx={label}>
                      {copy.pet}
                    </FormLabel>
                    {isPetList ? (
                      <Select<string[]>
                        variant="standard"
                        id={`${ids}-pet`}
                        labelId={`${ids}-pet-label`}
                        multiple
                        value={petIds}
                        input={<InputBase />}
                        sx={control}
                        onChange={(event) =>
                          setPetIds(
                            typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value,
                          )
                        }
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
                    ) : isHost ? (
                      <Select<number>
                        variant="standard"
                        id={`${ids}-pet`}
                        labelId={`${ids}-pet-label`}
                        value={petCount}
                        input={<InputBase />}
                        sx={control}
                        onChange={(event) => setPetCount(Number(event.target.value))}
                      >
                        {PET_COUNTS.map((amount) => (
                          <MenuItem key={amount} value={amount}>
                            {copy.count(amount)}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Select<HomePetSpecies | "">
                        variant="standard"
                        id={`${ids}-pet`}
                        labelId={`${ids}-pet-label`}
                        value={species}
                        displayEmpty
                        input={<InputBase />}
                        sx={control}
                        onChange={(event) => setSpecies(event.target.value as HomePetSpecies | "")}
                      >
                        <MenuItem value="">{copy.speciesPrompt}</MenuItem>
                        <MenuItem value="dog">{copy.species.dog}</MenuItem>
                        <MenuItem value="cat">{copy.species.cat}</MenuItem>
                      </Select>
                    )}
                  </FormControl>
                </Box>
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
                  sx={{ minHeight: 56, display: { xs: "inline-flex", md: "none" } }}
                >
                  {copy.searchMobile}
                </Button>
              </Box>
            </Surface>
            <Typography sx={{ position: "absolute", bottom: 4, fontSize: 14 }}>
              {isHost
                ? copy.hostHint
                : viewer === "visitor"
                  ? copy.guestHint
                  : isPetList
                    ? copy.ownerPetsHint
                    : copy.ownerEmptyHint}
            </Typography>
          </PageContainer>
        </Box>
      </Box>
      <PageContainer width="page" id="como-funciona" sx={{ py: { xs: 3, md: 4 }, scrollMarginTop: 80 }}>
        <TrustList variant="cards" items={copy.trust} />
      </PageContainer>
      <NearbyListings scope={accountId ?? "visitor"} />
    </Box>
  );
}
