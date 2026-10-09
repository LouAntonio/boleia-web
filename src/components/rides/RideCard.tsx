import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RoadTrack } from '../marketing/RoadTrack';
import { SeatGrid } from '../ui/SeatGrid';
import { hhmm, relativeDay, durationBetween, seatsLeft } from '../../lib/format';
import { statusMeta } from '../../lib/status';
import type { Ride } from '../../types/api';

/**
 * O cartão de uma corrida na lista.
 *
 * A ordem de leitura é a ordem de decisão: onde vai, quando parte, quantos
 * lugares ainda há, quanto custa. O preço fica no canto porque é o último número
 * que interessa, não o primeiro.
 *
 * Uma corrida sem paragens é um dado incoerente do servidor, não uma corrida sem
 * origem. Aqui, quando `stops` não vem ou tem menos de dois pontos, o cartão
 * mostra a origem e o destino pelas vezes de partida e chegada, que o backend
 * sempre envia. A alternativa — um cartão sem origem — seria pior.
 */
export function RideCard({
	ride,
	reserved = false,
}: {
	ride: Ride;
	reserved?: boolean;
}) {
	const stops = (ride.stops ?? []).filter((stop) => Boolean(stop.name));

	const track =
		stops.length >= 2
			? stops.map((stop) => ({ name: stop.name, time: stop.timeLabel }))
			: [
					{
						name: originOf(ride),
						time: hhmm(ride.departureAt),
					},
					{
						name: ride.routeName || 'Destino',
						time: hhmm(ride.arrivalAt),
					},
				];

	const free = seatsLeft(ride.seatsTotal, ride.seatsTaken);
	const sold = free === 0;
	const { label: statusLabel } = statusMeta(ride.status);

	return (
		<article className="flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand/40">
			<header className="flex items-start justify-between gap-3">
				<h3 className="text-h3 text-ink">{ride.routeName}</h3>

				<span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-small text-muted">
					{statusLabel}
				</span>
			</header>

			<div className="mt-4 border-t border-line pt-4">
				<RoadTrack stops={track} animate={false} height={96} />
			</div>

			<div className="mt-2 flex items-baseline justify-between gap-3">
				<span className="text-small text-muted">
					{relativeDay(ride.departureAt)}
				</span>
				<span className="font-mono text-data text-muted">
					{durationBetween(ride.departureAt, ride.arrivalAt)}
				</span>
			</div>

			<div className="mt-4">
				<SeatGrid total={ride.seatsTotal} taken={ride.seatsTaken} />
			</div>

			<footer className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
				<div>
					<span className="text-h3 font-medium text-ink">
						{ride.pricePerSeat.toLocaleString('pt-PT')} Kz
					</span>
					<span className="ml-1.5 text-small text-muted">por lugar</span>
				</div>

				{sold ? (
					<span className="rounded-md bg-canvas px-3 py-2 text-small text-muted">
						Sem lugares
					</span>
				) : (
					<Link
						to={`/app/viagens/${ride.id}`}
						className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-label font-medium text-brand-ink transition-colors hover:bg-brand/90"
					>
						{reserved ? 'Ver' : 'Reservar'}
						<ArrowRight size={15} aria-hidden="true" />
					</Link>
				)}
			</footer>
		</article>
	);
}

/**
 * O nome da origem.
 *
 * `routeName` no backend é o nome do percurso inteiro ("Luanda → Benguela"), e
 * o primeiro cartão é o melhor palpite que existe sem a lista de paragens. Quando
 * há separador, corta no meio e fica com o primeiro membro.
 */
function originOf(ride: Ride): string {
	return ride.routeName.split(/[–—>-]/)[0]?.trim() || ride.routeName;
}
