"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useFormState, useWatch } from "react-hook-form";
import { Notice } from "@/shared/ui/feedback/Notice";
import { Surface } from "@/shared/ui/layout/Surface";
import { listingCopy } from "../../lib/listingCopy";
import { LISTING_STEP_IDS, type ListingStepId } from "../../lib/listingSteps";
import { listingSummary } from "../../lib/listingSummary";
import type { ListingFormValues } from "../../schemas/listingSchema";
import { ListingPreview } from "./ListingPreview";

const copy = listingCopy.review;
type BlockId = Exclude<ListingStepId, "review">;
const BLOCKS = LISTING_STEP_IDS.filter((id): id is BlockId => id !== "review");

export interface ListingReviewProps {
  firstName: string;
  /** Leva ao passo do bloco ("Editar"). */
  onEdit: (step: BlockId) => void;
}

function Block({ id, summary, detail, onEdit }: { id: BlockId; summary: string; detail?: string; onEdit: () => void }) {
  const { label } = listingCopy.wizard.steps[id];
  return (
    <Surface
      component="section"
      aria-labelledby={`revisao-${id}`}
      sx={{
        p: { xs: 2, md: 2.5 },
        display: "grid",
        gridTemplateColumns: "32px minmax(0, 1fr) auto",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: "text.primary",
          bgcolor: "success.main",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
        }}
      >
        ✓
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography id={`revisao-${id}`} component="h2" sx={{ fontWeight: 800, fontSize: 17 }}>
          {label}
        </Typography>
        <Typography sx={{ overflowWrap: "anywhere" }}>{summary}</Typography>
        {detail && (
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 14,
              color: "text.secondary",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {detail}
          </Typography>
        )}
      </Box>
      <Button variant="quiet" onClick={onEdit} aria-label={copy.editLabel(label)}>
        {copy.edit}
      </Button>
    </Surface>
  );
}

/**
 * "Confere e abre" (104, regra 11 da nota 17): a ficha inteira em blocos, um por passo, com "Editar" levando ao passo.
 * O endereço aparece inteiro (é o dono quem confere), com o lembrete de que o tutor só vê o bairro. Abaixo do
 * computador largo, o card como o tutor vê vem antes dos blocos (no computador ele fica na coluna ao lado). Erro da
 * API sem campo aparece aqui, anunciado.
 *
 * @example <ListingReview firstName="Cida" onEdit={(step) => goTo(step)} />
 */
export function ListingReview({ firstName, onEdit }: ListingReviewProps) {
  const values = useWatch() as ListingFormValues;
  const { errors } = useFormState({ name: "root" });
  const summary = listingSummary(values);
  const server = errors.root?.server?.message;
  const details: Partial<Record<BlockId, string>> = {
    title: values.description.trim(),
    address: copy.onlyNeighborhood,
  };
  return (
    <Stack spacing={3}>
      {server && <Notice tone="erro" title={server} />}
      <Box sx={{ display: { lg: "none" }, maxWidth: 360 }}>
        <ListingPreview firstName={firstName} />
      </Box>
      <Stack spacing={2}>
        {BLOCKS.map((id) => (
          <Block
            key={id}
            id={id}
            summary={id === "title" ? `“${summary.title}”` : summary[id]}
            detail={details[id]}
            onEdit={() => onEdit(id)}
          />
        ))}
      </Stack>
    </Stack>
  );
}
