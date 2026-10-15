"use client";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { PawMark } from "@/shared/ui/brand/PawMark";
import { petQueries } from "../../../api/queries";
import { coexistenceSummary } from "../../../lib/coexistenceSummary";
import { speciesLabel, sizeLabel } from "../../../lib/describePet";
import { petsCopy } from "../../../lib/petsCopy";
/** Id do perfil anfitrião, nunca da conta. Requer QueryClientProvider. @example <HouseResidents hostId={host.id} /> */
export interface HouseResidentsProps {
  hostId: string;
}
/** Vitrine read-only para cantinhos: só dados públicos, silêncio em vazio/erro. Prefetch é opcional; falhas nunca bloqueiam a página. @example <HouseResidents hostId={host.id} /> */
export function HouseResidents({ hostId }: HouseResidentsProps) {
  const residents = useQuery(petQueries.house(hostId));
  const titleId = useId();
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && residents.error) {
      // Só status/código: não registra DTO, URL de imagem ou mensagem da API.
      console.error(
        "HouseResidents",
        isApiError(residents.error)
          ? { status: residents.error.status, code: residents.error.code }
          : { code: "UNKNOWN_ERROR" },
      );
    }
  }, [residents.error]);
  if (residents.isError || !residents.data?.length) return null;
  return (
    <Stack component="section" spacing={2} aria-labelledby={titleId}>
      <Typography component="h2" variant="h5" id={titleId}>
        {petsCopy.residents.title}
      </Typography>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {residents.data.map((resident) => {
          const summary = coexistenceSummary(resident);
          return (
            <Stack component="li" key={resident.id} direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar
                src={resident.coverUrl ?? undefined}
                alt=""
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "background.paper",
                  color: "text.secondary",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <PawMark size={28} />
              </Avatar>
              <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography sx={{ fontWeight: 700 }}>{resident.name}</Typography>
                <Typography color="text.secondary">
                  {[
                    speciesLabel(resident.species, resident.speciesDescription),
                    resident.size && sizeLabel(resident.size),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
                {summary && <Typography>{summary}</Typography>}
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Stack>
  );
}
