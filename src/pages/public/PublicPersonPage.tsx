import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePublicPerson } from '../../hooks/useRides';
import { usePageMeta } from '../../hooks/usePageMeta';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCards } from '../../components/ui/Skeleton';
import { fmtLongDate, fullName, initials } from '../../lib/format';

/**
 * Perfil público de alguém que vai numa boleia.
 *
 * Duas rotas chegam aqui: `/pessoas/:id`, desde o link partilhado de uma
 * boleia; e `/app/pessoas/:id`, desde a app de quem já tem sessão. O
 * conteúdo é o mesmo — o que muda é a moldura, e por isso a moldura é
 * escolhida dentro com `withinApp`, não duplicada em dois componentes.
 *
 * O que a página mostra é a projecção do backend (`/api/people/:id`): nome
 * completo, apresentação e "membro desde". A página nunca recebe email,
 * telefone nem documentos — se um dia o backend os mandar, o tipo morre no
 * `typecheck` antes de o ecrã os mostrar.
 */
export function PublicPersonPage({ withinApp = false }: { withinApp?: boolean }) {
	const { id = '' } = useParams();
	const { data: person, isPending, isError } = usePublicPerson(id);
	const name = person ? fullName(person.name, person.surname) : null;

	usePageMeta(name ?? 'Perfil', name ? `${name} na Boleia` : undefined);

	if (isPending) {
		return (
			<Frame withinApp={withinApp}>
				<SkeletonCards count={2} />
			</Frame>
		);
	}

	if (isError || !person) {
		return (
			<Frame withinApp={withinApp}>
				<EmptyState
					title="Perfil não encontrado"
					description="A pessoa pode ter apagado a conta, ou o link veio mal escrito."
					action={
						<Link to="/">
							<Button variant="secondary">Voltar ao início</Button>
						</Link>
					}
				/>
			</Frame>
		);
	}

	const memberSince = fmtLongDate(person.joinedAt);

	return (
		<Frame withinApp={withinApp}>
			<div className="mx-auto max-w-xl">
				<header className="flex flex-col items-center gap-4 text-center">
					<span
						aria-hidden="true"
						className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-soft text-h2 font-medium text-brand-text"
					>
						{initials(person.name, person.surname)}
					</span>

					<div>
						<h1 className="text-h2 text-ink">{name}</h1>
						<p className="mt-2 text-small text-muted">
							Membro de {memberSince}
						</p>
					</div>
				</header>

				<Card className="mt-8 p-6">
					{person.bio ? (
						<p className="text-body leading-relaxed text-ink">
							{person.bio}
						</p>
					) : (
						<p className="text-body text-muted">
							Esta pessoa ainda não escreveu uma apresentação. O que
							se sabe de si é a identidade verificada atrás — o resto
							não é público.
						</p>
					)}
				</Card>

				<p className="mt-8 text-center text-small text-muted">
					Apenas o que a pessoa escolhe partilhar fica aqui. Nenhum
					contacto ou documento é público na Boleia.
				</p>
			</div>
		</Frame>
	);
}

/**
 * A moldura de página: dentro da app, só conteúdo; fora, o link de volta.
 *
 * No grupo público o `MarketingLayout` já traz header e rodapé, e o que
 * falta aqui é só o regresso. Dentro de `/app`, o `AppShell` cuida de tudo
 * e sobra o conteúdo puro — é lá que a pessoa chega ao clicar no cartão de
 * alguém confirmado numa boleia.
 */
function Frame({
	withinApp,
	children,
}: {
	withinApp: boolean;
	children: ReactNode;
}) {
	if (withinApp) return <>{children}</>;

	return (
		<div className="mx-auto max-w-6xl px-6 py-12">
			<Link
				to="/"
				className="inline-flex w-fit items-center gap-1.5 rounded-sm text-small text-muted transition-colors hover:text-ink"
			>
				<ArrowLeft size={15} aria-hidden="true" />
				Boleia
			</Link>
			<div className="mt-8">{children}</div>
		</div>
	);
}
