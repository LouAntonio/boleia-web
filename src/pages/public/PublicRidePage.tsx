import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
	ArrowLeft,
	BusFront,
	CalendarDays,
	Clock,
	MapPin,
	Share2,
	User,
} from 'lucide-react';
import { usePublicRide } from '../../hooks/useRides';
import { usePageTitle } from '../../hooks/usePageMeta';
import { authClient } from '../../lib/auth-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { RoadTrack } from '../../components/marketing/RoadTrack';
import {
	durationBetween,
	fmtKz,
	fmtLongDate,
	hhmm,
	rideScopeLabel,
	seatsLeft,
} from '../../lib/format';

/**
 * A página de uma boleia partilhada.
 *
 * Vive fora de `/app` porque o link chega a quem ainda não tem conta. Mostra o
 * que decide uma reserva — horário, duração, paragens, preço e lugares — e
 * esconde o que não é preciso para decidir: telefone, email e matrícula.
 */
export function PublicRidePage() {
	const { id = '' } = useParams();
	const { data: ride, isPending, isError } = usePublicRide(id);
	const { data: session } = authClient.useSession();

	usePageTitle(ride?.routeName ?? 'Boleia');

	if (isPending) {
		return (
			<div className="mx-auto max-w-4xl px-6 py-12">
				<SkeletonLine className="h-4 w-32" />
				<SkeletonLine className="mt-4 h-10 w-2/3" />
				<Card className="mt-8 h-80 p-6">
					<SkeletonLine className="h-full w-full" />
				</Card>
			</div>
		);
	}

	if (isError || !ride) {
		return (
			<EmptyState
				title="Boleia não encontrada"
				description="O link pode estar errado, ou a boleia foi cancelada."
				action={
					<Link to="/">
						<Button variant="secondary">Voltar ao início</Button>
					</Link>
				}
			/>
		);
	}

	const stops = ride.stops.filter((stop) => Boolean(stop.name));
	const free = seatsLeft(ride.seatsTotal, ride.seatsTaken);
	const sold = free === 0;
	const bookable = ride.status === 'SCHEDULED' && !sold;
	// O modo vem gravado na corrida. As províncias das paragens continuam a
	// ser mostradas, mas já não são a fonte da etiqueta.
	const mode = rideScopeLabel(ride.scope);
	const enterTo = `/app/viagens/${ride.id}`;
	const publicPath = `/viagens/${ride.id}`;
	const shareTitle = `${ride.routeName} · Boleia`;

	async function share() {
		const url = `${window.location.origin}${publicPath}`;
		try {
			if (navigator.share) {
				await navigator.share({ title: shareTitle, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			toast.success('Link copiado. Já o podes enviar.');
		} catch {
			// Cancelar a folha de partilha não é um erro que valha um aviso.
		}
	}

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
			<Link
				to="/"
				className="inline-flex w-fit items-center gap-1.5 rounded-sm text-small text-muted transition-colors hover:text-ink"
			>
				<ArrowLeft size={15} aria-hidden="true" />
				Boleia
			</Link>

			<header className="mt-6 flex flex-wrap items-start justify-between gap-5">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2.5">
						{mode ? (
							<span className="rounded-full bg-brand-soft px-3 py-1 text-small font-medium text-brand-text">
								{mode}
							</span>
						) : null}
						<StatusStamp status={ride.status} />
					</div>

					<h1 className="mt-3 text-h2 text-ink">{ride.routeName}</h1>

					<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-body text-muted">
						<span className="inline-flex items-center gap-2">
							<CalendarDays size={17} aria-hidden="true" />
							{fmtLongDate(ride.departureAt)}
						</span>
						<span className="inline-flex items-center gap-2">
							<Clock size={17} aria-hidden="true" />
							{hhmm(ride.departureAt)} → {hhmm(ride.arrivalAt)}
						</span>
						<span className="inline-flex items-center gap-2 font-medium text-ink">
							<span className="rounded-full bg-canvas px-2.5 py-0.5 text-small">
								{durationBetween(ride.departureAt, ride.arrivalAt)}
							</span>
						</span>
					</div>
				</div>

				<Button variant="secondary" onClick={() => void share()}>
					<Share2 size={16} aria-hidden="true" />
					Partilhar
				</Button>
			</header>

			<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
				<div className="flex flex-col gap-6">
					<Card className="p-6">
						{stops.length >= 2 ? (
							<>
								<RoadTrack
									animate={false}
									height={160}
									stops={stops.map((stop) => ({
										name: stop.name,
										time: stop.timeLabel,
									}))}
								/>

								<ol className="mt-8 divide-y divide-line">
									{stops.map((stop) => (
										<li
											key={`${stop.sequence}-${stop.name}`}
											className="py-3"
										>
											<div className="flex items-baseline gap-4">
												<span className="w-14 shrink-0 font-mono text-data text-brand-text">
													{stop.timeLabel}
												</span>
												<span className="flex-1 text-body text-ink">
													{stop.name}
												</span>
												<span className="text-small text-muted">
													{stop.kind === 'ORIGIN'
														? 'Partida'
														: stop.kind ===
															  'DESTINATION'
															? 'Chegada'
															: 'Paragem'}
												</span>
											</div>
											{stop.locality?.province?.name ? (
												<p className="mt-1 pl-[4.5rem] text-small text-muted">
													{stop.locality.province.name}
												</p>
											) : null}
										</li>
									))}
								</ol>

								<p className="mt-4 text-small text-muted">
									Do início ao fim:{' '}
									{durationBetween(
										ride.departureAt,
										ride.arrivalAt,
									)}
									.
								</p>
							</>
						) : (
							<p className="text-body text-muted">
								Esta boleia ainda não tem o itinerário detalhado.
							</p>
						)}
					</Card>

					<Card className="p-6">
						<h2 className="text-h3 text-ink">Quem conduz</h2>
						<div className="mt-4 flex items-center gap-3">
							<span
								aria-hidden="true"
								className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-text"
							>
								<User size={19} />
							</span>
							<div>
								<p className="text-body text-ink">
									{ride.driverName ?? 'Motorista'}
								</p>
								<p className="text-small text-muted">
									{ride.vehicle
										? `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.color}`
										: 'Viatura por confirmar'}
								</p>
							</div>
						</div>

						{ride.vehicle ? (
							<div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
								<span
									aria-hidden="true"
									className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-muted"
								>
									<BusFront size={19} />
								</span>
								<div>
									<p className="text-body text-ink">
										{ride.vehicle.make} {ride.vehicle.model}
									</p>
									<p className="text-small text-muted">
										{ride.vehicle.color}
									</p>
								</div>
							</div>
						) : null}
					</Card>
				</div>

				<Card className="p-6 lg:sticky lg:top-24">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-h2 font-medium text-ink">
							{fmtKz(ride.pricePerSeat)}
						</span>
						<span className="text-small text-muted">por lugar</span>
					</div>

					<dl className="mt-5 grid grid-cols-2 gap-4 border-y border-line py-4">
						<div>
							<dt className="text-small text-muted">
								Lugares livres
							</dt>
							<dd className="mt-0.5 text-body text-ink">
								{free} de {ride.seatsTotal}
							</dd>
						</div>
						<div>
							<dt className="text-small text-muted">Duração</dt>
							<dd className="mt-0.5 text-body text-ink">
								{durationBetween(ride.departureAt, ride.arrivalAt)}
							</dd>
						</div>
					</dl>

					{bookable ? (
						<div className="mt-5 flex flex-col gap-3">
							<Link
								to={session ? enterTo : '/entrar'}
								state={session ? undefined : { from: enterTo }}
							>
								<Button full size="lg">
									Reservar lugar
								</Button>
							</Link>
							<p className="text-small text-muted">
								Entras com o teu número. O pedido só fica firme
								quando o motorista aceita.
							</p>
						</div>
					) : (
						<p className="mt-5 rounded-md bg-canvas px-4 py-3 text-small text-muted">
							{ride.status !== 'SCHEDULED'
								? 'Esta boleia já não está a aceitar reservas.'
								: 'Esta boleia já não tem lugares livres.'}
						</p>
					)}

					<p className="mt-5 flex items-start gap-1.5 text-small text-muted">
						<MapPin
							size={14}
							aria-hidden="true"
							className="mt-0.5 shrink-0"
						/>
						Pagas na viatura, em dinheiro. A Boleia não toca no teu
						dinheiro antes do embarque.
					</p>
				</Card>
			</div>
		</div>
	);
}
