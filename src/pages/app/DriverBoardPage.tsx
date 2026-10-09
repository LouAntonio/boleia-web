import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus } from 'lucide-react';
import {
	useMyRides,
	useRideBookings,
	useDecideBooking,
	useRideActions,
} from '../../hooks/useRides';
import { useKycMe } from '../../hooks/useKyc';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { SeatGrid } from '../../components/ui/SeatGrid';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuthStore } from '../../stores/useAuthStore';
import { fmtLongDate, hhmm, fmtKz } from '../../lib/format';

export function DriverBoardPage() {
	usePageTitle('Painel do motorista');

	const { data, isPending } = useMyRides();
	const { data: kyc } = useKycMe();
	const userId = useAuthStore((s) => s.user?.id);

	const rides = data?.rows ?? [];
	const active = rides.filter((ride) =>
		['SCHEDULED', 'IN_PROGRESS'].includes(ride.status),
	);
	const closed = rides.filter(
		(ride) => !['SCHEDULED', 'IN_PROGRESS'].includes(ride.status),
	);

	// Um motorista verificado mas sem viatura verificada não pode vender lugares.
	// Dizer qual dos dois falta é mais útil do que um "não podes publicar".
	const driverReady = kyc?.driver?.status === 'VERIFIED';

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-h2 text-ink">As minhas boleias</h1>
					<p className="mt-2 text-body text-muted">
						{active.length > 0
							? `${active.length} ${active.length === 1 ? 'boleia ativa' : 'boleias ativas'}.`
							: 'Nenhuma boleia ativa.'}
					</p>
				</div>

				<Link to="/app/publicar">
					<Button>
						<Plus size={16} aria-hidden="true" />
						Publicar boleia
					</Button>
				</Link>
			</header>

			{!driverReady ? (
				<Card className="border-caution p-5">
					<p className="text-body text-caution-ink">
						{kyc?.driver?.status === 'PENDING'
							? 'A tua identidade de motorista está em análise. Podes publicar assim que for aprovada.'
							: 'Para publicar boleias precisas de ter a identidade de motorista verificada.'}
					</p>
					<Link to="/app/kyc" className="mt-4 inline-block">
						<Button variant="secondary" size="sm">
							Verificar identidade
						</Button>
					</Link>
				</Card>
			) : null}

			{isPending ? <SkeletonLine className="h-40 w-full" /> : null}

			{!isPending && rides.length === 0 ? (
				<EmptyState
					icon={<Car size={32} />}
					title="Ainda não publicaste nenhuma boleia"
					description="Publicas a rota, escolhes os lugares e o preço. Os passageiros veem isso assim que fica agendado."
					action={
						<Link to="/app/publicar">
							<Button>Publicar a primeira</Button>
						</Link>
					}
				/>
			) : null}

			{active.length > 0 ? (
				<ul className="flex flex-col gap-4">
					{active.map((ride) => (
						<li key={ride.id}>
							<RidePanel
								ride={ride}
								ownRide={ride.driverId === userId}
							/>
						</li>
					))}
				</ul>
			) : null}

			{closed.length > 0 ? (
				<section>
					<h2 className="text-h3 text-ink">Terminadas</h2>
					<ul className="mt-4 flex flex-col gap-3">
						{closed.map((ride) => (
							<li key={ride.id}>
								<Card className="flex flex-wrap items-center justify-between gap-4 p-4">
									<div>
										<p className="text-body text-ink">
											{ride.routeName}
										</p>
										<p className="text-small text-muted">
											{fmtLongDate(ride.departureAt)} ·{' '}
											{ride.seatsTaken} de {ride.seatsTotal}{' '}
											lugares
										</p>
									</div>
									<div className="flex items-center gap-3">
										<StatusStamp status={ride.status} />
										<Link
											to={`/app/viagens/${ride.id}`}
											className="rounded-sm text-small text-brand-text underline-offset-4 hover:underline"
										>
											Ver
										</Link>
									</div>
								</Card>
							</li>
						))}
					</ul>
				</section>
			) : null}
		</div>
	);
}

/**
 * Uma boleia do motorista, com os pedidos de lugar à espera.
 *
 * Os pedidos só são buscados quando a boleia está agendada. Numa boleia já
 * concluída não há pedidos a decidir, e pedir a lista de toda a gente que já
 * esteve dentro é um pedido que não devia ser feito.
 */
