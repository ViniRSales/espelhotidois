// Cliente HTTP único para falar com a API Spring Boot.
// Em desenvolvimento as chamadas vão para /api (proxy do Vite); em produção, para VITE_API_URL.

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export type CampoInvalido = { campo: string; mensagem: string };

/** Erro no formato padronizado devolvido pela API. */
export class ApiError extends Error {
  readonly status: number;
  readonly campos: CampoInvalido[];

  constructor(status: number, mensagem: string, campos: CampoInvalido[] = []) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }

  /** Mensagem do campo informado, para mostrar junto ao input. */
  erroDoCampo(campo: string) {
    return this.campos.find((c) => c.campo === campo)?.mensagem;
  }
}

let token: string | null = null;
let sessaoExpirada: (() => void) | null = null;

/** Guarda o token de login; enviado em todas as chamadas como `Authorization: Bearer`. */
export function definirToken(novoToken: string | null) {
  token = novoToken;
}

/**
 * Registra o que fazer quando a API recusa o token (401): expirado, revogado ou inválido.
 * Devolve a função que cancela o registro.
 */
export function aoExpirarSessao(callback: () => void) {
  sessaoExpirada = callback;
  return () => {
    if (sessaoExpirada === callback) sessaoExpirada = null;
  };
}

type Opcoes = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * Chama a API. Um `body` comum vai como JSON; um `FormData` (envio de arquivos) vai como está,
 * e o navegador define o `Content-Type` multipart com o separador correto.
 */
export async function api<T>(caminho: string, { body, headers, ...opcoes }: Opcoes = {}): Promise<T> {
  const ehJson = body !== undefined && !(body instanceof FormData);
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}/api${caminho}`, {
      ...opcoes,
      headers: {
        ...(ehJson && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: ehJson ? JSON.stringify(body) : (body as FormData | undefined),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar. Confira sua internet e tente de novo.');
  }

  if (resposta.status === 204) return undefined as T;

  const dados = await resposta.json().catch(() => null);
  // Só derruba a sessão se havia token: um 401 sem token é um login com senha errada, por exemplo.
  if (resposta.status === 401 && token) sessaoExpirada?.();
  if (!resposta.ok) {
    throw new ApiError(
      resposta.status,
      dados?.mensagem ?? 'Algo deu errado. Tente de novo em instantes.',
      dados?.campos ?? [],
    );
  }
  return dados as T;
}
