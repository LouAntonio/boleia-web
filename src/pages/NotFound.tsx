import { Link } from 'react-router-dom';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { usePageTitle } from '../hooks/usePageTitle';
import { ThemeToggle } from '../components/layout/ThemeToggle';

/**
 * A página de "não encontrei isto".
 *
 * Um caminho errado tem de responder com o caminho certo. Dar um 404 com uma
 * página em branco — ou pior, com a página inicial e a pessoa a pensar que
 * carregou no sítio errado — deixa-a sem forma de continuar.
 *
 * Fica sobre `--void`, com o logótipo completo. É a única página que trata o
 * logótipo como imagem principal, e o preto da marca faz-a fechar o site em vez
 * de o deixar a meio.
 */
export function NotFound() {
	usePageTitle('Página não encontrada');

	return (
		<div className="flex min-h-screen flex-col bg-void text-white">
			<header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
				<Link to="/" aria-label="Boleia, ir para a página inicial">
					<Logo />
				</Link>
				{/* Sobre o preto, o botão claro do tema teria de ser escuro. */}
				<div className="[&_div]:border-white/20 [&_div]:bg-transparent [&_button]:text-white/70 [&_button:hover]:text-white">
					<ThemeToggle />
				</div>
			</header>

			<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
				<p className="font-mono text-small text-white/50">
					Erro 404 — este endereço não existe
				</p>

				<h1 className="mt-4 max-w-3xl text-display font-extrabold tracking-tight">
					Este caminho não leva a nenhuma boleia.
				</h1>

				<p className="mt-6 max-w-lg text-body text-white/70">
					A página que procuras mudou de sítio ou nunca existiu. A página
					inicial e a lista de boleias estão a um clique daqui.
				</p>

				<div className="mt-10 flex flex-wrap gap-3">
					<Link to="/">
						<Button size="lg">Voltar ao início</Button>
					</Link>
					<Link to="/app/explorar">
						<Button
							size="lg"
							className="border border-white/25 bg-transparent hover:bg-white/10"
						>
							Explorar boleias
						</Button>
					</Link>
				</div>
			</main>

			<footer className="mx-auto w-full max-w-6xl px-6 py-8">
				<img
					src="/images/logo.png"
					alt="Boleia — disponibilidade, rapidez e segurança"
					className="h-14 w-auto rounded opacity-70"
					width={56}
					height={56}
				/>
			</footer>
		</div>
	);
}