function RidePanel({
	ride,
	ownRide,
}: {
	ride: {
		id: string;
		routeName: string;
		departureAt: string;
		arrivalAt: string;
		seatsTotal: number;
		seatsTaken: number;
		pricePerSeat: number;
		status: string;
		driverId: string;
	};
	ownRide: boolean;
}) {
	const [expanded, setExpanded] = useState(true);
	const canDecide = ownRide && ride.status === 'SCHEDULED';

	const { data: bookings } = useRideBookings(ride.id, canDecide);
	const decide = useDecideBooking(ride.id);
	const actions = useRideActions(ride.id);

	const pending = (bookings ?? []).filter((b) => b.status === 'REQUESTED');
	const accepted = (bookings ?? []).filter((b) => b.status === 'CONFIRMED');

	return (
		<Card className="p-5">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-3">
						<h3 className="text-h3 text-ink">{ride.routeName}</h3>
						<StatusStamp status={ride.status} />
					</div>

					<p className="mt-1.5 text-body text-muted">
						{fmtLongDate(ride.departureAt)}, {hhmm(ride.departureAt)} →{' '}
						{hhmm(ride.arrivalAt)}
					</p>
				</div>

				<Link to={`/app/viagens/${ride.id}`}>
					<Button variant="ghost" size="sm">
						Detalhe
					</Button>
				</Link>
			</header>

			<div className="mt-4 grid gap-5 sm:grid-cols-2">
				<div>
					<p className="text-small text-muted">Lugares</p>
					<SeatGrid
						total={ride.seatsTotal}
						taken={ride.seatsTaken}
						className="mt-2"
					/>
				</div>

				<div>
					<p className="text-small text-muted">Ganho previsto</p>
					<p className="mt-1 text-h3 font-medium text-ink">
						{fmtKz(ride.seatsTaken * ride.pricePerSeat)}
					</p>
					<p className="mt-1 text-small text-muted">
						{ride.seatsTaken * ride.pricePerSeat} Kz a{' '}
						{ride.pricePerSeat} Kz por lugar
					</p>
				</div>
			</div>

			{/* Os controlos de condução. */}
			{ownRide ? (
				<div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
					{ride.status === 'SCHEDULED' ? (
						<Button
							onClick={() => actions.start.mutate()}
							disabled={actions.start.isPending}
						>
							Iniciar viagem
						</Button>
					) : null}

					{ride.status === 'IN_PROGRESS' ? (
						<Button
							onClick={() => actions.finish.mutate()}
							disabled={actions.finish.isPending}
						>
							Chegar ao destino
						</Button>
					) : null}

					{ride.status === 'SCHEDULED' ? (
						<Button
							variant="secondary"
							onClick={() => actions.cancel.mutate()}
							disabled={actions.cancel.isPending}
						>
							Cancelar boleia
						</Button>
					) : null}
				</div>
			) : null}

			{canDecide ? (
				<section className="mt-5 border-t border-line pt-5">
					<button
						type="button"
						onClick={() => setExpanded((value) => !value)}
						aria-expanded={expanded}
						className="flex items-center gap-2 rounded-sm text-label font-medium text-ink"
					>
						Pedidos de lugar
						<span
							className={[
								'rounded-full px-2 py-0.5 text-small',
								pending.length > 0
									? 'bg-caution text-caution-ink'
									: 'bg-canvas text-muted',
							].join(' ')}
						>
							{pending.length}
						</span>
					</button>

					{expanded ? (
						<>
							{pending.length === 0 ? (
								<p className="mt-3 text-small text-muted">
									Sem pedidos à espera. Assim que alguém reservar,
									aparece aqui.
								</p>
							) : (
								<ul className="mt-4 flex flex-col gap-2">
									{pending.map((booking) => (
										<li
											key={booking.id}
											className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3"
										>
											<div>
												<p className="text-body text-ink">
													{booking.seats}{' '}
													{booking.seats === 1
														? 'lugar'
														: 'lugares'}
												</p>
												<p className="text-small text-muted">
													{fmtKz(booking.amount)} em
													dinheiro
												</p>
											</div>

											<div className="flex gap-2">
												<Button
													size="sm"
													onClick={() =>
														decide.mutate({
															bookingId: booking.id,
															decision: 'CONFIRMED',
														})
													}
													disabled={decide.isPending}
												>
													Aceitar
												</Button>
												<RejectButton
													onReject={(reason) =>
														decide.mutate({
															bookingId: booking.id,
															decision: 'REJECTED',
															reason,
														})
													}
													disabled={decide.isPending}
												/>
											</div>
										</li>
									))}
								</ul>
							)}

							{accepted.length > 0 ? (
								<p className="mt-4 text-small text-muted">
									{accepted.length}{' '}
									{accepted.length === 1
										? 'pessoa confirmada'
										: 'pessoas confirmadas'}{' '}
									a bordo.
								</p>
							) : null}
						</>
					) : null}
				</section>
			) : null}
		</Card>
	);
}

/**
 * Recusar um pedido.
 *
 * O backend exige motivo na recusa, e com razão: "não" sem explicação é a
 * coisa menos útil que um motorista pode dizer a alguém que acabou de se
 * organizar para apanhar uma boleia. O motivo escrito aqui aparece ao
 * passageiro.
 */
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
