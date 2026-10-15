import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { Button } from '../ui/Button';

/**
 * A guarda de `/app`.
 *
 * **A diferença estrutural em relação a antes:** não há token em
 * `localStorage` para ler de relance. A sessão vive num cookie que o
 * JavaScript não vê, e a única forma de saber se é válida é perguntar ao
 * servidor. Isto transforma o "a responder?" no estado normal de arranque de
 * cada página protegida, em vez do caso raro que era quando havia token.
 *
 * Três estados, e a distinção entre eles é o que importa:
 *
 * 1. **Sem sessão** — o servidor respondeu e não há cookie válido. Vai para
 *    `/entrar`, com o `replace` para não deixar a rota protegida no histórico.
 * 2. **Sessão ainda a confirmar** — o esqueleto. Sem isto, cada F5 em `/app`
 *    piscava a página de entrada antes de voltar ao site.
 * 3. **A rede falhou** — `error` sem sessão. Não é a mesma coisa que "a sessão
 *    acabou": dizer "a sessão terminou" por causa de um timeout seria mentira,
 *    e o botão de reentrar levaria a uma página que volta a deixá-la a sair.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
	const location = useLocation();
	const { data: session, isPending, error } = authClient.useSession();

	// A resposta chegou e não há sessão. `error` com sessão nula não conta: o
	// servidor pode ter falhado, e nesse caso mostramos o ecrã de rede abaixo.
	if (!isPending && !session && !error) {
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

	if (error && !session) return <SessionUnconfirmed />;

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
 * Quando o servidor não responde, mostra-se o formulário. Expulsar alguém do
 * login por causa de um timeout seria pior do que o contrário: a pessoa vê o
 * formulário, tenta outra vez, e o erro aparece no formulário.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) return <ShellSkeleton />;

	if (session) return <Navigate to="/app/explorar" replace />;

	return <>{children}</>;
}

/** O servidor não respondeu: a sessão continua, não se pode confirmá-la. */
function SessionUnconfirmed() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
			<h1 className="text-h2 text-ink">
				Não foi possível confirmar a sessão
			</h1>
			<p className="max-w-md text-body text-muted">
				O servidor não respondeu. Não faz mal — ainda tens sessão se ele
				voltar a responder.
			</p>
			<Button onClick={() => window.location.reload()}>Tentar de novo</Button>
		</div>
	);
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
