import type { CopyCatalog } from "../../copyTypes";
import { digits, inPast, invalid, numberParam, required, tooFarAhead, tooLong, upTo } from "../phrases";

/** Validação de campo: listing. */
export const listingValidationCopy = {
  LISTING_ACCEPTED_SPECIES_INVALID: invalid("as espécies aceitas"),
  LISTING_ACCEPTED_SPECIES_REQUIRED: "Escolhe pelo menos uma espécie que o cantinho recebe.",
  LISTING_ACCEPTS_LARGE_REQUIRED: "Diz se o cantinho recebe pet de porte grande.",
  LISTING_ACCEPTS_MEDIUM_REQUIRED: "Diz se o cantinho recebe pet de porte médio.",
  LISTING_ACCEPTS_SMALL_REQUIRED: "Diz se o cantinho recebe pet de porte pequeno.",
  LISTING_AVAILABILITY_BLOCK_END_BEFORE_START: "A data final precisa ser depois da inicial.",
  LISTING_AVAILABILITY_BLOCK_END_INVALID: invalid("a data final"),
  LISTING_AVAILABILITY_BLOCK_END_REQUIRED: required("a data final"),
  LISTING_AVAILABILITY_BLOCK_END_TOO_FAR_AHEAD: tooFarAhead("a data final"),
  LISTING_AVAILABILITY_BLOCK_REASON_TOO_LONG: tooLong("o motivo"),
  LISTING_AVAILABILITY_BLOCK_START_IN_THE_PAST: inPast("a data inicial"),
  LISTING_AVAILABILITY_BLOCK_START_INVALID: invalid("a data inicial"),
  LISTING_AVAILABILITY_BLOCK_START_REQUIRED: required("a data inicial"),
  LISTING_AVAILABILITY_BLOCK_START_TOO_FAR_AHEAD: tooFarAhead("a data inicial"),
  LISTING_AVAILABLE_WEEKDAYS_INVALID: invalid("os dias da semana"),
  LISTING_AVAILABLE_WEEKDAYS_REQUIRED: required("os dias da semana"),
  LISTING_BLOCK_ID_REQUIRED: required("o bloqueio"),
  LISTING_CAPACITY_OUT_OF_RANGE: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `O cantinho recebe de 1 a ${max} pets por noite.` : "Confere a capacidade do cantinho.";
  },
  LISTING_CAPACITY_REQUIRED: required("a capacidade"),
  LISTING_CHECK_IN_FILTER_IN_THE_PAST: inPast("a chegada"),
  LISTING_CHECK_IN_FILTER_INVALID: invalid("a chegada"),
  LISTING_CHECK_IN_FILTER_REQUIRED: required("a chegada"),
  LISTING_CHECK_IN_FILTER_TOO_FAR_AHEAD: tooFarAhead("a chegada"),
  LISTING_CHECK_OUT_FILTER_INVALID: invalid("a saída"),
  LISTING_CHECK_OUT_FILTER_NOT_AFTER_CHECK_IN: "A saída precisa ser depois da chegada.",
  LISTING_CHECK_OUT_FILTER_REQUIRED: required("a saída"),
  LISTING_CITY_FILTER_TOO_LONG: tooLong("a cidade"),
  LISTING_CITY_REQUIRED: required("a cidade"),
  LISTING_CITY_TOO_LONG: tooLong("a cidade"),
  LISTING_COMPATIBILITY_PET_REQUIRED: required("o pet"),
  LISTING_COMPLEMENT_TOO_LONG: tooLong("o complemento"),
  LISTING_COORDINATES_INCOMPLETE: "Faltou uma das duas coordenadas do mapa.",
  LISTING_DESCRIPTION_REQUIRED: required("a descrição"),
  LISTING_DESCRIPTION_TOO_LONG: tooLong("a descrição"),
  LISTING_HAS_CATS_REQUIRED: "Diz se tem gato em casa.",
  LISTING_HAS_DOGS_REQUIRED: "Diz se tem cachorro em casa.",
  LISTING_HAS_KIDS_REQUIRED: "Diz se tem criança em casa.",
  LISTING_HAS_YARD_REQUIRED: "Diz se a casa tem quintal.",
  LISTING_HOME_TYPE_INVALID: "Escolhe o tipo de moradia.",
  LISTING_HOME_TYPE_REQUIRED: required("o tipo de moradia"),
  LISTING_HOST_ID_REQUIRED: required("o anfitrião"),
  LISTING_HOUSE_RULES_TOO_LONG: tooLong("as regras da casa"),
  LISTING_LATITUDE_OUT_OF_RANGE: "A latitude está fora do mapa.",
  LISTING_LISTING_ID_REQUIRED: required("o cantinho"),
  LISTING_LONGITUDE_OUT_OF_RANGE: "A longitude está fora do mapa.",
  LISTING_MAX_NIGHTLY_RATE_FILTER_INVALID: invalid("o valor máximo da diária"),
  LISTING_MIN_CAPACITY_FILTER_INVALID: upTo("a capacidade mínima"),
  LISTING_MIN_NIGHTLY_RATE_FILTER_INVALID: invalid("o valor mínimo da diária"),
  LISTING_NEIGHBORHOOD_FILTER_TOO_LONG: tooLong("o bairro"),
  LISTING_NEIGHBORHOOD_REQUIRED: required("o bairro"),
  LISTING_NEIGHBORHOOD_TOO_LONG: tooLong("o bairro"),
  LISTING_NIGHTLY_RATE_OUT_OF_RANGE: ({ params }) => {
    const min = numberParam(params, "min");
    const max = numberParam(params, "max");
    return min && max ? `A diária precisa ficar entre R$ ${min} e R$ ${max}.` : "Confere o valor da diária.";
  },
  LISTING_NIGHTLY_RATE_REQUIRED: required("a diária"),
  LISTING_NIGHTLY_RATE_TOO_PRECISE: "A diária aceita no máximo centavos, com duas casas depois da vírgula.",
  LISTING_NUMBER_REQUIRED: required("o número"),
  LISTING_NUMBER_TOO_LONG: tooLong("o número"),
  LISTING_PAGE_INVALID: invalid("a página"),
  LISTING_PAGE_SIZE_INVALID: upTo("o tamanho da página"),
  LISTING_PETS_FILTER_INVALID: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `A busca aceita de 1 a ${max} pets.` : "Confere a quantidade de pets.";
  },
  LISTING_PHOTO_ID_REQUIRED: required("a foto"),
  LISTING_PHOTO_ORDER_INVALID: "Confere a ordem das fotos.",
  LISTING_PHOTO_URL_INVALID: invalid("o endereço da foto"),
  LISTING_PHOTO_URL_TOO_LONG: tooLong("o endereço da foto"),
  LISTING_RADIUS_OUT_OF_RANGE: ({ params }) => {
    const min = numberParam(params, "min");
    const max = numberParam(params, "max");
    return min && max ? `O raio da busca precisa ficar entre ${min} e ${max} km.` : "Confere o raio da busca.";
  },
  LISTING_SIZE_FILTER_INVALID: invalid("os portes"),
  LISTING_SIZE_REQUIRED_FOR_DOGS_AND_CATS: "Escolhe pelo menos um porte que o cantinho recebe.",
  LISTING_SPECIES_FILTER_INVALID: invalid("a espécie"),
  LISTING_STATE_FILTER_INVALID: "Escolhe o estado pela sigla, como PR.",
  LISTING_STATE_INVALID: "Escolhe o estado pela sigla, como PR.",
  LISTING_STAY_FILTER_TOO_LONG: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `A estadia pode ter até ${max} noites.` : "Essa estadia é longa demais.";
  },
  LISTING_STREET_REQUIRED: required("a rua"),
  LISTING_STREET_TOO_LONG: tooLong("a rua"),
  LISTING_TITLE_REQUIRED: required("o título"),
  LISTING_TITLE_TOO_LONG: tooLong("o título"),
  LISTING_USER_ID_REQUIRED: required("o usuário"),
  LISTING_WEEKDAYS_FILTER_INVALID: invalid("os dias da semana"),
  LISTING_ZIP_CODE_INVALID: digits("o CEP"),
} satisfies CopyCatalog;
