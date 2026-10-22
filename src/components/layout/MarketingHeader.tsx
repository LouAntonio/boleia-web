import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';

/**
 * O cabeçalho público.
 *
 * Fica `sticky` e não `fixed`: um `fixed` tem de ser compensado com padding no
 * corpo, e o resultado é sempre uma faixa de um pixel a mais ou a menos. Com
 * `sticky` o conteúdo começa logo abaixo e não há nada a acertar.
 */

/**
 * As secções da landing, que são âncoras dentro da própria página.
 *
 * Só aparecem em `/`. Numa página institucional levariam a pessoa ao sítio
 * errado — `/sobre#rotas` rola até uma secção que aí não existe, e o browser não
 * diz nada quando uma âncora não encontra o seu alvo.
 */
const SECTIONS = [
	{ href: '/#como-funciona', label: 'Como funciona' },
	{ href: '/#rotas', label: 'Rotas' },
	{ href: '/#confianca', label: 'Confiança' },
];

/**
 * As páginas. Aqui é que vivem.
 *
 * "Como funciona" faz o que "Para motoristas" fazia — é a conversão — mas
 * para as duas faces: motorista e passageiro. A rota antiga continua a
 * redireccionar; nenhum link partilhado fica devolva um 404.
 */
const PAGES = [
	{ to: '/sobre', label: 'Sobre' },
	{ to: '/como-funciona', label: 'Como funciona' },
	{ to: '/para-motoristas', label: 'Motoristas' },
	{ to: '/perguntas', label: 'Perguntas' },
	{ to: '/contacto', label: 'Contacto' },
];

export function MarketingHeader({ onNavigate }: { onNavigate?: () => void }) {
	const [open, setOpen] = useState(false);

	// Com o menu aberto, o fundo não deve continuar a rolar por baixo dele.
	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

	function close() {
		setOpen(false);
		onNavigate?.();
	}

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
				<Link
					to="/"
					onClick={close}
					className="shrink-0"
					aria-label="Boleia, ir para o início"
				>
					<img
						src="/images/icon.png"
						alt="Boleia"
						className="h-9 w-9 rounded-md"
						width={36}
						height={36}
					/>
				</Link>

				<nav
					aria-label="Páginas"
					className="hidden items-center gap-1 md:flex"
				>
					{PAGES.map((page) => (
						<NavLink
							key={page.to}
							to={page.to}
							className={({ isActive }) =>
								[
									'rounded-sm px-3 py-2 text-body transition-colors',
									isActive
										? 'bg-brand-soft text-brand-text'
										: 'text-muted hover:bg-canvas hover:text-ink',
								].join(' ')
							}
						>
							{page.label}
						</NavLink>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />

					<div className="hidden items-center gap-2 sm:flex">
						<Link to="/entrar">
							<Button variant="ghost" size="sm">
								Entrar
							</Button>
						</Link>
						<Link to="/criar-conta">
							<Button size="sm">Criar conta</Button>
						</Link>
					</div>

					<button
						type="button"
						onClick={() => setOpen((value) => !value)}
						aria-expanded={open}
						aria-controls="menu-movel"
						aria-label={open ? 'Fechar menu' : 'Abrir menu'}
						className="flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-canvas md:hidden"
					>
						{open ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>
			</div>

			{/*
			 * Não é um `hidden` com CSS: o painel está no DOM só quando está
			 * aberto. Um menu fechado que fica no DOM entra no separador de
			 * atalhos de alguns leitores de ecrã, e os seus links levam a lado
			 * nenhum sem se ver nada.
			 */}
			{open ? (
				<div
					id="menu-movel"
					className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto border-t border-line bg-surface px-6 py-6 md:hidden"
				>
					<nav className="flex flex-col" aria-label="Páginas">
						{PAGES.map((page) => (
							<NavLink
								key={page.to}
								to={page.to}
								onClick={close}
								className={({ isActive }) =>
									[
										'border-b border-line py-4 text-h3',
										isActive ? 'text-brand-text' : 'text-ink',
									].join(' ')
								}
							>
								{page.label}
							</NavLink>
						))}

						{SECTIONS.map((section) => (
							<Link
								key={section.href}
								to={section.href}
								onClick={close}
								className="border-b border-line py-4 text-body text-muted"
							>
								{section.label.replace('#', ' · ')}
							</Link>
						))}
					</nav>

					<div className="mt-8 flex flex-col gap-3">
						<Link to="/entrar" onClick={close}>
							<Button variant="secondary" full size="lg">
								Já tenho conta
							</Button>
						</Link>
						<Link to="/criar-conta" onClick={close}>
							<Button full size="lg">
								Criar conta
							</Button>
						</Link>
					</div>
				</div>
			) : null}
		</header>
	);
}

/** Ligação com estado activo, para o menu de quem já entrou. */
export function AppNavLink({ to, children }: { to: string; children: string }) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				[
					'rounded-sm px-3 py-2 text-label transition-colors',
					isActive
						? 'bg-brand-soft text-brand-text'
						: 'text-muted hover:bg-canvas hover:text-ink',
				].join(' ')
			}
		>
			{children}
		</NavLink>
	);
}
