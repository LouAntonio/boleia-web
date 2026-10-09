/**
 * O token de sessão vive num cabeçalho de resposta, não no corpo.
 *
 * O plugin `bearer` do better-auth intercepta o `set-cookie` da sessão e escreve
 * o mesmo token num cabeçalho, para clientes que não podem usar cookies. É o
 * mecanismo que a app móvel usa (`mobile/src/lib/api.ts`), e é o mesmo aqui.
 *
 * Não há segredos neste ficheiro — só o nome do cabeçalho e a forma de o
 * tirar de um `AxiosHeaders`.
 */
export const TOKEN_HEADER = 'set-auth-token';

/** Extrai o token Bearer da resposta, se o servidor o tiver enviado. */
export function tokenFrom(headers: unknown): string | null {
	if (!headers || typeof headers !== 'object') return null;

	const direct = (headers as Record<string, unknown>)[TOKEN_HEADER];
	if (typeof direct === 'string' && direct.length > 0) return direct;

	// O axios 1.x normaliza os cabeçalhos para `AxiosHeaders`, que tem `.get()`.
	const get = (headers as { get?: (name: string) => unknown }).get;
	if (typeof get === 'function') {
		const value = get.call(headers, TOKEN_HEADER);
		return typeof value === 'string' && value.length > 0 ? value : null;
	}

	return null;
}
