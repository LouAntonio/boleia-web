import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useRides, useMyBookings } from '../../hooks/useRides';
import { Select } from '../../components/ui/Select';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCards } from '../../components/ui/Skeleton';
import { RideCard } from '../../components/rides/RideCard';
import { LocalityFilter } from '../../components/rides/LocalityFilter';
import { ProvinceFilter } from '../../components/rides/ProvinceFilter';
import { usePageTitle } from '../../hooks/usePageMeta';
import { useProvinces } from '../../hooks/useLocalities';
import { seatsLeft, toDateInput } from '../../lib/format';
import type { ListRidesQuery } from '../../lib/api';

const MODES = [
	{ value: 'interprovincial' as const, label: 'Interprovincial' },
	{ value: 'intermunicipal' as const, label: 'Intermunicipal' },
];

const SORTS = [
	{ value: 'soon', label: 'Mais próximas' },
	{ value: 'cheap', label: 'Mais baratas' },
	{ value: 'seats', label: 'Mais lugares' },
];

/**
 * Hidrata a pesquisa da landing a partir da query string, uma vez só.
 *
 * Antes desta correcção os parâmetros eram descartados: a pessoa escolhia a
 * rota na primeira página, criava conta, confirmava por WhatsApp e aterrava em
 * `/app/explorar` **sem filtro nenhum**. O CTA principal da landing não levava
 * a lado nenhum.
 *
 * Os valores são ids, nunca nomes: o backend valida-os como UUID e filtra por
 * `ride_stop.localityId` (município) ou por `locality.provinceId` (província).
 * Os nomes vinham da seed com o defeito do CP437 ("Bié" chegava corrompido), o
 * que tornava qualquer correspondência por texto frágil exactamente nas
 * províncias com acentos.
 *
 * **O modo é inferido quando a URL não o diz.** Links anteriores à existência
 * de modos trazem `?de=&para=` — municípios — e um default cego para
 * `interprovincial` faria esses links abrirem vazios, com o filtro ignorado.
 * A regra é a forma dos parâmetros: `deProvincia`/`paraProvincia` significam
 * interprovincial; `de`/`para` sem eles, intermunicipal.
 *
 * Só na montagem: se a pessoa mexer nos selectores depois, a URL já não manda.
 */
function useSearchIntent(apply: (intent: SearchIntent) => void): void {
	const [searchParams] = useSearchParams();
	const done = useRef(false);

	useEffect(() => {
		if (done.current) return;

		const fromProvince = searchParams.get('deProvincia') ?? '';
		const toProvince = searchParams.get('paraProvincia') ?? '';
		const origin = searchParams.get('de') ?? '';
		const destination = searchParams.get('para') ?? '';
		const declared = searchParams.get('modo');

		const byProvince = Boolean(fromProvince || toProvince);
		const byLocality = Boolean(origin || destination);

		// Nada para hidratar: deixar os valores por omissão e não marcar como
		// feito, para um `?modo=` que chegue mais tarde ainda ser lido.
		if (!byProvince && !byLocality && !declared) return;
		done.current = true;

		apply({
			mode:
				declared === 'intermunicipal'
					? 'intermunicipal'
					: declared === 'interprovincial'
						? 'interprovincial'
						: byProvince
							? 'interprovincial'
							: 'intermunicipal',
			origin,
			destination,
			provinceId: searchParams.get('provincia') ?? '',
			fromProvince,
			toProvince,
		});
	}, [searchParams, apply]);
}

interface SearchIntent {
	mode: 'interprovincial' | 'intermunicipal';
	origin: string;
	destination: string;
	provinceId: string;
	fromProvince: string;
	toProvince: string;
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

	const [mode, setMode] = useState<'interprovincial' | 'intermunicipal'>(
		'interprovincial',
	);
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	/** Província que restringe os municípios, no modo intermunicipal. */
	const [provinceId, setProvinceId] = useState('');
	/** Províncias de origem e destino, no modo interprovincial. */
	const [fromProvince, setFromProvince] = useState('');
	const [toProvince, setToProvince] = useState('');
	const [when, setWhen] = useState('');
	const [sort, setSort] = useState('soon');

	const municipal = mode === 'intermunicipal';
	/*
	 * Só se pedem as províncias no modo intermunicipal, onde há um `Select`
	 * que as mostra. No interprovincial quem as pede é o `ProvinceFilter`,
	 * quando alguém o abre.
	 */
	const provinces = useProvinces(municipal);

