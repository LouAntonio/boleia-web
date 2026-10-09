import { Link } from 'react-router-dom';

/**
 * O rodapé público.
 *
 * Fica sobre `--void` (o preto do logótipo) em vez da superfície normal. É o
 * único sítio do site com o preto da marca, e faz o logótipo — que é um PNG
 * quadrado com fundo `#121212` — assentar em vez de flutuar num cartão claro
 * como um autocolante.
 */
export function MarketingFooter() {
	return (
		<footer className="bg-void text-white">
			<div className="mx-auto max-w-6xl px-6 py-16">
				<div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
					<div className="lg:col-span-2">
						<img
							src="/images/logo.png"
							alt="Boleia — disponibilidade, rapidez e segurança"
							className="h-16 w-auto rounded"
							width={64}
							height={64}
						/>
						<p className="mt-5 max-w-sm text-body text-white/70">
							Boleias entre províncias de Angola, com lugares
							verificados e motoristas conhecidos. Pegas lugar, pagas
							na viatura, chegas.
						</p>
					</div>

					<nav aria-label="Produto">
						<h2 className="text-label font-medium text-white">
							Produto
						</h2>
						<ul className="mt-4 flex flex-col gap-3">
							<FooterLink to="/app/explorar">
								Explorar boleias
							</FooterLink>
							<FooterLink to="/criar-conta">Criar conta</FooterLink>
							<FooterLink to="/entrar">Entrar</FooterLink>
						</ul>
					</nav>

					<nav aria-label="Motoristas">
						<h2 className="text-label font-medium text-white">
							Se és motorista
						</h2>
						<ul className="mt-4 flex flex-col gap-3">
							<FooterLink to="/criar-conta">
								Publicar uma boleia
							</FooterLink>
							<FooterLink to="/app/kyc">
								Verificar identidade
							</FooterLink>
							<FooterLink to="/app/viaturas">
								Registar viatura
							</FooterLink>
						</ul>
					</nav>
				</div>

				<div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-small text-white/60">
						© {new Date().getFullYear()} Boleia. Angola.
					</p>
					<p className="max-w-md text-small text-white/60">
						Os lugares que vês são reais e mudam. O que este sítio não
						mostra não existe — e o que não está aqui, não está feito.
					</p>
				</div>
			</div>
		</footer>
	);
}

function FooterLink({ to, children }: { to: string; children: string }) {
	return (
		<li>
			<Link
				to={to}
				className="rounded-sm text-body text-white/70 transition-colors hover:text-white"
			>
				{children}
			</Link>
		</li>
	);
}
