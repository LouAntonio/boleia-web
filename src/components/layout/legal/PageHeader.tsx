import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

/**
 * O topo de uma página institucional.
 *
 * Uma coluna, alinhada à esquerda. Um cabeçalho centrado por cima do resto à
 * esquerda acontece sempre que o hero da landing é copiado para uma página de
 * texto, e a página fica a dizer que é um panfleto em vez de um documento.
 *
 * O `description` é a resposta à pergunta "isto é sobre o quê?", escrita para
 * quem está a decidir se abre ou se volta atrás. Por isso vai num parágrafo e
 * não num título.
 */
export function PageHeader({
	eyebrow,
	title,
	description,
	children,
}: {
	/** A categoria, em cima. Só se for útil: o título já diz quase tudo. */
	eyebrow?: string;
	title: string;
	description: string;
	children?: ReactNode;
}) {
	return (
		<header className="border-b border-line">
			<div className="mx-auto max-w-6xl px-6 pt-14 pb-12 sm:pt-20 sm:pb-16">
				{eyebrow ? (
					<p className="font-mono text-data text-muted">{eyebrow}</p>
				) : null}

				<h1 className="mt-3 max-w-3xl text-display text-ink">{title}</h1>

				<p className="mt-6 max-w-2xl text-h3 font-normal leading-relaxed text-muted">
					{description}
				</p>

				{children ? <div className="mt-8">{children}</div> : null}
			</div>
		</header>
	);
}

/**
 * A banda de uma chamada à acção, no fim de uma página institucional.
 *
 * Existe porque cada página institucional acaba com a mesma pergunta: o que é
 * que a pessoa que chegou aqui faz a seguir? Registar-se, se é passageiro;
 * publicar, se é motorista. Sem isto, cada página inventa o seu fim e metade
 * delas acaba a ser um beco.
 */
export function PageCta({
	title,
	body,
	primary,
	secondary,
}: {
	title: string;
	body: string;
	primary: { to: string; label: string };
	secondary?: { to: string; label: string };
}) {
	return (
		<section className="border-t border-line bg-surface">
			<div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
				<div className="max-w-xl">
					<h2 className="text-h2 text-ink">{title}</h2>
					<p className="mt-2 text-body text-muted">{body}</p>
				</div>

				<div className="flex shrink-0 flex-wrap gap-3">
					{secondary ? (
						<SecondaryLink to={secondary.to}>
							{secondary.label}
						</SecondaryLink>
					) : null}
					<PrimaryLink to={primary.to}>{primary.label}</PrimaryLink>
				</div>
			</div>
		</section>
	);
}

function PrimaryLink({ to, children }: { to: string; children: string }) {
	return (
		<Link to={to}>
			<Button size="lg">{children}</Button>
		</Link>
	);
}

function SecondaryLink({ to, children }: { to: string; children: string }) {
	return (
		<Link to={to}>
			<Button variant="secondary" size="lg">
				{children}
			</Button>
		</Link>
	);
}
