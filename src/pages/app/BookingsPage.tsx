import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX2 } from 'lucide-react';
import { useMyBookings, useCancelBooking } from '../../hooks/useRides';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { usePageTitle } from '../../hooks/usePageMeta';
import { fmtLongDate, hhmm, fmtKz } from '../../lib/format';
import type { Booking } from '../../types/api';

/** Reservas que ainda podem ser mexidas. Depois disso, é histórico. */
const OPEN: string[] = ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'];

export function BookingsPage() {
	usePageTitle('Reservas');

	const { data: bookings, isPending } = useMyBookings();
	const [cancelling, setCancelling] = useState<Booking | null>(null);

	const open = (bookings ?? []).filter((b) => OPEN.includes(b.status));
	const past = (bookings ?? []).filter((b) => !OPEN.includes(b.status));

	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="text-h2 text-ink">As minhas reservas</h1>
				<p className="mt-2 text-body text-muted">
					{open.length > 0
						? `${open.length} ${open.length === 1 ? 'viagem reservada' : 'viagens reservadas'}.`
						: 'Ainda não reservaste nenhum lugar.'}
				</p>
			</header>

			{isPending ? (
				<div className="flex flex-col gap-4">
					<SkeletonLine className="h-32 w-full" />
					<SkeletonLine className="h-32 w-full" />
				</div>
			) : null}

			{!isPending && open.length === 0 && past.length === 0 ? (
				<EmptyState
					icon={<CalendarX2 size={32} />}
					title="Sem reservas"
					description="Quando reservares um lugar numa boleia, ela aparece aqui com o estado do pedido."
					action={
						<Link to="/app/explorar">
							<Button>Explorar boleias</Button>
						</Link>
					}
				/>
			) : null}

			{open.length > 0 ? (
				<ul className="flex flex-col gap-4">
					{open.map((booking) => (
						<li key={booking.id}>
							<BookingRow
								booking={booking}
								onCancel={setCancelling}
							/>
						</li>
					))}
				</ul>
			) : null}

			{past.length > 0 ? (
				<section>
					<h2 className="text-h3 text-ink">Anteriores</h2>
					<ul className="mt-4 flex flex-col gap-3">
						{past.map((booking) => (
							<li key={booking.id}>
								<BookingRow booking={booking} />
							</li>
						))}
					</ul>
				</section>
			) : null}

			{cancelling ? (
				<CancelDialog
					booking={cancelling}
					onClose={() => setCancelling(null)}
				/>
			) : null}
		</div>
	);
}

function BookingRow({
	booking,
	onCancel,
}: {
	booking: Booking;
	onCancel?: (booking: Booking) => void;
}) {
	const ride = booking.ride;
	const canCancel = onCancel && OPEN.includes(booking.status);

	return (
		<Card className="p-5">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<h3 className="text-h3 text-ink">
						{ride?.routeName ?? 'Boleia'}
					</h3>

					{ride ? (
						<p className="mt-1.5 text-body text-muted">
							{fmtLongDate(ride.departureAt)},{' '}
							{hhmm(ride.departureAt)}
						</p>
					) : null}

					<p className="mt-3 text-small text-muted">
						{booking.seats} {booking.seats === 1 ? 'lugar' : 'lugares'}{' '}
						· {fmtKz(booking.amount)} em dinheiro
					</p>

					{booking.reason ? (
						<p className="mt-3 rounded-md bg-canvas px-3 py-2 text-small text-muted">
							Motivo: {booking.reason}
						</p>
					) : null}
				</div>

				<div className="flex shrink-0 flex-col items-end gap-3">
					<StatusStamp status={booking.status} />
					{ride ? (
						<Link
							to={`/app/viagens/${ride.id}`}
							className="rounded-sm text-small text-brand-text underline-offset-4 hover:underline"
						>
							Ver boleia
						</Link>
					) : null}
					{canCancel ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onCancel(booking)}
						>
							Cancelar
						</Button>
					) : null}
				</div>
			</div>
		</Card>
	);
}

/**
 * O motivo do cancelamento.
 *
 * O backend aceita-o e é opcional, mas vale a pena pedi-lo: é o que permite ao
 * motorista saber se a pessoa desistiu por não ter o dinheiro da gasolina, por
 * ter encontrado boleia noutra parte, ou por outra razão. É também a única
 * hipótese de alguém trocar o lugar a outro antes de partir.
 */
function CancelDialog({
	booking,
	onClose,
}: {
	booking: Booking;
	onClose: () => void;
}) {
	const [reason, setReason] = useState('');
	const cancel = useCancelBooking();

	return (
		<Modal
			title="Cancelar este lugar?"
			description="O lugar volta a ficar livre para outra pessoa. Se já pagaste, o motorista fica com o aviso."
			onClose={cancel.isPending ? undefined : onClose}
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="motivo" className="text-label text-ink">
						Motivo (opcional)
					</label>
					<textarea
						id="motivo"
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						maxLength={500}
						rows={3}
						placeholder="Ex.: já encontrei boleia noutra parte."
						className="rounded-md border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted focus:border-brand"
					/>
				</div>

				<div className="flex gap-3">
					<Button
						variant="secondary"
						onClick={onClose}
						disabled={cancel.isPending}
					>
						Manter o lugar
					</Button>
					<Button
						variant="danger"
						onClick={() =>
							cancel.mutate(
								{
									bookingId: booking.id,
									reason: reason.trim() || undefined,
								},
								{ onSuccess: onClose },
							)
						}
						disabled={cancel.isPending}
					>
						{cancel.isPending ? 'A cancelar…' : 'Cancelar lugar'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
