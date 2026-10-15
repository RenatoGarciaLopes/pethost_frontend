import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { allDocumentsDto, hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { fakeImageCanvas } from "@/test/imageCanvas";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { hostApplicationDtoSchema, myApplicationSchema } from "../../../api/contracts";
import { myApplicationQueries } from "../../../api/queries";
import { toHostApplication, toMyApplication } from "../../../api/toMyApplication";
import { verificationCopy as copy } from "../../../lib/verificationCopy";
import { DocumentsStep, type PhotoState } from "./DocumentsStep";

const ACCOUNT = "account-1";
const photo = (name: string, type = "image/jpeg") => new File([`conteúdo ${name}`], name, { type });

beforeEach(() => {
  fakeImageCanvas();
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

function setup(application = hostApplicationDto()) {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const mine = toMyApplication(myApplicationSchema.parse(myApplicationDto({ application })));
  function Harness() {
    const [photos, setPhotos] = useState<PhotoState>({});
    return (
      <DocumentsStep
        accountId={ACCOUNT}
        application={toHostApplication(hostApplicationDtoSchema.parse(application))}
        photos={photos}
        onPhotosChange={setPhotos}
        onBack={onBack}
        onNext={onNext}
      />
    );
  }
  const view = renderWithProviders(<Harness />, { theme: quintalTheme });
  view.queryClient.setQueryData(myApplicationQueries.mine(ACCOUNT).queryKey, mine);
  return { ...view, onNext, onBack };
}

async function pickAll(user: ReturnType<typeof setup>["user"]) {
  await user.upload(screen.getByLabelText("Foto da frente do documento: galeria"), photo("frente.heic", "image/heic"));
  await user.upload(screen.getByLabelText("Foto do verso do documento: galeria"), photo("verso.jpg"));
  await user.upload(screen.getByLabelText("Selfie segurando o documento: galeria"), photo("selfie.png", "image/png"));
  await screen.findByRole("button", { name: "Selfie segurando o documento, foto escolhida" });
}

describe("DocumentsStep", () => {
  it("REQ-HVER-006 três vagas com o que se espera e as dicas", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: copy.photos.heading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Foto da frente do documento, vazia" })).toHaveAccessibleDescription(
      copy.photos.hints.front,
    );
    expect(screen.getByRole("button", { name: "Foto do verso do documento, vazia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selfie segurando o documento, vazia" })).toBeInTheDocument();
    expect(screen.getByText(copy.photos.tips)).toBeInTheDocument();
  });

  it("REQ-HVER-010 sem as três fotos, continuar fica travado e diz o que falta", () => {
    setup();
    const next = screen.getByRole("button", { name: copy.photos.next });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription("Falta a frente, o verso e a selfie.");
  });

  it("REQ-HVER-007 foto que não é imagem é recusada na vaga, sem enviar", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Foto do verso do documento: galeria"), {
      target: { files: [photo("verso.pdf", "application/pdf")] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.photos.errors.IMAGE_UNREADABLE);
    expect(screen.getByRole("button", { name: "Foto do verso do documento, vazia" })).toBeInTheDocument();
  });

  it("REQ-HVER-007 REQ-HVER-008 prepara as fotos e manda as três num pedido só, já em JPEG", async () => {
    let parts: Record<string, string> = {};
    server.use(
      http.put("*/api/hosts/me/application/documents", async ({ request }) => {
        // O parser multipart do Node não lê o `File` do jsdom: confere o corpo cru (o cliente em Node usa `formData`).
        const body = await request.text();
        parts = Object.fromEntries(
          [...body.matchAll(/name="(\w+)"; filename="[^"]*"\r\nContent-Type: ([\w/]+)/g)].map(([, name, type]) => [
            name!,
            type!,
          ]),
        );
        return HttpResponse.json(apiOk(hostApplicationDto({ documents: allDocumentsDto, missingDocuments: [] })));
      }),
      http.get("*/api/hosts/me/application", () =>
        HttpResponse.json(
          apiOk(
            myApplicationDto({ application: hostApplicationDto({ documents: allDocumentsDto, missingDocuments: [] }) }),
          ),
        ),
      ),
    );
    const { user, onNext } = setup();
    await pickAll(user);
    await user.click(screen.getByRole("button", { name: copy.photos.next }));

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(parts).toEqual({ front: "image/jpeg", back: "image/jpeg", selfie: "image/jpeg" });
  });

  it("REQ-HVER-008 API recusa uma parte: o erro aparece na vaga certa e nada conta como enviado", async () => {
    server.use(
      http.put("*/api/hosts/me/application/documents", () =>
        HttpResponse.json(apiFail("VALIDATION_ERROR", "invalid", [{ field: "back", messages: ["Invalid image"] }]), {
          status: 400,
        }),
      ),
    );
    const { user, onNext } = setup();
    await pickAll(user);
    await user.click(screen.getByRole("button", { name: copy.photos.next }));

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.photos.errors.rejected);
    expect(
      screen.getByRole("button", { name: "Foto do verso do documento, foto escolhida" }),
    ).toHaveAccessibleDescription(`${copy.photos.hints.back} ${copy.photos.errors.rejected}`);
    expect(screen.getByRole("button", { name: "Foto da frente do documento, foto escolhida" })).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it.each([
    [409, "HOST_APPLICATION_DOCUMENT_ALREADY_EXISTS", "Essa foto já foi usada em outra vaga. Tira uma foto nova."],
    [413, "PAYLOAD_TOO_LARGE", copy.photos.errors.tooLarge],
  ])("REQ-HVER-008 REQ-HVER-019 %s %s vira aviso no passo", async (status, code, message) => {
    server.use(
      http.put("*/api/hosts/me/application/documents", () =>
        HttpResponse.json(apiFail(String(code)), { status: Number(status) }),
      ),
    );
    const { user, onNext } = setup();
    await pickAll(user);
    await user.click(screen.getByRole("button", { name: copy.photos.next }));

    expect(await screen.findByText(String(message))).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("REQ-HVER-010 fotos já enviadas antes contam: segue sem reenviar", async () => {
    const { user, onNext } = setup(hostApplicationDto({ documents: allDocumentsDto, missingDocuments: [] }));
    expect(screen.getByRole("button", { name: "Foto da frente do documento, enviada" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.photos.next }));
    expect(onNext).toHaveBeenCalled();
  });

  it("REQ-HVER-006 'Voltar' volta para os dados", async () => {
    const { user, onBack } = setup();
    await user.click(screen.getByRole("button", { name: copy.photos.back }));
    expect(onBack).toHaveBeenCalled();
  });
});
