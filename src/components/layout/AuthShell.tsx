import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { RoadTrack } from '../marketing/RoadTrack';

/**
 * O invólucro das páginas de entrada e registo.
 *
 * Duas colunas só a partir de `lg`. Em baixo do `lg` uma coluna: entrar num
 * telemóvel com metade do ecrã ocupada por uma estrada seria um desperdício, e
 * o formulário é a única coisa que interessa ali.
 *
 * A estrada do lado direito não é enfeite de fundo. É a mesma `RoadTrack` da
 * landing, com o percurso parado — quem vai criar conta vê aqui o que vai
 * comprar, e quem está a voltar já reconheceu.
 */
export function AuthShell({
	children,
	title,
	subtitle,
}: {
	children: ReactNode;
	title: string;
	subtitle: string;
}) {
	return (
		<div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			<div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-10">
				<header className="flex items-center justify-between gap-4">
					<Link to="/" aria-label="Boleia, ir para a página inicial">
						<Logo />
					</Link>
					<ThemeToggle />
				</header>

				<main className="flex flex-1 items-center justify-center py-12">
					<div className="w-full max-w-sm">
						<h1 className="text-h2 text-ink">{title}</h1>
						<p className="mt-2 text-body text-muted">{subtitle}</p>
						<div className="mt-8">{children}</div>
					</div>
				</main>

				<footer className="text-small text-muted">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-ink"
					>
						<ArrowLeft size={14} aria-hidden="true" />
						Voltar ao início
					</Link>
				</footer>
			</div>

			{/*
			 * Fica no DOM abaixo de `lg` e esconde-se: o `RoadTrack` só entra
			 * com `@media (prefers-reduced-motion: none)` e sem isto ficaria uma
			 * faixa de 132px vazia no fundo do formulário no telemóvel.
			 */}
			<div
				className="hidden items-center border-l border-line bg-surface px-10 lg:flex xl:px-16"
				aria-hidden="true"
			>
				<div className="w-full max-w-xl">
					<RoadTrack
						stops={[
							{ name: 'Luanda', time: '06:00' },
							{ name: 'Viana', time: '07:20' },
							{ name: 'Malanje', time: '10:05' },
							{ name: 'Huambo', time: '13:40' },
							{ name: 'Benguela', time: '18:10' },
						]}
						height={210}
					/>

					<p className="mt-10 text-display font-extrabold tracking-tight text-ink">
						06:00 em Luanda.
						<br />
						18:10 em Benguela.
					</p>
					<p className="mt-4 max-w-md text-body text-muted">
						Tem uma boleia com lugares. Não precisa de conduzir o
						caminho todo sozinho.
					</p>
				</div>
			</div>
		</div>
	);
}
