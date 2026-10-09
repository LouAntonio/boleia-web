import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';

const SECTIONS = [
	{ href: '#como-funciona', label: 'Como funciona' },
	{ href: '#rotas', label: 'Rotas' },
	{ href: '#confianca', label: 'Confiança' },
];

/**
 * O cabeçalho público.
 *
 * Fica `sticky` e não `fixed`: um `fixed` tem de ser compensado com padding no
 * corpo, e o resultado é sempre uma faixa de um pixel a mais ou a menos. Com
 * `sticky` o conteúdo começa logo abaixo e não há nada a acertar.
 */
export function MarketingHeader() {
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

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
				<Link
					to="/"
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
					className="hidden items-center gap-1 md:flex"
					aria-label="Secções"
				>
					{SECTIONS.map((section) => (
						<a
							key={section.href}
							href={section.href}
							className="rounded-sm px-3 py-2 text-body text-muted transition-colors hover:bg-canvas hover:text-ink"
						>
							{section.label}
						</a>
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
			 * aberto. Um menu fechado que fica no DOM é lido pelo teclado em
			 * alguns leitores de ecrã, e os seus links entram no separador de
			 * atalhos sem levar a lado nenhum.
			 */}
			{open ? (
				<div
					id="menu-movel"
					className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto border-t border-line bg-surface px-6 py-6 md:hidden"
				>
					<nav className="flex flex-col" aria-label="Secções">
						{SECTIONS.map((section) => (
							<a
								key={section.href}
								href={section.href}
								onClick={() => setOpen(false)}
								className="border-b border-line py-4 text-h3 text-ink"
							>
								{section.label}
							</a>
						))}
					</nav>

					<div className="mt-8 flex flex-col gap-3">
						<Link to="/entrar" onClick={() => setOpen(false)}>
							<Button variant="secondary" full size="lg">
								Já tenho conta
							</Button>
						</Link>
						<Link to="/criar-conta" onClick={() => setOpen(false)}>
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
