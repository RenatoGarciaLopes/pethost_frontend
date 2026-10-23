import type { CopyCatalog } from "../../copyTypes";
import { invalid, numberParam, required, tooLong } from "../phrases";

/** Validação de campo: pet. */
export const petValidationCopy = {
  PET_ALLERGIES_TOO_LONG: tooLong("as alergias"),
  PET_BIRTH_DATE_IN_FUTURE: "A data de nascimento do pet não pode ser no futuro.",
  PET_BIRTH_DATE_INVALID_FORMAT: "Confere a data de nascimento do pet: o formato não é válido.",
  PET_BREED_TOO_LONG: tooLong("a raça"),
  PET_FEEDING_NOTES_TOO_LONG: tooLong("as observações de alimentação"),
  PET_GOOD_WITH_CATS_REQUIRED: "Diz se o pet convive bem com gatos.",
  PET_GOOD_WITH_DOGS_REQUIRED: "Diz se o pet convive bem com cães.",
  PET_GOOD_WITH_KIDS_REQUIRED: "Diz se o pet convive bem com crianças.",
  PET_IS_NEUTERED_REQUIRED: "Diz se o pet é castrado.",
  PET_IS_VACCINATED_REQUIRED: "Diz se o pet está com as vacinas em dia.",
  PET_KEEPER_ID_REQUIRED: required("o responsável"),
  PET_KEEPER_TYPE_INVALID: invalid("o tipo de responsável"),
  PET_MEDICATION_NOTES_TOO_LONG: tooLong("as observações de remédios"),
  PET_MICROCHIP_INVALID: ({ params }) => {
    const count = numberParam(params, "digits");
    return count ? `O microchip tem ${count} dígitos, só números.` : "Confere o número do microchip.";
  },
  PET_NAME_REQUIRED: required("o nome"),
  PET_NAME_TOO_LONG: tooLong("o nome"),
  PET_NOTES_TOO_LONG: tooLong("as observações"),
  PET_PET_ID_REQUIRED: required("o pet"),
  PET_PHOTO_ID_REQUIRED: required("a foto"),
  PET_PHOTO_ORDER_INVALID: "Confere a ordem das fotos.",
  PET_PHOTO_URL_INVALID: invalid("o endereço da foto"),
  PET_PHOTO_URL_TOO_LONG: tooLong("o endereço da foto"),
  PET_SEX_INVALID: invalid("o sexo"),
  PET_SEX_REQUIRED: required("o sexo"),
  PET_SIZE_INVALID: invalid("o porte"),
  PET_SIZE_NOT_ALLOWED: "Esse porte não vale pra essa espécie.",
  PET_SIZE_REQUIRED: required("o porte"),
  PET_SPECIES_DESCRIPTION_NOT_ALLOWED: "A descrição da espécie só vale quando a espécie é outra.",
  PET_SPECIES_DESCRIPTION_REQUIRED: "Conta qual é a espécie do pet.",
  PET_SPECIES_DESCRIPTION_TOO_LONG: tooLong("a descrição da espécie"),
  PET_SPECIES_INVALID: invalid("a espécie"),
  PET_SPECIES_REQUIRED: required("a espécie"),
  PET_VET_CONTACT_TOO_LONG: tooLong("o contato do veterinário"),
  PET_WEIGHT_OUT_OF_RANGE: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `O peso precisa ser maior que 0 e ir até ${max} kg.` : "Confere o peso do pet.";
  },
} satisfies CopyCatalog;
