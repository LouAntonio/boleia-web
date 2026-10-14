import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useRides, useMyBookings } from '../../hooks/useRides';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCards } from '../../components/ui/Skeleton';
import { RideCard } from '../../components/rides/RideCard';
import { LocalityFilter } from '../../components/rides/LocalityFilter';
import { usePageTitle } from '../../hooks/usePageMeta';
import { seatsLeft, toDateInput } from '../../lib/format';
import type { ListRidesQuery } from '../../lib/api';

const SORTS = [
	{ value: 'soon', label: 'Mais próximas' },
	{ value: 'cheap', label: 'Mais baratas' },
	{ value: 'seats', label: 'Mais lugares' },
];

/**
 * Hidrata um filtro a partir da query string, uma vez só.
 *
 * A pesquisa da landing page chega aqui por `?de=<localityId>&para=<localityId>`.
 * Antes desta correcção esses parâmetros eram descartados: a pessoa escolhia a
 * rota na primeira página, criava conta, confirmava por WhatsApp e aterrava
 * em `/app/explorar` **sem filtro nenhum**. O CTA principal da landing não
 * levava a lado nenhum.
 *
 * O valor é um `localityId` e não um nome. O backend filtra por
 * `ride_stop.localityId` e valida o valor como UUID; a hero deixa de
 * converter o que a pessoa escolheu num nome para o 阅读 voltar a adivinhar
 * qual localidade é. Os nomes vinham da seed com o defecto do CP437
 * ("Bié" chegava como `Bi\u251C\u00AE`), o que tornava qualquer
 * correspondência por texto frágil exactamente nas províncias com acentos.
 *
 * Só na montagem: se a pessoa mexer no selector depois, a URL já não manda.
 */
function useFilterFromUrl(
	param: string,
	apply: (localityId: string) => void,
): void {
	const [searchParams] = useSearchParams();
	const done = useRef(false);

	useEffect(() => {
		if (done.current) return;
		const value = searchParams.get(param);
		if (!value) return;
		done.current = true;
		apply(value);
	}, [param, searchParams, apply]);
}

const DATE_OPTIONS = [
	{ value: '', label: 'Qualquer dia' },
	{ value: '0', label: 'Hoje' },
	{ value: '1', label: 'Amanhã' },
	{ value: '7', label: 'Próximos 7 dias' },
	{ value: '30', label: 'Próximos 30 dias' },
];

