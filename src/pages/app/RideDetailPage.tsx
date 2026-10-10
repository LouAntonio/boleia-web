import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BusFront, Clock, MapPin, User } from 'lucide-react';
import { useRide, useBookRide } from '../../hooks/useRides';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SeatGrid } from '../../components/ui/SeatGrid';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { RoadTrack } from '../../components/marketing/RoadTrack';
import { usePageTitle } from '../../hooks/usePageMeta';
import { useKycMe } from '../../hooks/useKyc';
import { useAuthStore } from '../../stores/useAuthStore';
import { hhmm, fmtLongDate, durationBetween, seatsLeft } from '../../lib/format';
import { SUPPORTED_PAYMENT_METHODS } from '../../types/api';

export function RideDetailPage() {
	const { id = '' } = useParams();
	const { data: ride, isPending, isError } = useRide(id);
	const userId = useAuthStore((s) => s.user?.id);

	usePageTitle(ride?.routeName ?? 'Boleia');

	// O passageiro tem de ter o KYC verificado antes de reservar. O servidor
	// recusa na mesma — isto é para explicar antes de alguém carregar num botão
	// que não vai funcionar, e não para substituir a validação.
	const { data: kyc } = useKycMe();
	const passengerReady = kyc?.passenger?.status === 'VERIFIED';

	if (isPending) return <DetailSkeleton />;

	if (isError || !ride) {
		return (
			<EmptyState
				title="Boleia não encontrada"
				description="Pode ter sido cancelada, ou o endereço está errado."
				action={
					<Link to="/app/explorar">
						<Button variant="secondary">Voltar a explorar</Button>
					</Link>
				}
			/>
		);
	}

	const free = seatsLeft(ride.seatsTotal, ride.seatsTaken);
	const sold = free === 0;
	const ownRide = ride.driverId === userId;

	const stops = (ride.stops ?? []).filter((stop) => Boolean(stop.name));

	return (
		<div className="flex flex-col gap-8">
			<Link
				to="/app/explorar"
				className="inline-flex w-fit items-center gap-1.5 rounded-sm text-small text-muted transition-colors hover:text-ink"
			>
				<ArrowLeft size={15} aria-hidden="true" />
				Todas as boleias
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-h2 text-ink">{ride.routeName}</h1>
					<p className="mt-2 flex items-center gap-2 text-body text-muted">
						<Clock size={16} aria-hidden="true" />
						{fmtLongDate(ride.departureAt)}, {hhmm(ride.departureAt)}
					</p>
				</div>

				<StatusStamp status={ride.status} />
			</header>

			{/* O percurso, com hora e distância de cada paragem. */}
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
												: stop.kind === 'DESTINATION'
													? 'Chegada'
													: 'Paragem'}
										</span>
									</div>
								</li>
							))}
						</ol>

						<p className="mt-4 text-small text-muted">
							Do início ao fim:{' '}
							{durationBetween(ride.departureAt, ride.arrivalAt)}.
						</p>
					</>
				) : (
					<>
						<RoadTrack
							animate={false}
							height={140}
							stops={[
								{
									name:
										ride.routeName.split(/[–—>-]/)[0]?.trim() ||
										'Partida',
									time: hhmm(ride.departureAt),
								},
								{ name: 'Destino', time: hhmm(ride.arrivalAt) },
							]}
						/>
						<p className="mt-4 text-small text-muted">
							Esta boleia foi publicada sem paragens pelo caminho. Só
							o início e o fim estão definidos.
						</p>
					</>
				)}
			</Card>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
				<div className="flex flex-col gap-6">
					<Card className="p-6">
						<h2 className="text-h3 text-ink">Motorista</h2>
						<div className="mt-4 flex items-center gap-3">
							<span
								aria-hidden="true"
								className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-text"
							>
								<User size={19} />
							</span>
							<div>
								<p className="text-body text-ink">
									{ride.driver?.name ?? 'Motorista'}
								</p>
								<p className="text-small text-muted">
									Identidade verificada
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
									<p className="font-mono text-data text-muted">
										{ride.vehicle.plate} · {ride.vehicle.color}
									</p>
								</div>
							</div>
						) : null}
					</Card>

					<Card className="p-6">
						<h2 className="text-h3 text-ink">Como se paga</h2>
						<p className="mt-2 text-body text-muted">
							Em dinheiro, ao motorista, na hora do embarque. A Boleia
							não toca no teu dinheiro antes disso.
						</p>
					</Card>
				</div>

				{/* O painel de reserva. */}
				<Card className="p-6 lg:sticky lg:top-24">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-h3 font-medium text-ink">
							{ride.pricePerSeat.toLocaleString('pt-PT')} Kz
						</span>
						<span className="text-small text-muted">por lugar</span>
					</div>

					<div className="mt-5">
						<SeatGrid total={ride.seatsTotal} taken={ride.seatsTaken} />
					</div>

					<BookingPanel
						rideId={ride.id}
						sold={sold}
						ownRide={ownRide}
						passengerReady={passengerReady}
					/>
				</Card>
			</div>
		</div>
	);
}

function BookingPanel({
	rideId,
	sold,
	ownRide,
	passengerReady,
}: {
	rideId: string;
	sold: boolean;
	ownRide: boolean;
	passengerReady: boolean;
}) {
	const [seats, setSeats] = useState(1);
	const book = useBookRide();

	if (ownRide) {
		return (
			<p className="mt-6 rounded-md bg-brand-soft px-4 py-3 text-small text-brand-text">
				Esta boleia é tua. Gere os pedidos de lugar no painel.
			</p>
		);
	}

	if (sold) {
		return (
			<p className="mt-6 rounded-md bg-canvas px-4 py-3 text-small text-muted">
				Esta boleia já não tem lugares livres.
			</p>
		);
	}

	if (!passengerReady) {
		return (
			<div className="mt-6 flex flex-col gap-3">
				<p className="rounded-md bg-caution px-4 py-3 text-small text-caution-ink">
					Para reservar precisas de ter a identidade verificada.
				</p>
				<Link to="/app/kyc">
					<Button full>Verificar identidade</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="mt-6 flex flex-col gap-4">
			<div>
				<label htmlFor="lugares" className="text-label text-ink">
					Quantos lugares
				</label>
				<div className="mt-2 flex gap-2">
					{[1, 2, 3, 4].map((count) => (
						<button
							key={count}
							type="button"
							onClick={() => setSeats(count)}
							aria-pressed={seats === count}
							className={[
								'h-11 flex-1 rounded-md border text-label font-medium transition-colors',
								seats === count
									? 'border-brand bg-brand text-brand-ink'
									: 'border-line text-muted hover:bg-canvas hover:text-ink',
							].join(' ')}
						>
							{count}
						</button>
					))}
				</div>
			</div>

			<Button
				size="lg"
				full
				onClick={() =>
					book.mutate({
						rideId,
						seats,
						paymentMethod: SUPPORTED_PAYMENT_METHODS[0],
					})
				}
				disabled={book.isPending}
			>
				{book.isPending ? 'A enviar…' : 'Pedir este lugar'}
			</Button>

			<p className="flex items-start gap-1.5 text-small text-muted">
				<MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
				Pagas na viatura, em dinheiro. O pedido só fica firme quando o
				motorista aceita.
			</p>
		</div>
	);
}

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			<SkeletonLine className="h-4 w-32" />
			<SkeletonLine className="h-10 w-2/3" />
			<Card className="h-72 p-6">
				<SkeletonLine className="h-full w-full" />
			</Card>
		</div>
	);
}
