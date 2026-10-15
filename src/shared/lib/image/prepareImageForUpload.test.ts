import { afterEach, describe, expect, it, vi } from "vitest";
import { IMAGE_RULES } from "../files/validateImageFile";
import { ImagePreparationError, prepareImageForUpload } from "./prepareImageForUpload";

afterEach(() => vi.unstubAllGlobals());

interface FakeCanvasSetup {
  width: number;
  height: number;
  /** Bytes do JPEG gerado para uma largura, altura e qualidade (simula a compressão). */
  bytesFor?: (width: number, height: number, quality: number) => number;
  decodeFails?: boolean;
}

/** Navegador falso: `createImageBitmap` e um canvas que "codifica" em blobs do tamanho pedido. */
function fakeBrowser({ width, height, bytesFor = (w, h, q) => w * h * q * 0.5, decodeFails = false }: FakeCanvasSetup) {
  const encoded: { width: number; height: number; quality: number; type: string }[] = [];
  const close = vi.fn();
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => {
      if (decodeFails) throw new Error("InvalidStateError");
      return { width, height, close };
    }),
  );
  vi.stubGlobal("document", {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (done: (blob: Blob | null) => void, type: string, quality: number) => {
          encoded.push({ width: canvas.width, height: canvas.height, quality, type });
          done(new Blob([new Uint8Array(Math.round(bytesFor(canvas.width, canvas.height, quality)))], { type }));
        },
      };
      return canvas;
    },
  });
  return { encoded, close };
}

const photo = (name = "documento.jpg", type = "image/jpeg", content = "JPEG com EXIF e GPS") =>
  new File([content], name, { type });

describe("prepareImageForUpload", () => {
  it("REQ-HVER-007 foto grande do celular sai reduzida, em JPEG, abaixo de 5 MB e com o lado maior até 2560", async () => {
    const { encoded, close } = fakeBrowser({ width: 4000, height: 3000 });
    const prepared = await prepareImageForUpload(photo("IMG_0001.HEIC", "image/heic"));

    expect(prepared.size).toBeLessThanOrEqual(IMAGE_RULES.maxBytes);
    expect(prepared.type).toBe("image/jpeg");
    expect(prepared.name).toBe("IMG_0001.jpg");
    expect(encoded[0]).toMatchObject({ width: 2560, height: 1920, type: "image/jpeg" });
    expect(close).toHaveBeenCalled();
  });

  it("REQ-HVER-007 baixa a qualidade e depois o tamanho até caber", async () => {
    // Só cabe com lado menor que 2560 e qualidade baixa.
    const { encoded } = fakeBrowser({ width: 4000, height: 3000, bytesFor: (w, h, q) => w * h * q * 2 });
    const prepared = await prepareImageForUpload(photo());

    expect(prepared.size).toBeLessThanOrEqual(IMAGE_RULES.maxBytes);
    const qualities = encoded.map((attempt) => attempt.quality);
    expect(qualities[0]).toBeGreaterThan(qualities[1]!);
    expect(encoded.at(-1)!.width).toBeLessThan(2560);
  });

  it("REQ-HVER-007 a saída é a imagem redesenhada: nada do arquivo original (EXIF, GPS) vai junto", async () => {
    fakeBrowser({ width: 800, height: 600 });
    const prepared = await prepareImageForUpload(photo("pequena.jpg", "image/jpeg", "EXIF GPS -23.4,-51.9"));
    expect(await prepared.text()).not.toContain("GPS");
    expect(prepared.size).toBe(Math.round(800 * 600 * 0.9 * 0.5));
  });

  it.each([
    ["não é imagem", photo("contrato.pdf", "application/pdf")],
    ["vazio", new File([], "vazia.jpg", { type: "image/jpeg" })],
  ])("REQ-HVER-007 arquivo que %s vira IMAGE_UNREADABLE", async (_, file) => {
    fakeBrowser({ width: 10, height: 10 });
    await expect(prepareImageForUpload(file)).rejects.toMatchObject({ code: "IMAGE_UNREADABLE" });
  });

  it("REQ-HVER-007 imagem que o navegador não consegue abrir vira IMAGE_UNREADABLE", async () => {
    fakeBrowser({ width: 10, height: 10, decodeFails: true });
    const error = await prepareImageForUpload(photo()).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ImagePreparationError);
    expect(error).toMatchObject({ code: "IMAGE_UNREADABLE" });
  });

  it("REQ-HVER-007 se nem pequena cabe em 5 MB, vira IMAGE_TOO_LARGE", async () => {
    fakeBrowser({ width: 4000, height: 3000, bytesFor: () => IMAGE_RULES.maxBytes + 1 });
    await expect(prepareImageForUpload(photo())).rejects.toMatchObject({ code: "IMAGE_TOO_LARGE" });
  });
});
