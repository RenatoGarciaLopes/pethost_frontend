import "server-only";
import { z } from "zod";

/**
 * Ambiente do servidor Next, validado na primeira leitura (spec 001, REQ-TOOL-015).
 *
 * **Quando usar:** em qualquer código de servidor que precise da URL da API ou de limites
 * de rede (`shared/api/server`, Route Handlers, `getSession`).
 * **Quando não usar:** em componente client. Nada daqui pode chegar ao navegador;
 * o `import "server-only"` faz o build falhar se isso acontecer.
 *
 * @example
 * const { backendApiBaseUrl } = getServerEnv();
 */
export interface ServerEnv {
  /** URL do backend .NET, sem barra final. Ex.: `http://localhost:5038`. */
  backendUrl: string;
  /** Prefixo das rotas da API. Ex.: `/api/v1`. */
  backendApiPrefix: string;
  /** `backendUrl` + `backendApiPrefix`, pronto para montar URLs. */
  backendApiBaseUrl: string;
  /** Tempo limite das chamadas ao backend, em milissegundos (padrão 15000). */
  requestTimeoutMs: number;
  /** Origens públicas do app (`APP_ORIGINS`), aceitas pelo CSRF quando o Next roda atrás de um proxy. */
  appOrigins: string[];
  /** `true` quando `NODE_ENV=production` (cookies `Secure`, logs reduzidos). */
  isProduction: boolean;
}

const DEFAULT_TIMEOUT_MS = 15_000;

const serverEnvSchema = z.object({
  BACKEND_URL: z
    .string({ required_error: "BACKEND_URL é obrigatória" })
    .url("BACKEND_URL precisa ser uma URL absoluta (http:// ou https://)")
    .refine((value) => /^https?:\/\//i.test(value), "BACKEND_URL precisa começar com http:// ou https://"),
  BACKEND_API_PREFIX: z
    .string({ required_error: "BACKEND_API_PREFIX é obrigatória" })
    .regex(/^\/\S*$/, "BACKEND_API_PREFIX precisa começar com /"),
  BACKEND_TIMEOUT_MS: z.coerce
    .number()
    .int("BACKEND_TIMEOUT_MS precisa ser inteiro")
    .positive("BACKEND_TIMEOUT_MS precisa ser maior que zero")
    .optional(),
  APP_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().regex(/^https?:\/\/[^/\s]+\/?$/, "APP_ORIGINS precisa listar origens http(s)://host"))),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/**
 * Valida um objeto de ambiente e devolve a configuração tipada.
 * Função pura (recebe o ambiente por parâmetro) para ser testável sem tocar em `process.env`.
 *
 * @throws Error com a lista de variáveis inválidas, uma por linha, citando o nome de cada uma.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Ambiente do servidor inválido:\n${problems.join("\n")}`);
  }

  const backendUrl = result.data.BACKEND_URL.replace(/\/+$/, "");
  return {
    backendUrl,
    backendApiPrefix: result.data.BACKEND_API_PREFIX,
    backendApiBaseUrl: `${backendUrl}${result.data.BACKEND_API_PREFIX}`,
    requestTimeoutMs: result.data.BACKEND_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
    appOrigins: result.data.APP_ORIGINS.map((origin) => origin.replace(/\/$/, "")),
    isProduction: result.data.NODE_ENV === "production",
  };
}

let cachedEnv: ServerEnv | undefined;

/** Lê e valida `process.env` uma vez por processo. */
export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}
