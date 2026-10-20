import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone, Share2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import {
	useRide,
	useRideBookings,
	useDecideBooking,
	useRideActions,
} from '../../hooks/useRides';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SeatGrid } from '../../components/ui/SeatGrid';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { RoadTrack } from '../../components/marketing/RoadTrack';
import { usePageTitle } from '../../hooks/usePageMeta';
import {
	durationBetween,
	fmtKz,
	fmtLongDate,
	hhmm,
	seatsLeft,
} from '../../lib/format';
import type { Booking } from '../../types/api';

/**
 * Detalhe de uma boleia do motorista.
 *
 * A gestão saiu da lista do painel e vive aqui: iniciar, terminar, cancelar e
 * decidir pedidos são acções sobre uma boleia concreta, e a lista serve para
 * escolher qual. Concentrá-las nesta página evita que o painel cresça com um
 * cartão cheio de botões por cada viagem.
 */
export function DriverRideDetailPage() {
	const { id = '' } = useParams();
	const { data: ride, isPending, isError } = useRide(id);
	const { data: bookings = [] } = useRideBookings(id, Boolean(ride));
	const decide = useDecideBooking(id);
	const actions = useRideActions(id);

	usePageTitle(ride?.routeName ?? 'Boleia');

	if (isPending) {
		return (
			<div className="flex flex-col gap-6">
				<SkeletonLine className="h-4 w-32" />
				<SkeletonLine className="h-10 w-2/3" />
				<Card className="h-64 p-6">
					<SkeletonLine className="h-full w-full" />
				</Card>
			</div>
		);
	}

	if (isError || !ride) {
		return (
			<EmptyState
				title="Boleia não encontrada"
				description="Pode ter sido apagada, ou o endereço está errado."
				action={
					<Link to="/app/painel">
						<Button variant="secondary">Voltar ao painel</Button>
					</Link>
				}
			/>
		);
	}

	const stops = (ride.stops ?? []).filter((stop) => Boolean(stop.name));
	const free = seatsLeft(ride.seatsTotal, ride.seatsTaken);
	const pending = bookings.filter((booking) => booking.status === 'REQUESTED');
	const confirmed = bookings.filter(
		(booking) =>
			booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS',
	);
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
			// Cancelar a partilha não é erro.
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<Link
				to="/app/painel"
				className="inline-flex w-fit items-center gap-1.5 rounded-sm text-small text-muted transition-colors hover:text-ink"
			>
				<ArrowLeft size={15} aria-hidden="true" />
				As minhas boleias
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-h2 text-ink">{ride.routeName}</h1>
						<StatusStamp status={ride.status} />
					</div>
					<p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-muted">
						<span className="inline-flex items-center gap-2">
							<Clock size={16} aria-hidden="true" />
							{fmtLongDate(ride.departureAt)},{' '}
							{hhmm(ride.departureAt)} → {hhmm(ride.arrivalAt)}
						</span>
						<span className="rounded-full bg-canvas px-2.5 py-0.5 text-small font-medium text-ink">
							{durationBetween(ride.departureAt, ride.arrivalAt)}
						</span>
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" onClick={() => void share()}>
						<Share2 size={16} aria-hidden="true" />
						Partilhar
					</Button>
					<Link to={`/viagens/${ride.id}`} target="_blank">
						<Button variant="ghost">Ver página pública</Button>
					</Link>
				</div>
			</header>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
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
											className="flex items-baseline gap-4 py-3"
										>
											<span className="w-14 shrink-0 font-mono text-data text-brand-text">
												{stop.timeLabel}
											</span>
											<span className="flex-1 text-body text-ink">
												{stop.name}
											</span>
											<span className="text-small text-muted">
												{stop.kind === 'ORIGIN'
													? 'Partida'
													: stop.kind === 'DESTINATION'
														? 'Chegada'
														: 'Paragem'}
											</span>
										</li>
									))}
								</ol>
							</>
						) : (
							<p className="text-body text-muted">
								Esta boleia não tem paragens detalhadas.
							</p>
						)}
					</Card>

					<Card className="p-6">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<h2 className="text-h3 text-ink">
									Pedidos e lugares
								</h2>
								<p className="mt-1 text-small text-muted">
									{free} livre{free === 1 ? '' : 's'} ·{' '}
									{confirmed.length} confirmado
									{confirmed.length === 1 ? '' : 's'}
								</p>
							</div>
							<p className="text-h3 font-medium text-ink">
								{fmtKz(ride.seatsTaken * ride.pricePerSeat)}
								<span className="ml-1 text-small font-normal text-muted">
									previstos
								</span>
							</p>
						</div>

						<div className="mt-5">
							<SeatGrid
								total={ride.seatsTotal}
								taken={ride.seatsTaken}
							/>
						</div>

						<section className="mt-6 border-t border-line pt-5">
							<h3 className="text-label font-medium text-ink">
								À espera de resposta
							</h3>
							{pending.length === 0 ? (
								<p className="mt-2 text-small text-muted">
									Sem pedidos à espera. Assim que alguém reservar,
									aparece aqui.
								</p>
							) : (
								<ul className="mt-3 flex flex-col gap-3">
									{pending.map((booking) => (
										<li key={booking.id}>
											<BookingRow
												booking={booking}
												actions={
													<>
														<Button
															size="sm"
															disabled={
																decide.isPending
															}
															onClick={() =>
																decide.mutate({
																	bookingId:
																		booking.id,
																	decision:
																		'CONFIRMED',
																})
															}
														>
															Aceitar
														</Button>
														<RejectButton
															disabled={
																decide.isPending
															}
															onReject={(reason) =>
																decide.mutate({
																	bookingId:
																		booking.id,
																	decision:
																		'REJECTED',
																	reason,
																})
															}
														/>
													</>
												}
											/>
										</li>
									))}
								</ul>
							)}
						</section>

						{confirmed.length > 0 ? (
							<section className="mt-6 border-t border-line pt-5">
								<h3 className="text-label font-medium text-ink">
									A bordo
								</h3>
								<ul className="mt-3 flex flex-col gap-2">
									{confirmed.map((booking) => (
										<li key={booking.id}>
											<BookingRow booking={booking} />
										</li>
									))}
								</ul>
							</section>
						) : null}
					</Card>
				</div>

				<Card className="p-6 lg:sticky lg:top-24">
					<p className="text-small text-muted">Preço por lugar</p>
					<p className="mt-1 text-h2 font-medium text-ink">
						{fmtKz(ride.pricePerSeat)}
					</p>
					<p className="mt-1 text-small text-muted">
						Total se encher:{' '}
						{fmtKz(ride.seatsTotal * ride.pricePerSeat)}
					</p>

					<div className="mt-5 border-t border-line pt-5">
						<h2 className="text-label font-medium text-ink">
							Gerir viagem
						</h2>
						<div className="mt-3 flex flex-col gap-2">
							{ride.status === 'SCHEDULED' ? (
								<Button
									full
									onClick={() => actions.start.mutate()}
									disabled={actions.start.isPending}
								>
									{actions.start.isPending
										? 'A iniciar…'
										: 'Iniciar viagem'}
								</Button>
							) : null}

							{ride.status === 'IN_PROGRESS' ? (
								<Button
									full
									onClick={() => actions.finish.mutate()}
									disabled={actions.finish.isPending}
								>
									{actions.finish.isPending
										? 'A terminar…'
										: 'Chegar ao destino'}
								</Button>
							) : null}

							{ride.status === 'SCHEDULED' ? (
								<Button
									full
									variant="secondary"
									onClick={() => actions.cancel.mutate()}
									disabled={actions.cancel.isPending}
								>
									{actions.cancel.isPending
										? 'A cancelar…'
										: 'Cancelar boleia'}
								</Button>
							) : null}

							{ride.status !== 'SCHEDULED' &&
							ride.status !== 'IN_PROGRESS' ? (
								<p className="text-small text-muted">
									Esta boleia já terminou.
								</p>
							) : null}
						</div>
					</div>

					<p className="mt-5 flex items-start gap-1.5 text-small text-muted">
						<MapPin
							size={14}
							aria-hidden="true"
							className="mt-0.5 shrink-0"
						/>
						O link público mostra o itinerário e o preço, mas nunca o
						teu telefone nem a matrícula.
					</p>
				</Card>
			</div>
		</div>
	);
}

