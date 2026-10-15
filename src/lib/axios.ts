import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiErrorBody } from '../types/api';
import { authClient } from './auth-client';

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

/*
 * Não há interceptor de pedido. A sessão vive num cookie que o servidor
 * plantou no login, o browser envia-o sozinho em cada pedido (por causa do
 * `withCredentials` acima), e o `AuthGuard` do backend lê-o de lá.
 *
 * O interceptor que punha `Authorization: Bearer <token>` lido do
 * `localStorage` saiu. Não é perda de função — o cookie transporta a mesma
 * sessão — é a condição em que o token deixa de ser legível por JavaScript e,
 * portanto, deixa de poder ser roubado por um XSS.
 */

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
		 *
		 * Quem termina a sessão é o `authClient`, que é o dono dela. Este
		 * ficheiro limita-se a avisar o `App`, que tem o router à mão.
		 */
		if (status === 401 && !url.includes('/api/auth/')) {
			void authClient.signOut().catch(() => {});
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
		/*
		 * A mensagem do servidor vive em `error.response.data.message`.
		 *
		 * `axios.isAxiosError<ApiErrorBody>(error)` só tipa o *corpo da
		 * resposta*; não transforma `error.message` na mensagem da API. A
		 * versão anterior lia `const { message } = error`, que é a
		 * descrição do axios — `"Request failed with status code 409"`. Como
		 * `message.length > 0` é quase sempre verdadeiro, a função devolvia
		 * isso e nunca chegava aos ramos de rede, e nenhuma das mensagens em
		 * português escritas no backend para o caso ("Já existe uma conta com
		 * este número.", "São precisas pelo menos 3 fotos", "A rejeição
		 * precisa de um motivo") chegava ao utilizador.
		 */
		const serverMessage = error.response?.data?.message;
		if (typeof serverMessage === 'string' && serverMessage.length > 0) {
			return serverMessage;
		}

		// O Nest manda `message` como array quando são vários erros de
		// validação sobre o mesmo campo.
		if (Array.isArray(serverMessage) && serverMessage.length > 0) {
			return serverMessage.join(' ');
		}

		if (error.code === 'ECONNABORTED') {
			return 'O servidor demorou a responder. Tenta de novo.';
		}
		if (!error.response) {
			return 'Sem ligação ao servidor. Verifica a tua internet.';
		}
	}
	return fallback;
}
