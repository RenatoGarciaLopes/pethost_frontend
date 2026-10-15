import { vi } from "vitest";

/**
 * Navegador de imagem falso para jsdom (que não tem `createImageBitmap` nem canvas): toda foto "abre" com 1200×900 e
 * o canvas "codifica" um JPEG pequeno, com o nome da foto original. Arquivo com `type` que não é imagem continua
 * recusado por `prepareImageForUpload`. Desfaça com `vi.unstubAllGlobals()` e `vi.restoreAllMocks()`.
 *
 * Quando usar: testes de tela que escolhem foto e passam por `prepareImageForUpload`. Quando não usar: o teste
 * unitário do próprio preparo, que controla tamanhos e falhas.
 *
 * @example beforeEach(() => fakeImageCanvas());
 */
export function fakeImageCanvas(): void {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 1200, height: 900, close: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, done) {
    done(new Blob([`jpeg ${this.width}x${this.height}`], { type: "image/jpeg" }));
  });
}
