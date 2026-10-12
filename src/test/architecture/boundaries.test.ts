import path from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Prova que as fronteiras de arquitetura viram erro de lint (spec 001, REQ-TOOL-006 e REQ-TOOL-007).
 * Lint de código virtual em caminhos dentro de `fixtures/`, que espelha `src/` com slices mínimas.
 */
const root = path.resolve(__dirname, "../../..");
const fixtures = path.join(__dirname, "fixtures");

let eslint: ESLint;

beforeAll(async () => {
  eslint = new ESLint({ cwd: root, ignore: false });
  // Aquecimento: o primeiro lint carrega a config, os plugins e o resolvedor TypeScript (lento sob carga).
  await eslint.lintText("export const warmUp = 1;\n", { filePath: path.join(fixtures, "shared/warm-up.ts") });
}, 60_000);

async function ruleIdsFor(relativeFile: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: path.join(fixtures, relativeFile) });
  return result.messages.map((message) => message.ruleId ?? `fatal: ${message.message}`);
}

describe("fronteiras de arquitetura", () => {
  it("REQ-TOOL-006 feature não importa outra feature", async () => {
    const rules = await ruleIdsFor(
      "features/alpha/lib/uses-beta.ts",
      'import { beta } from "../../beta/index";\nexport const x = beta;\n',
    );
    expect(rules).toContain("boundaries/dependencies");
  });

  it("REQ-TOOL-006 feature importa a si mesma, shared e bibliotecas externas", async () => {
    const code = [
      'import { useState } from "react";',
      'import { util } from "../../../shared/util";',
      'import { internal } from "./internal";',
      "export const x = [useState, util, internal];",
      "",
    ].join("\n");
    expect(await ruleIdsFor("features/alpha/lib/ok.ts", code)).toEqual([]);
  });

  it("REQ-TOOL-006 shared não importa camada de cima", async () => {
    const rules = await ruleIdsFor(
      "shared/uses-feature.ts",
      'import { alpha } from "../features/alpha/index";\nexport const x = alpha;\n',
    );
    expect(rules).toContain("boundaries/dependencies");
  });

  it("REQ-TOOL-006 widget não importa outro widget, mas importa features", async () => {
    expect(
      await ruleIdsFor("widgets/one/uses-two.ts", 'import { two } from "../two/index";\nexport const x = two;\n'),
    ).toContain("boundaries/dependencies");
    expect(
      await ruleIdsFor(
        "widgets/one/uses-alpha.ts",
        'import { alpha } from "../../features/alpha/index";\nexport const x = alpha;\n',
      ),
    ).toEqual([]);
  });

  it("REQ-TOOL-006 código de cliente não importa código de servidor", async () => {
    const file = "features/alpha/components/client/Thing.tsx";
    expect(
      await ruleIdsFor(
        file,
        'import { alphaServer } from "../../api/server/alpha.server";\nexport const x = alphaServer;\n',
      ),
    ).toContain("no-restricted-imports");
    expect(await ruleIdsFor(file, 'import "server-only";\nexport const x = 1;\n')).toContain("no-restricted-imports");
  });

  it("REQ-TOOL-007 de fora da slice, só pelos arquivos index", async () => {
    expect(
      await ruleIdsFor("app/uses-internal.tsx", 'import { x } from "@/features/pets/lib/x";\nexport const y = x;\n'),
    ).toContain("no-restricted-imports");
    const publicApi = await ruleIdsFor(
      "app/uses-public.tsx",
      'import { x } from "@/features/pets/index.client";\nexport const y = x;\n',
    );
    expect(publicApi).not.toContain("no-restricted-imports");
  });

  it("REQ-TOOL-006 só teste e story importam a infraestrutura de src/test", async () => {
    const code = 'import { server } from "@/test/msw/server";\nexport const x = server;\n';

    expect(await ruleIdsFor("shared/thing.int.test.ts", code)).not.toContain("boundaries/dependencies");
    expect(await ruleIdsFor("shared/thing.ts", code)).toContain("boundaries/dependencies");
  });

  it("REQ-TOOL-006 export default só onde o Next exige", async () => {
    expect(await ruleIdsFor("features/alpha/lib/default.ts", "export default 1;\n")).toContain(
      "import/no-default-export",
    );
  });
});
