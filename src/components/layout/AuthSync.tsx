import { useEffect } from 'react';
import { authClient, sessionUserFrom } from '../../lib/auth-client';
import { useAuthStore } from '../../stores/useAuthStore';

/**
 * Escreve o utilizador da sessão no store, a partir do `useSession()` do
 * `authClient`.
 *
 * Mountado uma vez no `App`. O store é uma projecção de leitura: o header e o
 * menu precisam do nome para pintar, e reescrevê-los todos para `useSession()`
 * faria cada um disparar um pedido ao servidor para desenhar um nome. Quem
 * decide se há sessão continua a ser o `useSession()`, que pergunta ao servidor.
 */
export function AuthSync() {
	const { data } = authClient.useSession();
	const setUser = useAuthStore((s) => s.setUser);

	useEffect(() => {
		setUser(data?.user ? sessionUserFrom(data.user) : null);
	}, [data, setUser]);

	return null;
}