	/*
	 * A pesquisa da landing page chega aqui, e em dois vocabulários diferentes.
	 *
	 * - **Intermunicipal**: `?provincia=` (a província que restringe) e
	 *   `?de=` / `?para=` (dois `localityId`).
	 * - **Interprovincial**: `?deProvincia=` / `?paraProvincia=` (dois
	 *   `provinceId`).
	 *
	 * Os nomes são distintos de propósito. Se os dois modos partilhassem
	 * `de`/`para`, este ecrã teria de decidir pelo `modo` se o valor é um
	 * município ou uma província — e essa decisão, feita num sítio e não em
	 * todos, é como se mandam ids de província para um filtro de municípios.
	 */
	const applyIntent = useCallback((intent: SearchIntent) => {
		setMode(intent.mode);
		setOrigin(intent.origin);
		setDestination(intent.destination);
		setProvinceId(intent.provinceId);
		setFromProvince(intent.fromProvince);
		setToProvince(intent.toProvince);
	}, []);

	useSearchIntent(applyIntent);

	// O backend aceita um intervalo de datas. Um botão de "hoje / amanhã / 7
	// dias" em vez de um calendário: quem procura boleia quer "quando saem a
	// seguir", e um `date` obriga a pensar em datas em vez de em dias.
	const query = useMemo<ListRidesQuery>(() => {
		const base: ListRidesQuery = { limit: 24 };
		/*
		 * Cada modo manda só o seu vocabulário. O backend trata município e
		 * província como predicados independentes sobre a mesma paragem, por
		 * isso mandar os dois pediria a intersecção — que não é o que nenhum
		 * dos modos quer dizer.
		 */
		if (municipal) {
			if (origin) base.origin = origin;
			if (destination) base.destination = destination;
		} else {
			if (fromProvince) base.originProvinceId = fromProvince;
			if (toProvince) base.destinationProvinceId = toProvince;
		}

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
	}, [municipal, origin, destination, fromProvince, toProvince, when]);

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

	const filtered = municipal
		? Boolean(origin || destination || when)
		: Boolean(fromProvince || toProvince || when);

	/** Trocar de modo limpa as escolhas do modo anterior. */
	function changeMode(next: 'interprovincial' | 'intermunicipal') {
		if (next === mode) return;
		setMode(next);
		setOrigin('');
		setDestination('');
		setProvinceId('');
		setFromProvince('');
		setToProvince('');
	}

	function changeProvince(next: string) {
		setProvinceId(next);
		setOrigin('');
		setDestination('');
	}

	function clearFilters() {
		setOrigin('');
		setDestination('');
		setProvinceId('');
		setFromProvince('');
		setToProvince('');
		setWhen('');
	}

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
			{/*
			 * O modo é a primeira escolha, antes dos campos que dele dependem:
			 * em interprovincial não há municípios para escolher, e em
			 * intermunicipal há uma província que os restringe. Pôr os filtros
			 * primeiro e o modo depois obrigaria a pessoa a preencher campos
			 * que iam desaparecer.
			 */}
			<div className="rounded-lg border border-line bg-surface p-4">
				<SegmentedControl
					label="Tipo de viagem"
					options={MODES}
					value={mode}
					onChange={changeMode}
					className="max-w-md"
				/>

				<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{municipal ? (
						<>
							<Select
								label="Província"
								value={provinceId}
								onChange={changeProvince}
								options={(provinces.data ?? []).map((province) => ({
									value: province.id,
									label: province.name,
								}))}
								placeholder="Todas"
								hint="A origem e o destino ficam dentro desta província."
							/>
							<LocalityFilter
								label="De onde"
								value={origin}
								onChange={setOrigin}
								exclude={destination}
								placeholder="Todos"
								restrictToProvinceId={provinceId || null}
								lazy
							/>
							<LocalityFilter
								label="Para onde"
								value={destination}
								onChange={setDestination}
								exclude={origin}
								placeholder="Todos"
								restrictToProvinceId={provinceId || null}
								lazy
							/>
						</>
					) : (
						<>
							<ProvinceFilter
								label="De onde"
								value={fromProvince}
								onChange={setFromProvince}
								exclude={toProvince}
								placeholder="Todas"
							/>
							<ProvinceFilter
								label="Para onde"
								value={toProvince}
								onChange={setToProvince}
								exclude={fromProvince}
								placeholder="Todas"
							/>
						</>
					)}

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
							<Button variant="secondary" onClick={clearFilters}>
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
