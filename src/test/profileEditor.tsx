import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { ownerProfileDtoFixture } from "@/test/fixtures/account";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import type { ComponentType } from "react";
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
/** Liga o editor fornecido pela própria feature a providers reais e HTTP estrito.
 * @example const setupProfile = createProfileSetup(ProfileEditor); await setupProfile();
 */
export function createProfileSetup(ProfileEditor: ComponentType<{ userId: string; role: "owner" | "host" }>) {
  return async function setupProfile(role: "owner" | "host" = "owner", dto: unknown = ownerProfileDtoFixture) {
    router.refresh.mockClear();
    server.use(
      http.get("*/api/" + role + "s/me", () => HttpResponse.json(apiOk(dto))),
      http.get("https://viacep.com.br/ws/:cep/json/", () => HttpResponse.json({ erro: true })),
    );
    const result = renderWithProviders(<ProfileEditor userId="user-1" role={role} />, { theme: quintalTheme });
    await screen.findByRole("heading", { name: "Seu perfil", level: 1 });
    return result;
  };
}
/** Campo acessível, sem depender do markup MUI. @example field("CPF"); */
export const field = (label: string) => screen.getByLabelText(new RegExp("^" + label));
/** Botão do formulário do perfil. @example await user.click(saveButton()); */
export const saveButton = () => screen.getByRole("button", { name: "Salvar" });

export { router };

/** Frase pública do código recebido, sem usar mensagens internas da API. @example messageFor("OWNER_NOT_FOUND"); */
export function messageFor(code: string) {
  return translateError(new ApiError({ status: 400, code, message: code }));
}
