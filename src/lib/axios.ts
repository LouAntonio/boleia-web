import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '../types/api';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * O tempo que uma chamada pode ficar pendente antes de ser dada como perdida.
 *
 * O mesmo valor que a app móvel usa. Um valor menor rejeita cedo demais em
 * ligações fracas de Angola; um maior deixa o botão de "reservar" preso sem
 * explicação durante muito tempo.
 */
const TIMEOUT_MS = 15000;

export const apiClient: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	timeout: TIMEOUT_MS,
	headers: { 'Content-Type': 'application/json' },

	/*
	 * O backend devolve a sessão num cookie e o better-auth exige-o para
	 * `get-session` funcionar depois de recarregar a página. Sem isto o browser
	 * descarta o cookie e cada recarregamento volta a `/entrar` mesmo com a
	 * conta certa — que é o sintoma clássico deste bug.
	 */
	withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	return config;
});

/*
 * Eventos em vez de um redireccionamento.
 *
 * Um 401 pode acontecer em qualquer pedido — dentro de um `useQuery`, de uma
 * mutação, de um `onSubmit`. O axios não sabe o que há de contexto à volta, e
 * a sessão vive num store, não no router. Emitir um evento deixa o `App` (que
 * tem o router à mão) decidir: fechar sessão e levar a quem está a ler à
 * página de entrada com um aviso.
 */
export const UNAUTHORISED_EVENT = 'boleia:unauthorised';

apiClient.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		const status = axios.isAxiosError(error)
			? (error.response?.status ?? 0)
			: 0;
		const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : '';

		/*
		 * Só nas rotas de negócio. Um 401 de `/api/auth/*` é o servidor a dizer
		 * "esta senha está errada", que é uma mensagem de formulário e não uma
		 * sessão que caducou — limpá-lo aqui apagaria a conta do utilizador da
		 * tela enquanto ele ainda está a corrigir o formulário.
		 */
		if (status === 401 && !url.includes('/api/auth/')) {
			useAuthStore.getState().clearAuth();
			window.dispatchEvent(new CustomEvent(UNAUTHORISED_EVENT));
		}

		return Promise.reject(error);
	},
);

/**
 * Transforma um erro do axios numa frase que vale a pena ler.
 *
 * O backend manda uma única mensagem por erro, sem campos: `{ statusCode,
 * message, error }`. Este é o ponto único onde se sabe isso, em vez de repetir
 * o `err.response?.data?.message` em cada formulário.
 */
export function apiErrorMessage(
	error: unknown,
	fallback = 'Algo correu mal. Tenta de novo.',
): string {
	if (axios.isAxiosError<ApiErrorBody>(error)) {
		const { message, code } = error;

		if (typeof message === 'string' && message.length > 0) return message;

		// O axios usa isto quando o pedido foi cancelado por timeout.
		if (code === 'ECONNABORTED') {
			return 'O servidor demorou a responder. Tenta de novo.';
		}
		if (message === 'Network Error') {
			return 'Sem ligação ao servidor. Verifica a tua internet.';
		}
	}
	return fallback;
}
