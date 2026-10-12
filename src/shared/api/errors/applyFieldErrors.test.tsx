import { screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ApiError } from "./ApiError";
import { applyFieldErrors } from "./applyFieldErrors";

interface FormValues {
  email: string;
  password: string;
  address: { zipCode: string };
}

const validationError = new ApiError({
  status: 400,
  code: "VALIDATION_ERROR",
  message: "Validation failed",
  fieldErrors: {
    email: ["Email is required."],
    "address.zipCode": ["Zip code is invalid.", "Zip code is required."],
    unknownField: ["ignored"],
  },
});

function Form({ error, onApplied }: { error: unknown; onApplied: (fields: string[]) => void }) {
  const {
    register,
    setError,
    formState: { errors },
  } = useForm<FormValues>();

  return (
    <form>
      <label htmlFor="email">E-mail</label>
      <input id="email" {...register("email")} />
      <p data-testid="email-error">{errors.email?.message}</p>
      <label htmlFor="password">Senha</label>
      <input id="password" {...register("password")} />
      <p data-testid="password-error">{errors.password?.message}</p>
      <label htmlFor="zip">CEP</label>
      <input id="zip" {...register("address.zipCode")} />
      <p data-testid="zip-error">{errors.address?.zipCode?.message}</p>
      <p data-testid="root-error">{errors.root?.server?.message}</p>
      <button
        type="button"
        onClick={() =>
          onApplied(applyFieldErrors(setError, error, { fields: ["email", "password", "address.zipCode"] }))
        }
      >
        aplicar
      </button>
    </form>
  );
}

describe("applyFieldErrors", () => {
  it("REQ-HTTP-006 leva cada mensagem ao campo certo, inclusive o aninhado, e foca o primeiro", async () => {
    const onApplied = vi.fn();
    const { user } = renderWithProviders(<Form error={validationError} onApplied={onApplied} />);

    await user.click(screen.getByRole("button", { name: "aplicar" }));

    expect(screen.getByTestId("email-error")).toHaveTextContent("Email is required.");
    expect(screen.getByTestId("zip-error")).toHaveTextContent("Zip code is invalid. Zip code is required.");
    expect(screen.getByTestId("password-error")).toBeEmptyDOMElement();
    expect(screen.getByLabelText("E-mail")).toHaveFocus();
    expect(onApplied).toHaveBeenCalledWith(["email", "address.zipCode"]);
  });

  it("REQ-HTTP-006 campo que o formulário não tem vai para root.server", async () => {
    const { user } = renderWithProviders(<Form error={validationError} onApplied={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "aplicar" }));

    expect(screen.getByTestId("root-error")).toHaveTextContent("ignored");
  });

  it("REQ-HTTP-006 erro sem fieldErrors não mexe no formulário", async () => {
    const onApplied = vi.fn();
    const { user } = renderWithProviders(<Form error={new Error("x")} onApplied={onApplied} />);

    await user.click(screen.getByRole("button", { name: "aplicar" }));

    expect(onApplied).toHaveBeenCalledWith([]);
    expect(screen.getByTestId("root-error")).toBeEmptyDOMElement();
  });
});
