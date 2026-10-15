import type { HomeType, ListingSpecies } from "../types";

/** Textos de "Montar meu cantinho" (spec 044), na voz da PetHost. Sem gênero presumido de quem lê. */
export const listingCopy = {
  pageTitles: {
    panel: "Meu painel · PetHost",
    new: "Abrir meu cantinho · PetHost",
    listing: "Meu cantinho · PetHost",
  },
  loading: "Buscando seu cantinho",
  loadError: "Não deu pra abrir seu cantinho.",

  species: {
    dog: "Cachorro",
    cat: "Gato",
    cockatiel: "Calopsita",
    parrot: "Papagaio",
    parakeet: "Periquito",
    canary: "Canário",
    rabbit: "Coelho",
    hamster: "Hamster",
    guinea_pig: "Porquinho-da-índia",
    fish: "Peixe",
    turtle: "Tartaruga ou jabuti",
    exotic: "Outro bicho (aceito conversar)",
  } satisfies Record<ListingSpecies, string>,
  homeTypes: { house: "Casa", apartment: "Apartamento" } satisfies Record<HomeType, string>,

  errors: {
    homeType: "Escolhe se é casa ou apartamento.",
    yesNo: "Marca Sim ou Não.",
    title: "Falta o título do cantinho.",
    titleLength: "O título vai até 80 caracteres.",
    description: "Conta um pouco da sua casa.",
    species: "Escolhe ao menos um tipo de bicho.",
    sizes: "Com cachorro ou gato, escolhe ao menos um porte.",
    capacity: (max: number) => `Escolhe de 1 a ${max} pets.`,
    rate: "A diária vai de R$ 10,00 a R$ 10.000,00.",
    weekdays: "Escolhe ao menos um dia.",
    tooLong: (max: number) => `Ficou comprido demais: vai até ${max} caracteres.`,
    address: {
      zipCode: "O CEP tem 8 números.",
      street: "Falta a rua.",
      number: "Falta o número (ou S/N).",
      neighborhood: "Falta o bairro.",
      city: "Falta a cidade.",
      state: "Escolhe a UF.",
      tooLong: (max: number) => `Ficou comprido demais: vai até ${max} caracteres.`,
    },
  },
} as const;
