import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../lib/axios';
import { authClient, AuthRequestError, sessionUserFrom } from '../lib/auth-client';
import { signInPhone, type PhoneCredentials } from '../lib/phone-auth';
import * as api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';
import type { SessionUser } from '../types/api';

/**
 * Reexportado por compatibilidade com os consumidores antigos.
 *
 * A normalização passou para `lib/auth-client.ts`, ao lado do cliente que traz
 * o utilizador — mas vários ficheiros importavam este nome daqui.
 */
export { sessionUserFrom };

/** A sessão, revalidada do servidor a cada arranque. */
export function useSignIn(redirectTo?: string) {
	const clearAuth = useAuthStore((s) => s.clearAuth);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	/*
	 * O login por telefone chama `/phone/sign-in` com `$fetch`, e esse
	 * endpoint não está na lista de rotas que o better-auth observa. Sem este
	 * `refetch`, o atom do `useSession()` continua com o `null` de antes do
	 * login e a guarda manda a pessoa de volta para `/entrar` apesar de a
	 * sessão já existir no cookie.
	 */
	const { refetch: refetchSession } = authClient.useSession();

	return useMutation({
		mutationFn: async (input: PhoneCredentials) => {
			const response = await signInPhone(input);
			return sessionUserFrom(response.user);
		},
		onSuccess: async () => {
			/*
			 * A sessão fica em cookie, e quem a guarda é o `authClient`. O store
			 * é esvaziado aqui para que o `AuthSync` escreva o utilizador novo em
			 * cima do que lá estivesse, e não para "terminar sessão" — o que
			 * isto termina é a projecção de leitura de quem saiu.
			 */
			clearAuth();
			queryClient.clear();
			// Só depois de o servidor confirmar a sessão é que a navegação
			// pode acontecer. É esta espera que evita o refresh manual.
			await refetchSession();
			toast.success('Entraste na tua conta');
			/*
			 * `redirectTo` é o sítio de onde a pessoa saiu — a `RequireAuth`
			 * põe-no no `state`, e a `VerifyPage` põe o filtro escolhido na
			 * landing. Sem isto, entrar depois de uma sessão caducada a meio de
			 * uma pesquisa levava ao início e a pessoa perdia o que estava a
			 * fazer.
			 *
			 * Só aceita caminhos internos: um `state` com `https://…` faria do
			 * login um redireccionador para fora do site.
			 */
			const target =
				redirectTo &&
				redirectTo.startsWith('/') &&
				!redirectTo.startsWith('//')
					? redirectTo
					: '/app/explorar';
			navigate(target, { replace: true });
		},
		onError: (error: unknown) => {
			const status = (error as { response?: { status?: number } })?.response
				?.status;

			/*
			 * 403 aqui é o 403 do `phone/sign-in`: a conta existe, a senha
			 * está certa, mas o telefone ainda não foi verificado. Não é
			 * senha errada, e dizer "senha errada" seria mandar a pessoa a
			 * tentar de novo uma senha que está certa.
			 */
			if (status === 403) {
				toast.error('Falta verificar o teu telefone. Pede um código novo.');
				return;
			}
			toast.error(
				apiErrorMessage(error, 'Não foi possível entrar com essa senha.'),
			);
		},
	});
}

/** Termina a sessão, no servidor e localmente. */
export function useSignOut() {
	const clearAuth = useAuthStore((s) => s.clearAuth);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async () => {
			try {
				await authClient.signOut();
			} catch {
				/*
				 * Um logout que falha no servidor não impede o logout local: a
				 * sessão expira sozinha e deixa de servir. Entregar a pessoa à
				 * página de entrada com um erro de rede seria pior do que a
				 * deixar sair em silêncio.
				 */
			}
		},
		onSettled: () => {
			clearAuth();
			// A cache é da conta que está a sair. Mantê-la mostrava os dados da
			// conta anterior ao próximo que entrar. A sessão não está aqui — o
			// `signOut` acima já a revogou.
			queryClient.clear();
			toast.success('Sessão terminada');
			navigate('/', { replace: true });
		},
	});
}

/** Actualiza o perfil e reflecte logo na sessão. */
export function useUpdateProfile() {
	const setUser = useAuthStore((s) => s.setUser);
	// O atom da sessão é partilhado, por isso subscrever aqui não gera um
	// pedido extra: o `useSession` do `App` já o está a consultar.
	const { refetch: refetchSession } = authClient.useSession();

	return useMutation({
		mutationFn: api.updateProfile,
		onSuccess: async (patch) => {
			/*
			 * Merge, não substituição. `updateProfile` devolve só o que o
			 * servidor mudou (`{id, name, surname, bio, phone}`); tratar isso
			 * como a sessão inteira fazia o store preencher o resto com
			 * omissões — `role: 'USER'`, `email: ''`, `createdAt: ''` — e
			 * guardar o nome despromovia o utilizador a USER na store. Só o que
			 * veio do servidor muda; o resto fica.
			 */
			setUser(
				mergePatch(
					useAuthStore.getState().user,
					patch as Partial<SessionUser>,
				),
			);
			// E depois perguntamos ao servidor, que é quem manda. O store foi
			// corrigido para não piscar o nome velho; se o `refetch` trouxer
			// outra coisa, é o servidor a dizer a verdade e o `AuthSync` escreve.
			await refetchSession();
			toast.success('Perfil guardado');
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível guardar o perfil.'),
			);
		},
	});
}

/** Junta o que o servidor mudou à sessão conhecida. */
function mergePatch(
	current: SessionUser | null,
	patch: Partial<SessionUser>,
): SessionUser | null {
	if (!current) return { ...(patch as SessionUser) };
	return { ...current, ...patch };
}

export { AuthRequestError };
