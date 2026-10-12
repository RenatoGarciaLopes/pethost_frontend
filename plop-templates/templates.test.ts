import { describe, expect, it } from "vitest";
import {
  assertComponentName,
  assertFeatureName,
  assertLayerPath,
  componentFiles,
  featureFiles,
  toKebabCase,
  toPascalCase,
} from "./naming.mjs";

describe("REQ-TOOL-012 nomes e anatomia", () => {
  it.each([
    ["pet-id-card", "PetIdCard"],
    ["PetIdCard", "PetIdCard"],
    ["pet_id card", "PetIdCard"],
    ["", ""],
    ["XMLParser", "XmlParser"],
  ])("REQ-TOOL-012 converte %s para PascalCase", (input, output) => expect(toPascalCase(input)).toBe(output));
  it.each([
    ["PetIdCard", "pet-id-card"],
    ["pet-id-card", "pet-id-card"],
    [" pet_id card ", "pet-id-card"],
    ["", ""],
    ["XMLParser", "xml-parser"],
  ])("REQ-TOOL-012 converte %s para kebab-case", (input, output) => expect(toKebabCase(input)).toBe(output));
  it.each(["pets", "pet", "host-applications", "a", "pets2"])("REQ-TOOL-012 aceita feature %s", (name) =>
    expect(() => assertFeatureName(name)).not.toThrow(),
  );
  it.each(["", "Pets", "pet_id", "-pets", "pets-", "pets--new", "../pets", " pets", "2pets", "ação"])(
    "REQ-TOOL-012 rejeita feature %s",
    (name) => expect(() => assertFeatureName(name)).toThrow(/nome.*kebab-case/i),
  );
  it.each(["PetIdCard", "A", "Pet2Card"])("REQ-TOOL-012 aceita componente %s", (name) =>
    expect(() => assertComponentName(name)).not.toThrow(),
  );
  it.each(["", "petIdCard", "Pet-card", "Pet_Card", " Pet", "../Pet", "2Pet", "Árvore"])(
    "REQ-TOOL-012 rejeita componente %s",
    (name) => expect(() => assertComponentName(name)).toThrow(/nome.*PascalCase/i),
  );
  it.each([
    "shared/ui/feedback",
    "shared/ui/form-fields",
    "features/pets/components/client",
    "features/pet/components/server",
    "widgets/pet-summary/components/client",
    "widgets/pet-summary/components/server",
  ])("REQ-TOOL-012 aceita camada %s", (path) => expect(() => assertLayerPath(path)).not.toThrow());
  it.each([
    "",
    "src/shared/ui/feedback",
    "shared/ui",
    "shared/ui/Feedback",
    "shared/ui/../feedback",
    "features/Pets/components/client",
    "features/pets/components",
    "widgets/pets/components/native",
    "features/pets/components/client/",
    "features/pets/components/client/extra",
    "shared\\ui\\feedback",
  ])("REQ-TOOL-012 rejeita camada %s", (path) => expect(() => assertLayerPath(path)).toThrow(/camada/i));
  it("REQ-TOOL-012 lista os quatro arquivos do componente", () => {
    expect(componentFiles("shared/ui/feedback", "PetIdCard")).toEqual([
      "src/shared/ui/feedback/PetIdCard/PetIdCard.tsx",
      "src/shared/ui/feedback/PetIdCard/PetIdCard.test.tsx",
      "src/shared/ui/feedback/PetIdCard/PetIdCard.stories.tsx",
      "src/shared/ui/feedback/PetIdCard/index.ts",
    ]);
  });
  it("REQ-TOOL-012 lista os três índices da feature", () => {
    expect(featureFiles("pets")).toEqual([
      "src/features/pets/index.ts",
      "src/features/pets/index.client.ts",
      "src/features/pets/index.server.ts",
    ]);
  });
  it("REQ-TOOL-012 valida antes de produzir caminhos", () => {
    expect(() => componentFiles("../escape", "Pet")).toThrow();
    expect(() => componentFiles("shared/ui/feedback", "../Pet")).toThrow();
    expect(() => featureFiles("../pets")).toThrow();
  });
});
