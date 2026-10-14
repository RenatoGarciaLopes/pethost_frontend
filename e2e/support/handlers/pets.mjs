import { http } from "msw";
import { fail, ok, sessionUserOf } from "./session.mjs";
import { switchAccounts } from "./switchAccounts.mjs";
import { randomUUID } from "node:crypto";
import { PostApiV1PetsBody } from "../../../src/shared/api/generated/pets/pets.zod.ts";
import { validateImageFile } from "../../../src/shared/lib/files/validateImageFile.ts";
import { fileFingerprint } from "../../../src/shared/lib/files/fileFingerprint.ts";

const API = "http://localhost:5099/api/v1";

function pet(id, name, overrides = {}) {
  return {
    id,
    species: "dog",
    speciesDescription: null,
    name,
    breed: "Vira-lata",
    size: "medium",
    birthDate: "2022-03-10",
    sex: "female",
    isNeutered: true,
    isVaccinated: true,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithKids: true,
    photos: [],
    isActive: true,
    createdAt: "2026-10-01T12:00:00Z",
    updatedAt: "2026-10-01T12:00:00Z",
    ...overrides,
  };
}

/** Pets sintéticos da tutora "both" (spec 020): dois na lista e um fora dela. As outras contas não têm pet. */
const OWNER_PETS = [
  pet("0199d2a0-0000-7000-8000-0000000000e1", "Luna"),
  pet("0199d2a0-0000-7000-8000-0000000000e2", "Thor", { species: "cat", breed: null, size: null, sex: "male" }),
  pet("0199d2a0-0000-7000-8000-0000000000e3", "Mel", { isActive: false, deactivatedAt: "2026-09-01T12:00:00Z" }),
];
const petsByAccount = new Map();
const fingerprints = new Map();
function petsFor(user) {
  if (!petsByAccount.has(user.id)) {
    const scenario = switchAccounts.find((account) => account.user.id === user.id)?.scenario;
    petsByAccount.set(user.id, scenario === "both" && user.role === "owner" ? structuredClone(OWNER_PETS) : []);
  }
  return petsByAccount.get(user.id);
}
/** Restaura pets e fotos sintéticos entre jornadas. @example resetPets(); */
export function resetPets() {
  petsByAccount.clear();
  fingerprints.clear();
}
function validateBody(input) {
  const parsed = PostApiV1PetsBody.safeParse(input);
  if (!parsed.success)
    return {
      errors: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), messages: ["Confere esse campo."] })),
    };
  const value = Object.fromEntries(
    Object.entries(parsed.data)
      .filter(([, entry]) => entry != null)
      .map(([key, entry]) => [key, typeof entry === "string" ? entry.trim() : entry]),
  );
  const errors = [];
  const reject = (field, message) => errors.push({ field, messages: [message] });
  const species = [
    "dog",
    "cat",
    "cockatiel",
    "parrot",
    "parakeet",
    "canary",
    "rabbit",
    "hamster",
    "guinea_pig",
    "fish",
    "turtle",
    "exotic",
  ];
  if (!species.includes(value.species)) reject("species", "Escolhe que bicho é o seu.");
  if (!value.name || value.name.length > 60) reject("name", "Use um nome de até 60 caracteres.");
  if (value.species === "dog" && !value.size) reject("size", "Escolhe o porte do cachorro.");
  if (value.size && (!["dog", "cat"].includes(value.species) || !["small", "medium", "large"].includes(value.size)))
    reject("size", "Confere o porte.");
  if (value.species === "exotic" && !value.speciesDescription) reject("speciesDescription", "Conta que bicho é o seu.");
  if (!["male", "female", "unknown"].includes(value.sex)) reject("sex", "Escolhe o sexo ou marca Não sei.");
  for (const field of ["isVaccinated", "isNeutered", "goodWithDogs", "goodWithCats", "goodWithKids"])
    if (typeof value[field] !== "boolean") reject(field, "Marca Sim ou Não.");
  for (const [field, limit] of [
    ["speciesDescription", 60],
    ["breed", 60],
    ["medicationNotes", 1000],
    ["allergies", 1000],
    ["feedingNotes", 1000],
    ["vetContact", 160],
    ["notes", 2000],
  ])
    if (value[field]?.length > limit) reject(field, `Use até ${limit} caracteres.`);
  if (value.birthDate) {
    const date = new Date(`${value.birthDate}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value.birthDate) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.birthDate ||
      value.birthDate > new Date().toISOString().slice(0, 10)
    )
      reject("birthDate", "Confere a data de nascimento.");
  }
  if (
    value.weightKg !== undefined &&
    (!(value.weightKg > 0 && value.weightKg <= 150) ||
      Math.abs(value.weightKg * 1000 - Math.round(value.weightKg * 1000)) > 1e-8)
  )
    reject("weightKg", "Confere o peso.");
  if (value.microchip) {
    value.microchip = value.microchip.replace(/[\s-]/g, "");
    if (!/^\d{15}$/.test(value.microchip)) reject("microchip", "O microchip tem 15 números.");
  }
  if (value.species !== "exotic") delete value.speciesDescription;
  return { value, errors };
}

/**
 * `GET /pets/me` do mock: o dono uma vez e os pets da conta do token (spec 020).
 * @example app.use(createMiddleware(...petsHandlers));
 */
export const petsHandlers = [
  http.get(`${API}/pets/me`, ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    if (user.role === "admin") return fail(403, "FORBIDDEN");
    const pets = petsFor(user);
    return ok({ keeper: { id: user.id, type: user.role, name: user.fullName, avatarUrl: null }, pets });
  }),
  http.post(`${API}/pets`, async ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    if (user.role === "admin") return fail(403, "FORBIDDEN");
    if (switchAccounts.find((account) => account.user.id === user.id)?.scenario === "unverified")
      return fail(404, "PET_KEEPER_NOT_FOUND");
    const { value, errors } = validateBody(await request.json().catch(() => null));
    if (errors.length) return fail(400, "VALIDATION_ERROR", errors);
    if (value.microchip && [...petsByAccount.values()].flat().some((item) => item.microchip === value.microchip))
      return fail(409, "PET_MICROCHIP_ALREADY_REGISTERED");
    const createdAt = new Date().toISOString();
    const created = pet(randomUUID(), value.name, {
      breed: null,
      size: null,
      birthDate: null,
      ...value,
      photos: [],
      createdAt,
      updatedAt: createdAt,
    });
    petsFor(user).unshift(created);
    return ok(created, { status: 201 });
  }),
  http.post(`${API}/pets/:petId/photos`, async ({ request, params }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    if (user.role === "admin") return fail(403, "FORBIDDEN");
    const current = petsFor(user).find((item) => item.id === params.petId);
    if (!current) return fail(404, "PET_NOT_FOUND");
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string")
      return fail(400, "VALIDATION_ERROR", [{ field: "file", messages: ["Falta a foto."] }]);
    const valid = validateImageFile(file);
    if (!valid.ok)
      return fail(
        valid.reason === "size" ? 413 : valid.reason === "type" ? 415 : 400,
        valid.reason === "size"
          ? "PAYLOAD_TOO_LARGE"
          : valid.reason === "type"
            ? "UNSUPPORTED_MEDIA_TYPE"
            : "VALIDATION_ERROR",
        valid.reason === "empty" ? [{ field: "file", messages: ["Falta a foto."] }] : undefined,
      );
    if (file.name === "falha.jpg") return fail(500, "UNEXPECTED_ERROR");
    if (current.photos.length >= 3) return fail(422, "PET_PHOTO_LIMIT_REACHED");
    const fingerprint = await fileFingerprint(file);
    const known = fingerprints.get(current.id) ?? new Set();
    if (known.has(fingerprint)) return fail(409, "PET_PHOTO_ALREADY_EXISTS");
    known.add(fingerprint);
    fingerprints.set(current.id, known);
    const id = randomUUID();
    current.photos.push({ id, url: `https://images.example.test/pets/${current.id}/${id}.jpg` });
    current.updatedAt = new Date().toISOString();
    return ok(current);
  }),
];
