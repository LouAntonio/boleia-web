import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../lib/axios';
import { tokenFrom } from '../lib/auth';
import { qk } from '../lib/queryClient';
import * as api from '../lib/api';
import { useAuthStore, isAppRole } from '../stores/useAuthStore';
import type { AppRole, SessionUser } from '../types/api';

/**
 * O backend devolve o utilizador sem `surname` garante em todos os caminhos e
 * com `role` às vezes em minúsculas. Isto normaliza uma vez, aqui, em vez de
 * cada componente lidar com `user.role === 'driver' || user.role === 'DRIVER'`.
 */
export function toSessionUser(raw: unknown): SessionUser {
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
 * A sessão, revalidada do servidor a cada arranque.
 *
 * O token no `localStorage` diz se há alguém; esta query diz se ainda é
 * verdade. A diferença importa: um token revogado de outro sítio, uma conta
 * apagada, um limite de sessões — nada disso se percebe pelo token, e sem esta
 * query o site mostraria o perfil de uma conta que já não existe.
 *
 * Uma sessão que o servidor recusa limpa o store. Não é um detalhe: `RequireAuth`
 * manda quem não tem sessão para `/entrar`, e `RedirectIfAuthed` devolve à app
 * quem tem token. Se o token morre mas fica guardado, as duas guardingas
 * classificam a pessoa em sentidos opostos e o site nunca sai do lugar.
 */
export function useSession() {
	const token = useAuthStore((s) => s.token);
	const clearAuth = useAuthStore((s) => s.clearAuth);
	const setUser = useAuthStore((s) => s.setUser);

	return useQuery({
		queryKey: qk.session,
		queryFn: async () => {
			try {
				const user = await api.fetchSession();

				if (!user) {
					clearAuth();
					return null;
				}

				// A sessão pode ter mudado do lado do servidor — o papel muda, a
				// conta é banida — e o `token` sozinho não conta essa história.
				setUser(toSessionUser(user));
				return toSessionUser(user);
			} catch (error) {
				// Um 401 é o token que já não serve. Qualquer outra falha é a
				// rede: limpa-se na mesma, porque uma sessão que não se consegue
				// confirmar é uma sessão em que não se deve confiar, e o
				// `isError` da guarda mostra o que aconteceu.
				if (
					(error as { response?: { status?: number } })?.response
						?.status === 401
				) {
					clearAuth();
				}
				throw error;
			}
		},
		enabled: Boolean(token),
		// Sem `retry`: um 401 é a resposta definitiva, e tentar outra vez só
		// atrasa o redireccionamento para `/entrar`.
		retry: false,
		staleTime: 1000 * 60 * 5,
	});
}

/** Login por telefone e senha. */
export function useSignIn() {
	const setAuth = useAuthStore((s) => s.setAuth);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (input: api.PhoneCredentials) => {
			const response = await api.signInPhone(input);
			const token = tokenFrom(response.headers);

			/*
			 * Sem token não há sessão utilizável. Falhar aqui é melhor do que
			 * deixar o site "autenticado" sem credencial — que é como se
			 * aparece uma app que entra e falha em cada pedido.
			 */
			if (!token) {
				throw new Error('O servidor não devolveu um token de sessão.');
			}

			return {
				token,
				user: toSessionUser(response.data?.user),
			};
		},
		onSuccess: ({ token, user }) => {
			setAuth(token, user);
			queryClient.clear();
			toast.success('Entraste na tua conta');
			navigate('/app/explorar', { replace: true });
		},
		onError: (error: unknown) => {
			const status = (error as { response?: { status?: number } })?.response
				?.status;

			/*
			 * 403 aqui é o 403 do `phone/sign-in`: a conta existe mas o telefone
			 * ainda não foi verificado. Não é senha errada, e dizer "senha
			 * errada" seria mandar a pessoa a tentar de novo uma senha que está
			 * certa.
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

/** Termina a sessão, local e no servidor. */
export function useSignOut() {
	const clearAuth = useAuthStore((s) => s.clearAuth);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async () => {
			try {
				await api.signOut();
			} catch {
				/*
				 * Um logout que falha no servidor não impede o logout local: a
				 * sessão expira sozinha e o token deixa de servir. Entregar a
				 * pessoa à página de entrada com um erro de rede seria pior do
				 * que a deixar sair em silêncio.
				 */
			}
		},
		onSettled: () => {
			clearAuth();
			// A cache é da conta que está a sair. Mantê-la mostrava os dados da
			// conta anterior ao próximo que entrar.
			queryClient.clear();
			toast.success('Sessão terminada');
			navigate('/', { replace: true });
		},
	});
}

/** actualiza o perfil e reflecte logo na sessão. */
export function useUpdateProfile() {
	const setUser = useAuthStore((s) => s.setUser);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: api.updateProfile,
		onSuccess: (user) => {
			setUser(toSessionUser(user));
			queryClient.setQueryData(qk.session, toSessionUser(user));
			toast.success('Perfil guardado');
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível guardar o perfil.'),
			);
		},
	});
}
