import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Search } from 'lucide-react';
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
import { PROVINCES } from '../../lib/locations';
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

const DATE_OPTIONS = [
	{ value: '', label: 'Qualquer dia' },
	{ value: '0', label: 'Hoje' },
	{ value: '1', label: 'Amanhã' },
	{ value: '7', label: 'Próximos 7 dias' },
	{ value: '30', label: 'Próximos 30 dias' },
];

const PROVINCE_OPTIONS = PROVINCES.map((province) => ({
	value: province.code,
	label: province.name,
}));

/**
 * Os campos que compõem uma pesquisa.
 *
 * Cada modo tem o seu vocabulário e só o seu vai para a API: município em
 * `origin`/`destination`, província em `originProvinceId`/`destinationProvinceId`.
 * O backend trata-os como predicados independentes sobre a mesma paragem, por
 * isso mandar os dois pediria a intersecção — que não é o que nenhum dos modos
 * quer dizer.
 *
 * **Os valores são códigos, não UUIDs.** A lista de províncias e municípios é
 * local (`lib/locations.ts`) e não conhece ids. O código do município já traz a
 * província (`huambo.catabola`), o que desambigua os três nomes repetidos.
 */
interface Filters {
	mode: 'interprovincial' | 'intermunicipal';
	origin: string;
	destination: string;
	/** Província que restringe os municípios, no modo intermunicipal. */
	province: string;
	/** Províncias de origem e destino, no modo interprovincial. */
	fromProvince: string;
	toProvince: string;
	when: string;
}

const EMPTY_FILTERS: Filters = {
	mode: 'interprovincial',
	origin: '',
	destination: '',
	province: '',
	fromProvince: '',
	toProvince: '',
	when: '',
};

function sameFilters(a: Filters, b: Filters): boolean {
	return (
		a.mode === b.mode &&
		a.origin === b.origin &&
		a.destination === b.destination &&
		a.province === b.province &&
		a.fromProvince === b.fromProvince &&
		a.toProvince === b.toProvince &&
		a.when === b.when
	);
}

/**
 * Hidrata a pesquisa da landing a partir da query string, uma vez só.
 *
 * Antes desta correcção os parâmetros eram descartados: a pessoa escolhia a
 * rota na primeira página, criava conta, confirmava por WhatsApp e aterrava em
 * `/app/explorar` **sem filtro nenhum**. O CTA principal da landing não levava
 * a lado nenhum.
 *
 * **O modo é inferido quando a URL não o diz.** Links anteriores à existência
 * de modos trazem `?de=&para=` — municípios — e um default cego para
 * `interprovincial` faria esses links abrirem vazios, com o filtro ignorado.
 * A regra é a forma dos parâmetros: `deProvincia`/`paraProvincia` significam
 * interprovincial; `de`/`para` sem eles, intermunicipal.
 *
 * Só na montagem: se a pessoa mexer nos selectores depois, a URL já não manda.
 */
function useSearchIntent(apply: (intent: Filters) => void): void {
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
			province: searchParams.get('provincia') ?? '',
			fromProvince,
			toProvince,
			when: '',
		});
	}, [searchParams, apply]);
}

