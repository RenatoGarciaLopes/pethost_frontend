/**
 * Cabeçalho interno (proxy → servidor) com o caminho e a query da página atual.
 * Layouts não recebem o pathname; `currentPath()` lê daqui para montar o `next` do login e do refresh.
 * O proxy sobrescreve o valor vindo do navegador, então ele não pode ser forjado de fora.
 */
export const CURRENT_PATH_HEADER = "x-pethost-path";
