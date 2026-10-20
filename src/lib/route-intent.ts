/**
 * Os parâmetros da pesquisa da landing, e como os levar através do registo.
 *
 * Quem escolhe uma rota na hero ("Luanda → Benguela") não a quer perder por ter
 * de criar conta. A rota atravessa três páginas — `/criar-conta`, `/verificar`
 * e finalmente `/app/explorar` — e em cada salto alguém tem de a repassar.
 *
 * **A lista é uma só, e não uma cópia por página.** Antes, o `SignUpPage` e o
 * `VerifyPage` enumeravam `de`/`para` cada um por si; acrescentar `modo` e
 * `provincia` obrigava a lembrar-se dos dois sítios, e esquecer um não dava
 * erro — dava uma pesquisa que chegava ao fim sem filtro, exactamente o bug que
 * estes parâmetros existem para corrigir.
 *
 * Os dois vocabulários são distintos de propósito:
 *
 * - `de` / `para` — ids de **município** (modo intermunicipal);
 * - `deProvincia` / `paraProvincia` — ids de **província** (interprovincial);
 * - `provincia` — a província que restringe os municípios, no intermunicipal;
 * - `modo` — `interprovincial` ou `intermunicipal`.
 *
 * Um id de província nunca viaja em `de`: o `GET /api/rides` valida os filtros
 * de município como UUIDs de localidade existentes, e um id de província ali
 * seria aceite pela forma e errado no sentido.
 */
export const ROUTE_INTENT_KEYS = [
	'modo',
	'provincia',
	'de',
	'para',
	'deProvincia',
	'paraProvincia',
] as const;

/**
 * Copia o intento de rota de `source` para `target`.
 *
 * Só copia o que existe: um valor ausente não vira `chave=`, que o
 * `URLSearchParams` trataria como uma string vazia e o destino como um filtro
 * vazio em vez de nenhum.
 */
export function carryRouteIntent(
	source: URLSearchParams,
	target: URLSearchParams,
): void {
	for (const key of ROUTE_INTENT_KEYS) {
		const value = source.get(key);
		if (value) target.set(key, value);
	}
}
