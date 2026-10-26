import { Box } from "@mui/material";
import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { visuallyHidden } from "./visuallyHidden";

it("REQ-SHELL-007 texto escondido da tela continua no nome acessível", () => {
  renderWithProviders(
    <button type="button">
      CS{" "}
      <Box component="span" sx={visuallyHidden}>
        Menu da conta de Camila Souza
      </Box>
    </button>,
  );
  expect(screen.getByRole("button", { name: "CS Menu da conta de Camila Souza" })).toBeInTheDocument();
  expect(screen.getByText("Menu da conta de Camila Souza")).toHaveStyle({ position: "absolute", width: "1px" });
});