export function ExplorePage() {
	usePageTitle('Explorar');

	/*
	 * Dois estados, não um.
	 *
	 * `draft` é o que está nos campos; `applied` é o que foi pesquisado, e é
	 * **só ele** que entra na chave do `useRides`. Antes, cada mudança de
	 * filtro disparava logo um pedido: escolher "Luanda" e depois "Benguela"
	 * fazia duas pesquisas, e a primeira nunca interessou a ninguém.
	 *
	 * A limpeza também passa por aqui: repõe os dois e faz um único pedido
	 * sem filtros, em vez de um por cada campo limpo.
	 */
	const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
	const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
	const [sort, setSort] = useState('soon');

	const municipal = draft.mode === 'intermunicipal';
	const dirty = !sameFilters(draft, applied);

	const applyIntent = useCallback((intent: Filters) => {
		setDraft(intent);
		// Um link com filtros é uma pesquisa pedida: aplica-se logo, senão o
		// CTA da landing voltava a chegar a uma lista sem filtro.
		setApplied(intent);
	}, []);

	useSearchIntent(applyIntent);

	// O backend aceita um intervalo de datas. Um botão de "hoje / amanhã / 7
	// dias" em vez de um calendário: quem procura boleia quer "quando saem a
	// seguir", e um `date` obriga a pensar em datas em vez de em dias.
	const query = useMemo<ListRidesQuery>(() => {
		const base: ListRidesQuery = { limit: 24 };
		if (applied.mode === 'intermunicipal') {
			if (applied.origin) base.origin = applied.origin;
			if (applied.destination) base.destination = applied.destination;
		} else {
			if (applied.fromProvince) {
				base.originProvinceId = applied.fromProvince;
			}
			if (applied.toProvince) {
				base.destinationProvinceId = applied.toProvince;
			}
		}

		if (applied.when === '0') {
			base.date = toDateInput(new Date().toISOString());
		} else if (applied.when === '1') {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			base.date = toDateInput(tomorrow.toISOString());
		} else if (applied.when) {
			base.dateFrom = toDateInput(new Date().toISOString());
			const limit = new Date();
			limit.setDate(limit.getDate() + Number(applied.when));
			base.dateTo = toDateInput(limit.toISOString());
		}

		return base;
	}, [applied]);

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

	// O que está na lista é o que foi pesquisado, não o que está a ser
	// preenchido: senão o cabeçalho contava resultados de filtros ainda por
	// aplicar.
	const filtered =
		applied.mode === 'intermunicipal'
			? Boolean(applied.origin || applied.destination || applied.when)
			: Boolean(applied.fromProvince || applied.toProvince || applied.when);

	function change<K extends keyof Filters>(key: K, value: Filters[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	/** Trocar de modo limpa as escolhas do modo anterior. */
	function changeMode(next: 'interprovincial' | 'intermunicipal') {
		if (next === draft.mode) return;
		setDraft({
			...draft,
			mode: next,
			origin: '',
			destination: '',
			province: '',
			fromProvince: '',
			toProvince: '',
		});
	}

	function changeProvince(next: string) {
		setDraft((current) => ({
			...current,
			province: next,
			origin: '',
			destination: '',
		}));
	}

	function search() {
		setApplied(draft);
	}

	function clearFilters() {
		setDraft(EMPTY_FILTERS);
		setApplied(EMPTY_FILTERS);
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
					value={draft.mode}
					onChange={changeMode}
					className="max-w-md"
				/>

				<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{municipal ? (
						<>
							<Select
								label="Província"
								value={draft.province}
								onChange={changeProvince}
								options={PROVINCE_OPTIONS}
								placeholder="Todas"
								hint="A origem e o destino ficam dentro desta província."
							/>
							<LocalityFilter
								label="De onde"
								value={draft.origin}
								onChange={(code) => change('origin', code)}
								exclude={draft.destination}
								placeholder="Todos"
								restrictToProvince={draft.province || null}
							/>
							<LocalityFilter
								label="Para onde"
								value={draft.destination}
								onChange={(code) => change('destination', code)}
								exclude={draft.origin}
								placeholder="Todos"
								restrictToProvince={draft.province || null}
							/>
						</>
					) : (
						<>
							<ProvinceFilter
								label="De onde"
								value={draft.fromProvince}
								onChange={(code) => change('fromProvince', code)}
								exclude={draft.toProvince}
								placeholder="Todas"
							/>
							<ProvinceFilter
								label="Para onde"
								value={draft.toProvince}
								onChange={(code) => change('toProvince', code)}
								exclude={draft.fromProvince}
								placeholder="Todas"
							/>
						</>
					)}

					<Select
						label="Quando"
						value={draft.when}
						onChange={(value) => change('when', value)}
						options={DATE_OPTIONS}
					/>
					<Select
						label="Ordenar por"
						value={sort}
						onChange={setSort}
						options={SORTS}
					/>
				</div>

				{/*
				 * Pesquisar e limpar são actos explícitos. Os selectores só
				 * mexem no rascunho; nenhum deles faz um pedido. `Limpar` repõe
				 * os campos e aplica logo a pesquisa vazia, porque limpar é,
				 * por si só, o pedido de "mostra-me tudo".
				 */}
				<div className="mt-4 flex flex-wrap items-center gap-3">
					<Button onClick={search}>
						<Search size={16} aria-hidden="true" />
						Pesquisar
					</Button>
					<Button variant="secondary" onClick={clearFilters}>
						Limpar filtros
					</Button>
					{dirty ? (
						<p className="text-small text-muted">
							Tens alterações por aplicar.
						</p>
					) : null}
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
								Limpar filtros
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
