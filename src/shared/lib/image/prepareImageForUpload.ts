import { IMAGE_RULES } from "../files/validateImageFile";

/** Lado maior da foto preparada: nítida o bastante para ler um documento, leve para o celular enviar. */
const MAX_SIDE_PX = 2560;
/** Qualidades tentadas em cada tamanho, da melhor para a menor aceitável. */
const QUALITIES = [0.9, 0.8, 0.7, 0.6] as const;
/** Quanto o lado diminui quando nenhuma qualidade coube, e quantas vezes tenta. */
const SHRINK_FACTOR = 0.75;
const SHRINK_ROUNDS = 4;

export type ImagePreparationErrorCode = "IMAGE_UNREADABLE" | "IMAGE_TOO_LARGE";

/**
 * Foto que não deu pra preparar: `IMAGE_UNREADABLE` (não é imagem ou o navegador não abre, como HEIC fora do
 * Safari) ou `IMAGE_TOO_LARGE` (nem reduzida coube no limite). A tela traduz o código numa frase.
 */
export class ImagePreparationError extends Error {
  readonly code: ImagePreparationErrorCode;

  constructor(code: ImagePreparationErrorCode) {
    super(code);
    this.name = "ImagePreparationError";
    this.code = code;
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/** Desenha o bitmap no tamanho dado e tenta as qualidades até caber; `null` se nenhuma coube. */
async function encodeToFit(bitmap: ImageBitmap, scale: number, maxBytes: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new ImagePreparationError("IMAGE_UNREADABLE");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of QUALITIES) {
    const blob = await encode(canvas, quality);
    if (blob && blob.size <= maxBytes) return blob;
  }
  return null;
}

async function decode(file: File): Promise<ImageBitmap> {
  if (file.size === 0 || !file.type.startsWith("image/")) throw new ImagePreparationError("IMAGE_UNREADABLE");
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImagePreparationError("IMAGE_UNREADABLE");
  }
}

const jpegName = (name: string) => `${name.replace(/\.[^.]+$/, "") || "foto"}.jpg`;

/**
 * Prepara uma foto para envio, no navegador (REQ-HVER-007): abre (gira pela orientação da câmera), reduz o lado maior
 * até 2560 px e regrava em JPEG, baixando a qualidade e depois o tamanho até caber em 5 MB. Regravar tira os
 * metadados (EXIF, GPS). Tudo em memória: nada vai para storage nem rede.
 *
 * Quando usar: antes de qualquer envio de foto tirada pelo celular (documentos 030, pets 021/022, avatar 015,
 * cantinho 044). Quando não usar: no servidor (precisa de canvas).
 *
 * @throws {ImagePreparationError} `IMAGE_UNREADABLE` ou `IMAGE_TOO_LARGE`
 * @example const ready = await prepareImageForUpload(file);
 */
export async function prepareImageForUpload(file: File, maxBytes = IMAGE_RULES.maxBytes): Promise<File> {
  const bitmap = await decode(file);
  try {
    let scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    for (let round = 0; round < SHRINK_ROUNDS; round++, scale *= SHRINK_FACTOR) {
      const blob = await encodeToFit(bitmap, scale, maxBytes);
      if (blob) return new File([blob], jpegName(file.name), { type: "image/jpeg" });
    }
    throw new ImagePreparationError("IMAGE_TOO_LARGE");
  } finally {
    bitmap.close();
  }
}
