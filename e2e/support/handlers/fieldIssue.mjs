/** Um campo recusado no formato da API (090): `messages[i]` em inglês/log e `errors[i]` com o código estável. */
export const fieldIssue = (field, message, code, params) => ({
  field,
  messages: [message],
  errors: [{ code, ...(params ? { params } : {}) }],
});