function BookingRow({
	booking,
	actions,
}: {
	booking: Booking;
	actions?: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3">
			<div className="min-w-0">
				<p className="flex items-center gap-1.5 text-body text-ink">
					<User size={14} aria-hidden="true" className="text-muted" />
					{booking.passenger?.name ?? 'Passageiro'}
				</p>
				<p className="mt-0.5 text-small text-muted">
					{booking.seats} {booking.seats === 1 ? 'lugar' : 'lugares'} ·{' '}
					{fmtKz(booking.amount)}
					{booking.passenger?.phone ? (
						<>
							{' '}
							·{' '}
							<a
								href={`tel:${booking.passenger.phone}`}
								className="inline-flex items-center gap-1 text-brand-text underline-offset-2 hover:underline"
							>
								<Phone size={12} aria-hidden="true" />
								{booking.passenger.phone}
							</a>
						</>
					) : null}
				</p>
				{booking.reason ? (
					<p className="mt-1 text-small text-alert">{booking.reason}</p>
				) : null}
			</div>
			{actions ? <div className="flex gap-2">{actions}</div> : null}
		</div>
	);
}

function RejectButton({
	onReject,
	disabled,
}: {
	onReject: (reason: string) => void;
	disabled: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState('');

	if (!open) {
		return (
			<Button
				variant="secondary"
				size="sm"
				onClick={() => setOpen(true)}
				disabled={disabled}
			>
				Recusar
			</Button>
		);
	}

	return (
		<div className="flex w-full flex-wrap items-end gap-2 rounded-md border border-line p-3">
			<div className="min-w-48 flex-1">
				<label htmlFor="recusa" className="text-small text-ink">
					Porquê
				</label>
				<input
					id="recusa"
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					maxLength={500}
					placeholder="Ex.: já tenho quatro pessoas para Benguela."
					className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 text-body text-ink placeholder:text-muted focus:border-brand"
				/>
			</div>
			<Button
				variant="danger"
				size="sm"
				onClick={() => {
					onReject(reason.trim() || 'Sem vaga para esse dia.');
					setOpen(false);
					setReason('');
				}}
				disabled={disabled}
			>
				Confirmar recusa
			</Button>
			<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
				Cancelar
			</Button>
		</div>
	);
}
