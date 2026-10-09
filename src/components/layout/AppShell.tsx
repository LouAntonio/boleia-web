import { Link, NavLink, Outlet } from 'react-router-dom';
import {
	Bell,
	Car,
	Compass,
	IdCard,
	LayoutGrid,
	LogOut,
	Menu,
	User,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { initials } from '../../lib/format';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSignOut } from '../../hooks/useAuth';

const NAV = [
	{ to: '/app/explorar', label: 'Explorar', Icon: Compass },
	{ to: '/app/reservas', label: 'Reservas', Icon: LayoutGrid },
	{ to: '/app/painel', label: 'Painel', Icon: Car },
	{ to: '/app/perfil', label: 'Perfil', Icon: User },
];

/** O esqueleto de quem entrou. Cabeçalho + conteúdo + nada mais. */
export function AppShell() {
	// Dois menus, dois estados. Partilhar um só faria abrir o menu do perfil no
	// telemóvel e o menu lateral no computador ao mesmo tempo, com um clique.
	const [profileOpen, setProfileOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const user = useAuthStore((s) => s.user);
	const signOut = useSignOut();
	const profileRef = useRef<HTMLDivElement>(null);

	const { data: unread = 0 } = useQuery({
		queryKey: qk.unreadCount,
		queryFn: api.fetchUnreadCount,
		refetchInterval: 60_000,
	});

	// O menu do perfil fecha com `Escape` e com um clique lá fora. Sem o clique
	// exterior, não há forma de o fechar num ecrã de toque.
	useEffect(() => {
		if (!profileOpen) return;

		const onPointerDown = (event: MouseEvent) => {
			if (!profileRef.current?.contains(event.target as Node)) {
				setProfileOpen(false);
			}
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setProfileOpen(false);
		};

		document.addEventListener('mousedown', onPointerDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onPointerDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [profileOpen]);

	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-40 border-b border-line bg-surface">
				<div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
					<Link to="/app/explorar" aria-label="Boleia, ir para Explorar">
						<Logo />
					</Link>

					<nav
						aria-label="Secções"
						className="ml-6 hidden items-center gap-1 md:flex"
					>
						{NAV.map(({ to, label, Icon }) => (
							<NavLink
								key={to}
								to={to}
								className={({ isActive }) =>
									[
										'flex items-center gap-2 rounded-sm px-3 py-2 text-label transition-colors',
										isActive
											? 'bg-brand-soft text-brand-text'
											: 'text-muted hover:bg-canvas hover:text-ink',
									].join(' ')
								}
							>
								<Icon size={16} aria-hidden="true" />
								{label}
							</NavLink>
						))}
					</nav>

					<div className="ml-auto flex items-center gap-2">
						<ThemeToggle />

						<Link
							to="/app/notificacoes"
							className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink"
							aria-label={
								unread > 0
									? `Notificações, ${unread} por ler`
									: 'Notificações'
							}
						>
							<Bell size={18} aria-hidden="true" />
							{unread > 0 ? (
								<span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-medium text-white">
									{unread > 99 ? '99+' : unread}
								</span>
							) : null}
						</Link>

						<div className="relative hidden md:block" ref={profileRef}>
							<button
								type="button"
								onClick={() => setProfileOpen((value) => !value)}
								aria-expanded={profileOpen}
								aria-haspopup="menu"
								className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-canvas"
							>
								<span
									aria-hidden="true"
									className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-small font-medium text-brand-text"
								>
									{initials(user?.name ?? '', user?.surname)}
								</span>
								<span className="text-label text-ink">
									{user?.name}
								</span>
							</button>

							{profileOpen ? (
								<div
									role="menu"
									className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-lift"
								>
									<MenuLink
										to="/app/perfil"
										Icon={User}
										label="Perfil"
										onNavigate={() => setProfileOpen(false)}
									/>
									<MenuLink
										to="/app/kyc"
										Icon={IdCard}
										label="Verificação"
										onNavigate={() => setProfileOpen(false)}
									/>
									<MenuLink
										to="/app/viaturas"
										Icon={Car}
										label="Viaturas"
										onNavigate={() => setProfileOpen(false)}
									/>

									<div className="my-1 h-px bg-line" />

									<button
										type="button"
										role="menuitem"
										onClick={() => signOut.mutate()}
										disabled={signOut.isPending}
										className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-body text-alert transition-colors hover:bg-alert-soft"
									>
										<LogOut size={16} aria-hidden="true" />
										Terminar sessão
									</button>
								</div>
							) : null}
						</div>

						<button
							type="button"
							onClick={() => setMobileOpen((value) => !value)}
							aria-label="Abrir menu"
							aria-expanded={mobileOpen}
							className="flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-canvas md:hidden"
						>
							{mobileOpen ? <X size={20} /> : <Menu size={20} />}
						</button>
					</div>
				</div>

				{mobileOpen ? (
					<div className="border-t border-line bg-surface md:hidden">
						<nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
							{NAV.map(({ to, label, Icon }) => (
								<NavLink
									key={to}
									to={to}
									onClick={() => setMobileOpen(false)}
									className={({ isActive }) =>
										[
											'flex items-center gap-3 border-b border-line py-4 text-label last:border-0',
											isActive
												? 'text-brand-text'
												: 'text-ink',
										].join(' ')
									}
								>
									<Icon size={18} aria-hidden="true" />
									{label}
								</NavLink>
							))}
							<div className="flex items-center gap-2 py-4">
								<Link
									to="/app/kyc"
									onClick={() => setMobileOpen(false)}
									className="flex-1"
								>
									<Button variant="secondary" full size="sm">
										Verificação
									</Button>
								</Link>
								<Button
									variant="danger"
									size="sm"
									onClick={() => {
										setMobileOpen(false);
										signOut.mutate();
									}}
								>
									Sair
								</Button>
							</div>
						</nav>
					</div>
				) : null}
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
				<Outlet />
			</main>
		</div>
	);
}

function MenuLink({
	to,
	Icon,
	label,
	onNavigate,
}: {
	to: string;
	Icon: typeof User;
	label: string;
	onNavigate: () => void;
}) {
	return (
		<NavLink
			to={to}
			role="menuitem"
			onClick={onNavigate}
			className="flex items-center gap-2.5 px-3 py-2.5 text-body text-ink transition-colors hover:bg-canvas"
		>
			<Icon size={16} aria-hidden="true" />
			{label}
		</NavLink>
	);
}