export function ExplorePage() {
	usePageTitle('Explorar');

	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	const [when, setWhen] = useState('');
	const [sort, setSort] = useState('soon');

	/*
	 * A pesquisa da landing page chega aqui.
	 *
	 * A hero manda `?de=<província>&para=<província>` e, antes desta
	 * correcção, esses parâmetros eram descartados: a pessoa escolhia a rota
	 * na primeira página, criava conta, confirmava por WhatsApp e aterrava
	 * aqui **sem filtro nenhum**. O CTA principal da landing não levava a lado
	 * nenhum.
	 *
	 * O backend filtra por `ride_stop.localityId` e valida o valor como UUID,
	 * por isso a query string traz o id e não o nome.
	 */
	useFilterFromUrl('de', setOrigin);
	useFilterFromUrl('para', setDestination);

	// O backend aceita um intervalo de datas. Um botão de "hoje / amanhã / 7
	// dias" em vez de um calendário: quem procura boleia quer "quando saem a
	// seguir", e um `date` obriga a pensar em datas em vez de em dias.
	const query = useMemo<ListRidesQuery>(() => {
		const base: ListRidesQuery = { limit: 24 };
		// Ids de localidade, nunca nomes de província: o backend filtra por
		// `ride_stop.localityId` e valida o valor como UUID.
		if (origin) base.origin = origin;
		if (destination) base.destination = destination;

		if (when === '0') base.date = toDateInput(new Date().toISOString());
		else if (when === '1') {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			base.date = toDateInput(tomorrow.toISOString());
		} else if (when) {
			base.dateFrom = toDateInput(new Date().toISOString());
			const limit = new Date();
			limit.setDate(limit.getDate() + Number(when));
			base.dateTo = toDateInput(limit.toISOString());
		}

		return base;
	}, [origin, destination, when]);

	const { data, isPending, isError, refetch } = useRides(query);
	const { data: myBookings = [] } = useMyBookings();

	// Quais corridas já estão reservadas. Sem isto, quem volta ao separador
	// explorar vê as mesmas boleias que acabou de reservar como se ainda
	// estivessem livres.
	const reservedIds = useMemo(
		() =>
			new Set(
				myBookings
					.filter((booking) =>
						[
							'REQUESTED',
							'CONFIRMED',
							'IN_PROGRESS',
							'COMPLETED',
						].includes(booking.status),
					)
					.map((booking) => booking.rideId),
			),
		[myBookings],
	);

	const rides = useMemo(() => {
		const rows = [...(data?.rows ?? [])];

		if (sort === 'cheap') rows.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
		if (sort === 'seats') {
			/*
			 * Ordena por lugares livres com o mesmo clamp que os cartões usam.
			 * Sem ele, uma corrida sobrelotada (negativo) saltava para o topo
			 * da lista de "mais lugares" — o oposto do que a pessoa pediu.
			 */
			rows.sort(
				(a, b) =>
					seatsLeft(b.seatsTotal, b.seatsTaken) -
					seatsLeft(a.seatsTotal, a.seatsTaken),
			);
		}
		// 'soon' chega do servidor já ordenado por `departureAt`.

		return rows;
	}, [data, sort]);

	const filtered = Boolean(origin || destination || when);

	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="text-h2 text-ink">Boleias a partir</h1>
				<p className="mt-2 text-body text-muted">
					{filtered
						? `${rides.length} ${rides.length === 1 ? 'resultado' : 'resultados'} para o que procuraste.`
						: 'Tudo o que está agendado e ainda tem lugares.'}
				</p>
			</header>

			{/*
			 * Os filtros num cartão só, e não dispersos pela página. Numa grelha
			 * de cartões, filtros no topo e resultados em baixo é a única forma
			 * de a pessoa saber o que está a ver sem voltar ao topo.
			 */}
			<div className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
				<LocalityFilter
					label="De onde"
					value={origin}
					onChange={setOrigin}
					exclude={destination}
					placeholder="Todos"
				/>
				<LocalityFilter
					label="Para onde"
					value={destination}
					onChange={setDestination}
					exclude={origin}
					placeholder="Todos"
				/>
				<Select
					label="Quando"
					value={when}
					onChange={setWhen}
					options={DATE_OPTIONS}
				/>
				<Select
					label="Ordenar por"
					value={sort}
					onChange={setSort}
					options={SORTS}
				/>
			</div>

			{isPending ? <SkeletonCards count={6} /> : null}

			{isError ? (
				<EmptyState
					icon={<Compass size={32} />}
					title="Não foi possível carregar as boleias"
					description="O servidor não respondeu. Pode ser a ligação ou a API em baixo."
					action={
						<Button variant="secondary" onClick={() => refetch()}>
							Tentar de novo
						</Button>
					}
				/>
			) : null}

			{!isPending && !isError && rides.length === 0 ? (
				<EmptyState
					icon={<Compass size={32} />}
					title="Nenhuma boleia com estes filtros"
					description={
						filtered
							? 'Experimenta alargar o dia ou tirar uma das províncias. Se não houver, a rota ainda não foi publicada.'
							: 'Ainda não há boleias agendadas. Volta mais tarde — é a mesma coisa que está a acontecer no telemóvel.'
					}
					action={
						filtered ? (
							<Button
								variant="secondary"
								onClick={() => {
									setOrigin('');
									setDestination('');
									setWhen('');
								}}
							>
								Tirar os filtros
							</Button>
						) : undefined
					}
				/>
			) : null}

			{!isPending && !isError && rides.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{rides.map((ride) => (
						<RideCard
							key={ride.id}
							ride={ride}
							reserved={reservedIds.has(ride.id)}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}
