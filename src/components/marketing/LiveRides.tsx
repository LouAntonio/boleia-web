import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SeatGrid } from '../ui/SeatGrid';
import { Button } from '../ui/Button';
import { RoadTrack } from './RoadTrack';
import {
	hhmm,
	durationBetween,
	relativeDay,
	routeEndpoints,
} from '../../lib/format';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import type { PublicRide } from '../../types/api';

/**
 * As boleias a sair de verdade.
 *
 * Esta é a única secção da landing que pede dados, e é pública: o backend expõe
 * `GET /api/rides/public`, que só devolve corridas agendadas com lugares
 * livres, sem o nome nem o id do motorista.
 *
 * Se o pedido falhar — servidor em baixo, rota ainda não implantada, rede
 * bloqueada — a secção desaparece em silêncio em vez de mostrar um cartão de
 * erro. Numa página institucional, um aviso de "não foi possível carregar" a
 * meio da leitura é pior do que não mostrar a lista: a página continua a dizer
 * a verdade sobre o produto, e o link "ver todas" continua a funcionar.
 */
export function LiveRides() {
	const { data, isError, isPending } = useQuery({
		queryKey: qk.publicRides(6),
		queryFn: () => api.listPublicRides(6),
		retry: false,
		staleTime: 1000 * 60,
	});

	if (isPending || isError || !data || data.length === 0) return null;

	return (
		<section id="boleias" className="scroll-mt-20 border-b border-line">
			<div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
				<header className="flex flex-wrap items-end justify-between gap-6">
					<div className="max-w-2xl">
						<h2 className="text-h2 text-ink">A partir de agora</h2>
						<p className="mt-3 text-body text-muted">
							Estas{' '}
							{data.length === 1 ? 'boleia está' : `boleias estão`}{' '}
							agendadas neste momento e ainda{' '}
							{data.length === 1 ? 'tem' : 'têm'} lugares. A lista
							muda de minuto a minuto.
						</p>
					</div>

					<Link to="/boleias">
						<Button variant="secondary">
							Ver todas
							<ArrowRight size={16} aria-hidden="true" />
						</Button>
					</Link>
				</header>

				<div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{data.map((ride) => (
						<PublicRideCard key={ride.id} ride={ride} />
					))}
				</div>
			</div>
		</section>
	);
}

function PublicRideCard({ ride }: { ride: PublicRide }) {
	/*
	 * A rota vem numa string só. `originName`/`destinationName` nunca existiram
	 * no `RIDE_PUBLIC_SELECT`, e usá-los punha `undefined` no ecrã e no
	 * `aria-label` do `RoadTrack` — que é lido em voz alta.
	 */
	const { origin, destination } = routeEndpoints(ride.routeName);

	return (
		<article className="flex flex-col rounded-lg border border-line bg-surface p-6">
			<header className="flex items-baseline justify-between gap-3">
				<h3 className="text-h3 text-ink">{ride.routeName}</h3>
				<span className="shrink-0 font-mono text-data text-muted">
					{relativeDay(ride.departureAt)}
				</span>
			</header>

			<div className="mt-5 border-t border-line pt-5">
				<RoadTrack
					animate={false}
					height={96}
					stops={[
						{ name: origin, time: hhmm(ride.departureAt) },
						{ name: destination, time: hhmm(ride.arrivalAt) },
					]}
				/>
			</div>

			<SeatGrid
				total={ride.seatsTotal}
				taken={ride.seatsTaken}
				className="mt-2"
			/>

			<footer className="mt-5 border-t border-line pt-4">
				<div className="flex items-baseline justify-between gap-3">
					<span className="text-h3 font-medium text-ink">
						{ride.pricePerSeat.toLocaleString('pt-PT')} Kz
						<span className="text-body font-normal text-muted">
							{' '}
							por lugar
						</span>
					</span>
					<span className="font-mono text-data text-muted">
						{durationBetween(ride.departureAt, ride.arrivalAt)}
					</span>
				</div>

				{/*
				 * O cartão da home é de decisão, não de vitrina: um pedido
				 * passa pela página do detalhe, que explica o percurso e
				 * pede a conta se não houver. "Reservar" leva lá — é o
				 * mesmo cartão que quem já entrou clica, com o mesmo
				 * vocabulário.
				 */}
				<Link
					to={`/viagens/${ride.id}`}
					className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-label font-medium text-brand-ink transition-colors hover:bg-brand/90"
				>
					Reservar
					<ArrowRight size={15} aria-hidden="true" />
				</Link>
			</footer>
		</article>
	);
}
