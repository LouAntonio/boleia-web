import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSession } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

/**
 * A guarda de `/app`.
 *
 * Três estados, e é a distinção entre eles que importa:
 *
 * 1. **Sem token** — não há sessão em curso. Vai logo para `/entrar`, sem
 *    animação e sem ecrã em branco pelo meio.
 * 2. **Com token, sessão ainda a validar** — mostra o esqueleto. Sem isto, cada
 *    F5 em `/app` piscava a página de entrada antes de voltar ao site.
 * 3. **Com token, sessão recusada** — o token morreu (expirou, foi revogado, a
 *    conta foi apagada). O `App` já limpou o store; falta o caminho.
 *
 * A query só corre quando há token (`enabled: Boolean(token)`), por isso o caso
 * 1 não fica à espera de nada.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
	const token = useAuthStore((s) => s.token);
	const location = useLocation();
	const { isPending, isError } = useSession();

	if (!token) {
		return (
			<Navigate
				to="/entrar"
				replace
				// Onde estava. Sem isto, entrar a meio de uma pesquisa joga a
				// pessoa para o início e ela perde o que estava a fazer.
				state={{ from: location.pathname + location.search }}
			/>
		);
	}

	if (isPending) return <ShellSkeleton />;

	/*
	 * `isError` com token ainda guardado significa que a rede falhou, não que a
	 * sessão morreu: o `useSession` já limpou o store no caso do 401. Dizer
	 * "a sessão terminou" por causa de um timeout seria mentira, e o botão de
	 * reentrar levaria a uma página que volta a deixá-la a sair.
	 */
	if (isError) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
				<h1 className="text-h2 text-ink">
					Não foi possível confirmar a sessão
				</h1>
				<p className="max-w-md text-body text-muted">
					O servidor não respondeu. Não faz mal — ainda tens sessão se ele
					voltar a responder.
				</p>
				<Button onClick={() => window.location.reload()}>
					Tentar de novo
				</Button>
			</div>
		);
	}

	return <>{children}</>;
}

/**
 * A guarda de `/entrar` e companhia.
 *
 * O inverso da outra, e com o mesmo cuidado: quem já entrou vai directo para a
 * app. Sem isto, entrar a sério e voltar atrás no browser deixa a página de
 * entrada à frente, e o próximo clique leva a um formulário cheio dos dados da
 * última pessoa que usou aquele computador.
 *
 * A sessão também é confirmada aqui, e não só pelo token. Com o token sozinho,
 * um token morto fazia as duas guardingas discordarem — `/entrar` dizia "entra",
 * `/app` dizia "a sessão terminou" — e a pessoa ficava a saltar entre as duas
 * sem sair do sítio.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
	const token = useAuthStore((s) => s.token);
	const { data, isPending } = useSession();

	// A sessão ainda a confirmar e há token: o formulário não aparece, nem a
	// app. Um esqueleto, que é o que evita o salto de página.
	if (token && isPending) return <ShellSkeleton />;

	// `data` só é `null` quando o servidor confirmou que não há sessão. Não
	// quando a rede falhou: nesse caso a pessoa vê o formulário e tenta outra
	// vez, que é melhor do que ser expulsa sem razão.
	if (data) return <Navigate to="/app/explorar" replace />;

	return <>{children}</>;
}

/** O esqueleto enquanto a sessão não se confirma. */
function ShellSkeleton() {
	return (
		<div className="min-h-screen">
			<div className="h-16 border-b border-line bg-surface" />
			<div className="mx-auto max-w-6xl px-6 py-10">
				<div className="animate-pulse-soft h-8 w-56 rounded bg-line" />
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }, (_, index) => (
						<div
							key={index}
							className="animate-pulse-soft h-44 rounded-lg border border-line bg-surface"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
