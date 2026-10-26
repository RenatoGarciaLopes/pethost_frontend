import { PetAvatar } from "@/shared/ui/media/PetAvatar";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { describePet, speciesLabel } from "../lib/describePet";
import { petWizardCopy } from "../lib/petWizardCopy";
import type { PetWizardValues } from "../stores/petWizardStore";
import type { Pet } from "../types";

const yesNo = (value: boolean | undefined) =>
  value === undefined ? null : value ? petWizardCopy.health.yes : petWizardCopy.health.no;

/** O que já se sabe do pet como `Pet` da carteirinha, para o mesmo resumo da lista (REQ-PETS-011). */
function previewPet(values: PetWizardValues, coverUrl: string | null): Pet | null {
  if (!values.species) return null;
  return {
    id: "",
    name: values.name ?? "",
    species: values.species,
    speciesDescription: values.speciesDescription ?? null,
    breed: values.breed ?? null,
    size: values.size ?? null,
    birthDate: values.birthDate ?? null,
    sex: values.sex ?? "unknown",
    isNeutered: values.isNeutered ?? false,
    coverUrl,
    isActive: true,
  };
}

interface Block {
  /** Passo que edita o bloco (1 a 6). */
  step: number;
  title: string;
  lines: readonly (readonly [string, string | null | undefined])[];
}

function blocksOf(values: PetWizardValues): Block[] {
  const health = petWizardCopy.health;
  const social = petWizardCopy.social;
  return [
    {
      step: 1,
      title: petWizardCopy.stepLabels[0],
      lines: [
        [
          petWizardCopy.stepLabels[0],
          values.species ? speciesLabel(values.species, values.speciesDescription ?? null) : null,
        ],
      ],
    },
    {
      step: 3,
      title: petWizardCopy.stepLabels[2],
      lines: [[petWizardCopy.body.weightKg, values.weightKg === undefined ? null : `${values.weightKg} kg`]],
    },
    {
      step: 4,
      title: health.title,
      lines: [
        [health.vaccinated, yesNo(values.isVaccinated)],
        [health.neutered, yesNo(values.isNeutered)],
        [health.medicationNotes, values.medicationNotes],
        [health.allergies, values.allergies],
        [health.vet, values.vetContact],
        [health.microchip, values.microchip],
      ],
    },
    {
      step: 5,
      title: petWizardCopy.routine.title,
      lines: [
        [petWizardCopy.routine.feeding, values.feedingNotes],
        [petWizardCopy.routine.notes, values.notes],
      ],
    },
    {
      step: 6,
      title: petWizardCopy.stepLabels[5],
      lines: [
        [social.dogs, yesNo(values.goodWithDogs)],
        [social.cats, yesNo(values.goodWithCats)],
        [social.kids, yesNo(values.goodWithKids)],
      ],
    },
  ];
}

export interface PetProfileCardProps {
  values: PetWizardValues;
  /** Id persistido; cadastro usa a chave fixa de rascunho. */
  petId?: string;
  /** Prévia da capa (object URL da foto da vaga 1) ou `null`. */
  coverUrl: string | null;
  /** Data de referência da idade. */
  now: Date;
  /** Na revisão: "Editar" por bloco leva ao passo (REQ-PNEW-015). Sem ele, a carteirinha é só leitura. */
  onEdit?: (step: number) => void;
  /** A ficha (022) mostra todos os blocos, mesmo sem resposta (REQ-PEDIT-001); a prévia ao vivo só os preenchidos. */
  showEmptyBlocks?: boolean;
}

/**
 * Carteirinha completa do pet (variante `full`, REQ-PNEW-013, 015): capa, nome, o resumo de `describePet` e os
 * blocos de corpo, saúde, rotina e convivência com o que já foi respondido. Ao vivo no cadastro e na revisão;
 * a ficha (022) reaproveita.
 *
 * @example <PetProfileCard values={values} coverUrl={cover} now={now} onEdit={(step) => goTo(step)} />
 */
export function PetProfileCard({
  values,
  coverUrl,
  now,
  onEdit,
  showEmptyBlocks = false,
  petId = "draft",
}: PetProfileCardProps) {
  const pet = previewPet(values, coverUrl);
  const name = values.name || petWizardCopy.fallbackName;
  const blocks = blocksOf(values).map((block) => ({
    ...block,
    lines: block.lines.filter((line): line is readonly [string, string] => Boolean(line[1])),
  }));

  return (
    <Stack
      component="article"
      aria-label={petWizardCopy.review.cardLabel(name)}
      spacing={2}
      sx={{
        p: 2.5,
        border: 2,
        borderColor: "divider",
        borderRadius: `${quintalRadii.card}px`,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <PetAvatar aria-hidden="true" petId={petId} name={name} species={values.species} src={coverUrl} size={72} />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h3" sx={{ fontSize: 22 }}>
            {name}
          </Typography>
          {pet && (
            <Typography variant="body2" color="text.secondary">
              {describePet(pet, now) || speciesLabel(pet.species, pet.speciesDescription)}
            </Typography>
          )}
        </Box>
        {onEdit && (
          <Button
            size="small"
            onClick={() => onEdit(2)}
            aria-label={petWizardCopy.review.editBlock(petWizardCopy.stepLabels[1])}
            sx={{ ml: "auto" }}
          >
            {petWizardCopy.review.edit}
          </Button>
        )}
      </Stack>
      {blocks
        .filter((block) => onEdit || showEmptyBlocks || block.lines.length > 0)
        .map((block) => (
          <Box key={block.step}>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography component="h3" sx={{ fontWeight: 700 }}>
                {block.title}
              </Typography>
              {onEdit && (
                <Button
                  size="small"
                  onClick={() => onEdit(block.step)}
                  aria-label={petWizardCopy.review.editBlock(block.title)}
                >
                  {petWizardCopy.review.edit}
                </Button>
              )}
            </Stack>
            {block.lines.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {petWizardCopy.review.emptyBlock}
              </Typography>
            )}
            <Box component="dl" sx={{ m: 0, mt: 1, display: "grid", gap: 0.5 }}>
              {block.lines.map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Typography component="dt" variant="body2" color="text.secondary">
                    {label}:
                  </Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
    </Stack>
  );
}
