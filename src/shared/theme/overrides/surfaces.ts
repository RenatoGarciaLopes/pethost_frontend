import { quintalColors as c } from "../tokens/colors";
import { hardShadow } from "../tokens/shadows";
import { quintalRadii } from "../tokens/radii";
/** Shared outlined surfaces; use for cards/papers, never for nested decorative wrappers. */
export const surfaceStyles = {
  border: `2px solid ${c.tinta}`,
  borderRadius: quintalRadii.card,
  boxShadow: hardShadow(5),
  backgroundImage: "none",
};
/** Outlined fields keep visible labels above the input instead of placeholder-only labels. */
export const inputStyles = {
  minHeight: 56,
  backgroundColor: "#fff",
  borderRadius: quintalRadii.field,
  boxShadow: hardShadow(3),
  "& .MuiOutlinedInput-notchedOutline": { border: `2px solid ${c.tinta}` },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: c.tinta },
  "&.Mui-focused": { outline: `3px solid ${c.foco}`, outlineOffset: "3px" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: c.tinta },
  "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: c.erro },
};
