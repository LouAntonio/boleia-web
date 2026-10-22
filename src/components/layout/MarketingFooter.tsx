import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

/**
 * O rodapé público.
 *
 * Fica sobre `--void` (o preto do logótipo) em vez da superfície normal. É o
 * único sítio do site com o preto da marca, e faz o logótipo — que é um PNG
 * quadrado com fundo `#121212` — assentar em vez de flotar num cartão claro
 * como um autocolante.
 */

/** As colunas de links, agrupadas por quem vai clicar nelas. */
const COLUMNS = [
	{
		title: 'Boleia',
		links: [
			{ to: '/sobre', label: 'Sobre' },
			{ to: '/perguntas', label: 'Perguntas frequentes' },
			{ to: '/seguranca', label: 'Segurança' },
		],
	},
	{
		title: 'Se precisas de ir',
		links: [
			{ to: '/boleias', label: 'Explorar boleias' },
			{ to: '/como-funciona', label: 'Como funciona' },
			{ to: '/criar-conta', label: 'Criar conta' },
			{ to: '/entrar', label: 'Entrar' },
		],
	},
	{
		title: 'Se vais conduzir',
		links: [
			{ to: '/para-motoristas', label: 'Publicar uma boleia' },
			{ to: '/como-funciona', label: 'Como funciona' },
			{ to: '/app/kyc', label: 'Verificar identidade' },
			{ to: '/app/viaturas', label: 'Registar viatura' },
		],
	},
	{
		title: 'Legal',
		links: [
			{ to: '/termos', label: 'Termos e condições' },
			{ to: '/privacidade', label: 'Política de privacidade' },
			{ to: '/contacto', label: 'Contacto' },
		],
	},
];

/**
 * Um link do rodapé.
 *
 * Só sabe estar no rodapé e nunca activo, por isso é um `<span>` e não um
 * `NavLink` com estado. `isActive` acessoriar não é possível aqui, e fingir
 * que se pode é um aviso para quem tentar reaproveitar o componente.
 */
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

export function MarketingFooter() {
	const { pathname } = useLocation();
	const year = new Date().getFullYear();

	return (
		<footer className="bg-void text-white">
			<div className="mx-auto max-w-6xl px-6 py-16">
				<div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
					<div className="sm:col-span-2 lg:col-span-1">
						<img
							src="/images/logo.png"
							alt="Boleia — disponibilidade, rapidez e segurança"
							className="h-16 w-auto rounded"
							width={64}
							height={64}
						/>
						<p className="mt-5 max-w-xs text-small text-white/70">
							Boleias entre províncias de Angola, com lugares
							verificados e motoristas conhecidos. Pegas lugar, pagas
							na viatura, chegas.
						</p>
					</div>

					{COLUMNS.map((column) => (
						<nav key={column.title} aria-label={column.title}>
							<h2 className="text-label font-medium text-white">
								{column.title}
							</h2>
							<ul className="mt-4 flex flex-col gap-3">
								{column.links.map((link) => (
									<FooterLink key={link.to} to={link.to}>
										{link.label}
									</FooterLink>
								))}
							</ul>
						</nav>
					))}
				</div>

				<div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-8 lg:flex-row lg:items-center lg:justify-between">
					<p className="text-small text-white/60">
						© {year} Boleia. Angola.
					</p>

					<p className="max-w-md text-small text-white/60">
						Os lugares que vês são reais e mudam. O que este sítio não
						mostra não existe — e o que não está aqui, não está feito.
					</p>
				</div>

				{/*
				 * Nas páginas institucionais não faz sentido sugerir que se «volte ao
				 * início» — a pessoa veio da landing ou de um link directo, e voltar
				 * ao início é o que já fez. Só aparece no que não é institucional.
				 */}
				{pathname !== '/' ? (
					<p className="mt-6 text-small text-white/60">
						<Link
							to="/"
							className="rounded-sm underline-offset-4 hover:text-white hover:underline"
						>
							Voltar ao início
						</Link>
					</p>
				) : null}
			</div>
		</footer>
	);
}
