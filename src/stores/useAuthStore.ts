import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppRole, SessionUser } from '../types/api';

const STORAGE_KEY = 'boleia-web-auth';

export interface AuthState {
	token: string | null;
	user: SessionUser | null;
	setAuth: (token: string, user: SessionUser) => void;
	setUser: (user: SessionUser) => void;
	/** Limpa a sessão sem mexer no `localStorage` — quem faz isso é o `App`. */
	clearAuth: () => void;
}

/**
 * O que sobrevive a um recarregamento da página.
 *
 * O `user` é aparado ao essencial — id, nome e papel — pela mesma razão que o
 * `adm` faz: o papel é o que o menu e as guardas de rota precisam para decidir o
 * que mostrar, e o resto da conta é revalidado por `useMe` contra o servidor.
 * Guardar o objecto inteiro faria o site mostrar um nome possivelmente
 * desatualizado — ou de uma conta já apagada — sem dar por isso.
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
			token: null,
			user: null,
			setAuth: (token, user) => set({ token, user: essential(user) }),
			setUser: (user) => set({ user: essential(user) }),
			clearAuth: () => set({ token: null, user: null }),
		}),
		{
			name: STORAGE_KEY,
			partialize: (state) => ({
				token: state.token,
				user: state.user,
			}),
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
