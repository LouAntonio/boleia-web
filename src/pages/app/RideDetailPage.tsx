import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BusFront, Clock, MapPin, Share2, User } from 'lucide-react';
import toast from 'react-hot-toast';
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
import {
	durationBetween,
	fmtLongDate,
	fullName,
	hhmm,
	initials,
	rideScopeLabel,
	seatsLeft,
} from '../../lib/format';
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
				to="/app/explorar"
				className="inline-flex w-fit items-center gap-1.5 rounded-sm text-small text-muted transition-colors hover:text-ink"
			>
				<ArrowLeft size={15} aria-hidden="true" />
				Todas as boleias
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-h2 text-ink">{ride.routeName}</h1>
					<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-muted">
						<span className="inline-flex items-center gap-2">
							<Clock size={16} aria-hidden="true" />
							{fmtLongDate(ride.departureAt)},{' '}
							{hhmm(ride.departureAt)}
						</span>
						<span className="rounded-full bg-canvas px-2.5 py-0.5 text-small font-medium text-ink">
							{rideScopeLabel(ride.scope)}
						</span>
						<span className="rounded-full bg-canvas px-2.5 py-0.5 text-small font-medium text-ink">
							{durationBetween(ride.departureAt, ride.arrivalAt)}
						</span>
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" onClick={() => void share()}>
						<Share2 size={16} aria-hidden="true" />
						Partilhar
					</Button>
					<StatusStamp status={ride.status} />
				</div>
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
								{ride.driver ? (
									<span className="text-label font-medium">
										{initials(
											ride.driver.name,
											ride.driver.surname,
										)}
									</span>
								) : (
									<User size={19} />
								)}
							</span>
							<div>
								<p className="text-body text-ink">
									{ride.driver ? (
										<Link
											to={`/app/pessoas/${ride.driver.id}`}
											className="rounded-sm underline-offset-4 hover:underline"
										>
											{fullName(
												ride.driver.name,
												ride.driver.surname,
											)}
										</Link>
									) : (
										'Motorista'
									)}
								</p>
								{/*
								 * Aqui dizia "Identidade verificada", sem condição
								 * nenhuma — aparecia para todos os motoristas,
								 * verificados ou não.
								 *
								 * O `Ride` não traz o estado do KYC do motorista,
								 * e buscá-lo revelaria a outra pessoa o estado
								 * da verificação de identidade de um terceiro.
								 * Dizer "verificada" sem o saber é pior do que
								 * não dizer nada.
								 */}
								<p className="text-small text-muted">
									{ride.vehicle
										? `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.plate}`
										: 'Motorista'}
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

					{ride.passengers && ride.passengers.length > 0 ? (
						<Card className="p-6">
							<h2 className="text-h3 text-ink">Quem vai</h2>
							<p className="mt-2 text-small text-muted">
								Já confirmados, a quem o motorista disse que vem.
							</p>
							<ul className="mt-4 flex flex-col divide-y divide-line">
								{ride.passengers.map((person) => (
									<li
										key={person.id}
										className="flex items-center gap-3 py-3"
									>
										<span
											aria-hidden="true"
											className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-small font-medium text-muted"
										>
											{initials(person.name, person.surname)}
										</span>
										<Link
											to={`/app/pessoas/${person.id}`}
											className="min-w-0 flex-1 truncate rounded-sm text-body text-ink underline-offset-4 hover:underline"
										>
											{fullName(person.name, person.surname)}
										</Link>
										{person.seats > 1 ? (
											<span className="shrink-0 text-small text-muted">
												{person.seats} lugares
											</span>
										) : null}
									</li>
								))}
							</ul>
						</Card>
					) : null}

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
						free={free}
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
	free,
}: {
	rideId: string;
	sold: boolean;
	ownRide: boolean;
	passengerReady: boolean;
	free: number;
}) {
	const [seats, setSeats] = useState(1);
	const book = useBookRide();

	const options = Array.from(
		{ length: Math.max(1, Math.min(free, 4)) },
		(_, index) => index + 1,
	);

	/*
	 * Os lugares livres podem cair a meio deste ecrã — alguém confirmou uma
	 * opção num clique anterior, ou os pedidos novos subiram. Sem este
	 * ajuste, a seleção podia ficar por um número que já não pertence aos
	 * botões, e "Pedir este lugar" iria pedir o que não existe.
	 */
	useEffect(() => {
		if (seats > options.length) setSeats(options.length);
	}, [options.length, seats]);

	if (ownRide) {
		return (
			<div className="mt-6 flex flex-col gap-3">
				<p className="rounded-md bg-brand-soft px-4 py-3 text-small text-brand-text">
					Esta boleia é tua. Os pedidos e os controlos da viagem estão na
					página de gestão.
				</p>
				<Link to={`/app/painel/viagens/${rideId}`}>
					<Button full variant="secondary">
						Gerir boleia
					</Button>
				</Link>
			</div>
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
					{options.map((count) => (
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
