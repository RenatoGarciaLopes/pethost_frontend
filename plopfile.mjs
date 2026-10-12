import {
  assertComponentName,
  assertFeatureName,
  assertLayerPath,
  componentFiles,
  featureFiles,
} from "./plop-templates/naming.mjs";

/** Adapta validadores que lançam Error ao contrato de prompts do Plop. */
const validate = (assert) => (value) => {
  try {
    assert(value);
    return true;
  } catch (error) {
    return error.message;
  }
};

/** Registra geradores; o loader do Plop exige este export default. */
export default function configurePlop(plop) {
  plop.setGenerator("feature", {
    description: "Cria as APIs públicas neutra, client e server de uma feature",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Nome da feature (kebab-case):",
        validate: validate(assertFeatureName),
      },
    ],
    actions: ({ name }) =>
      featureFiles(name).map((path, index) => ({
        type: "add",
        path,
        templateFile: `plop-templates/feature-${["neutral", "client", "server"][index]}.hbs`,
      })),
  });
  plop.setGenerator("component", {
    description: "Cria componente, teste vermelho, story e índice",
    prompts: [
      {
        type: "input",
        name: "layerPath",
        message: "Camada (relativa a src):",
        validate: validate(assertLayerPath),
      },
      {
        type: "input",
        name: "name",
        message: "Nome do componente (PascalCase):",
        validate: validate(assertComponentName),
      },
    ],
    actions: ({ layerPath, name }) =>
      componentFiles(layerPath, name).map((path, index) => ({
        type: "add",
        path,
        templateFile: `plop-templates/component-${["implementation", "test", "story", "index"][index]}.hbs`,
        data: {
          isClient: layerPath.endsWith("/client"),
          isServer: layerPath.endsWith("/server"),
        },
      })),
  });
}
