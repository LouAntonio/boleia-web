import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { magicLinkClient } from 'better-auth/client/plugins';
import { isAppRole } from '../stores/useAuthStore';
import type { AppRole, SessionUser } from '../types/api';

/**
 * Cliente de autenticação oficial do better-auth.
 *
 * **A sessão vive num cookie.** `createAuthClient` põe `credentials: 'include'`
 * por omissão num browser, e o `AuthGuard` do backend lê a sessão do cookie
 * (`fromNodeHeaders`). O `apiClient` de axios deixou por isso de levar
 * `Authorization: Bearer` — não há token a anexar, e o que fica de fora é o
 * token legível por JavaScript, que é o que um XSS roubaria.
 *
 * O que muda para quem escreve aqui:
 *
 * - `authClient.useSession()` devolve `{ data, isPending, error, refetch }`, e
 *   o `data` é a sessão (com `user` dentro) ou `null`.
 * - `authClient.signIn.social()` trata do redirect do Google e sabe voltar
 *   pelo `callbackURL`. Deixou de ser preciso montar a URL à mão.
 * - Os endpoints `/phone/*` não são stock do better-auth: vêm de um plugin do
 *   backend. Vão pelo `phone-auth.ts`, não daqui.
 */
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	plugins: [
		/*
		 * `surname` e `phone` são `additionalFields` do servidor
		 * (`back/src/auth/auth.ts:126-137`). O servidor envia-os; o cliente só
		 * os conhece se lhos declararmos. É uma cópia que tem de fazer batência
		 * com a do backend — divergir dá `undefined` num campo que a pessoa vê.
		 */
		inferAdditionalFields({
			user: {
				phone: { type: 'string', required: false },
				surname: { type: 'string', required: false },
			},
		}),
		/*
		 * O link mágico é o modo de entrar sem senha: `signIn.magicLink`
		 * despoja o email e o servidor manda um link que, aberto, cria a
		 * sessão. O cliente precisa do plugin para o endpoint `/magic-link`
		 * fazer batência com o `magicLink()` do servidor.
		 */
		magicLinkClient(),
	],
});

export type Session = typeof authClient.$Infer.Session;

/** O utilizador normalizado no tipo que o site consome. */
export function sessionUserFrom(raw: unknown): SessionUser {
	const data = (raw ?? {}) as Record<string, unknown>;
	const role = String(data.role ?? 'USER').toUpperCase();

	return {
		id: String(data.id ?? ''),
		name: String(data.name ?? ''),
		surname: (data.surname as string | null) ?? null,
		email: String(data.email ?? ''),
		emailVerified: Boolean(data.emailVerified),
		image: (data.image as string | null) ?? null,
		phone: (data.phone as string | null) ?? null,
		role: isAppRole(role) ? (role as AppRole) : 'USER',
		banned: Boolean(data.banned),
		createdAt: (data.createdAt as string) ?? '',
	};
}

/**
 * Erro do cliente do better-auth, com a forma que o `apiErrorMessage` já lê.
 *
 * O `better-fetch` devolve `{ data, error }` e não faz `throw`; o axios faz
 * `throw` e o erro traz `response.data.message`. O `apiErrorMessage` — usado
 * por uns quinze componentes — só conhece a segunda forma.
 *
 * Esta classe é a costura entre as duas. Envolve o erro do better-fetch num
 * objecto com a forma do axios, para que nenhuma página tenha de saber de que
 * cliente HTTP veio a falha. Sem ela, `apiErrorMessage` devolveria o texto de
 * fallback numa falha que o servidor já tinha explicado por mensagem.
 */
export class AuthRequestError extends Error {
	readonly response: {
		status?: number;
		data: { message?: string; code?: string };
	};
	readonly isAuthClientError = true;

	constructor(message: string, status?: number, code?: string) {
		super(message);
		this.name = 'AuthRequestError';
		this.response = {
			status,
			data: { message, code },
		};
	}
}

/** Extrai `{ error, data }` do `better-fetch` e transforma em excepção. */
export function toAuthRequestError(
	result: { data: unknown; error: unknown },
	fallback: string,
): AuthRequestError | null {
	if (!result.error) return null;

	const err = result.error as {
		message?: unknown;
		status?: unknown;
		statusCode?: unknown;
		code?: unknown;
		body?: { message?: unknown; code?: unknown };
	};

	const message =
		(typeof err?.message === 'string' && err.message) ||
		(typeof err?.body?.message === 'string' && err.body.message) ||
		fallback;

	const status =
		(typeof err?.status === 'number' && err.status) ||
		(typeof err?.statusCode === 'number' && err.statusCode) ||
		undefined;

	const code =
		(typeof err?.code === 'string' && err.code) ||
		(typeof err?.body?.code === 'string' && err.body.code) ||
		undefined;

	return new AuthRequestError(message, status, code);
}
