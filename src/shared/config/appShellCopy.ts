const ERROR_TITLE = "Deu um problema do nosso lado.";
/** Textos dos estados globais da casca, também utilizáveis sem tema/providers.
 * @example <SniffLoader label={appShellCopy.loading} />
 */
export const appShellCopy = {
  // SniffLoader acrescenta os três pontinhos decorativos, sem repetir o anúncio.
  loading: "Farejando",
  error: { title: ERROR_TITLE, description: "Tenta de novo; se continuar, fala com a gente." },
  notFound: {
    title: "Esse cantinho não existe",
    description: "Confere o endereço ou volta para o início.",
    home: "Voltar para o início",
  },
  globalError: {
    title: ERROR_TITLE,
    description: "Recarrega a página pra tentar de novo.",
    reload: "Recarregar",
  },
} as const;
