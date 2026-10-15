import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppRole, SessionUser } from '../types/api';

const STORAGE_KEY = 'boleia-web-auth';

export interface AuthState {
	/**
	 * O utilizador da sessão, para leitura durante o render.
	 *
	 * **Não é a fonte de verdade.** A sessão vive num cookie que o JavaScript não
	 * lê; quem diz se é válida é `authClient.useSession()`, que pergunta ao
	 * servidor. Isto é uma projecção de leitura, escrita pelo `AuthSync` a
	 * partir dessa sessão.
	 *
	 * Existe porque há consumidores que não são hooks — o header e o menu
	 * precisam do nome para pintar, e o `partialize` precisa do id. Reescrever
	 * esses sítios todos para `useSession()` seria mais purista e pior: cada
	 * um deles passaria a disparar um pedido ao servidor para pintar um nome.
	 */
	user: SessionUser | null;
	setUser: (user: SessionUser | null) => void;
	/** Esvazia a projecção. A sessão em si é terminada pelo `authClient`. */
	clearAuth: () => void;
}

/**
 * O que sobrevive a um recarregamento da página.
 *
 * O `user` é aparado ao essencial — id, nome e papel — pela mesma razão que o
 * `adm` faz: o papel é o que o menu precisa para decidir o que mostrar, e o
 * resto da conta é revalidado contra o servidor a cada arranque. Guardar o
 * objecto inteiro faria o site mostrar um nome possivelmente desatualizado — ou
 * de uma conta já apagada — sem dar por isso.
 */
const essential = (user: SessionUser): SessionUser => ({
	id: user.id,
	name: user.name,
	surname: user.surname ?? null,
	email: user.email,
	emailVerified: user.emailVerified,
	image: user.image ?? null,
	phone: user.phone ?? null,
	role: user.role,
	createdAt: user.createdAt,
});

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (user) => set({ user: user ? essential(user) : null }),
			clearAuth: () => {
				// A chave também sai do `persist`: deixar o `user` rehidratado
				// depois de um logout faria o header mostrar o nome de uma conta
				// que já não tem sessão, durante o tempo que a `useSession` não
				// responde.
				localStorage.removeItem(STORAGE_KEY);
				set({ user: null });
			},
		}),
		{
			name: STORAGE_KEY,
			/*
			 * `version: 1` deita fora o que a versão 0 guardava.
			 *
			 * A versão 0 vivia no `localStorage` com a forma
			 * `{ state: { token, user } }`. O `merge` do zustand é raso: sem
			 * esta migração o `token` antigo continuaria lá para sempre — nunca
			 * lido por código novo, mas sempre exposto a qualquer script da
			 * página, que é exactamente o que esta migração veio eliminar.
			 *
			 * O custo é uma sessão terminada: a pessoa entra outra vez.
			 */
			version: 1,
			migrate: () => ({ user: null, setUser: () => {}, clearAuth: () => {} }),
			partialize: (state) => ({ user: state.user }),
		},
	),
);

/** Cargos com acesso ao site. `MODERATOR`, `SUPPORT` e `ADMIN` são do `adm`. */
export function isAppRole(role: unknown): role is AppRole {
	return (
		role === 'USER' ||
		role === 'DRIVER' ||
		role === 'MODERATOR' ||
		role === 'SUPPORT' ||
		role === 'ADMIN'
	);
}
