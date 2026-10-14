import { Link } from "@mui/material";
import { shellCopy } from "../lib/shellCopy";

/**
 * "Pular para o conteúdo" (REQ-SHELL-007): o primeiro foco da página, escondido até receber o foco do teclado,
 * leva ao `<main id="conteudo">` da casca.
 *
 * @example <SkipLink />
 */
export function SkipLink() {
  return (
    <Link
      href="#conteudo"
      sx={{
        position: "absolute",
        left: 16,
        top: -64,
        zIndex: "tooltip",
        px: 2,
        py: 1,
        bgcolor: "background.paper",
        border: 2,
        borderColor: "text.primary",
        borderRadius: 2,
        fontWeight: 700,
        "&:focus": { top: 16 },
      }}
    >
      {shellCopy.skipToContent}
    </Link>
  );
}
