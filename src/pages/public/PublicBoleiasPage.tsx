import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Compass, Search } from 'lucide-react';
import { usePublicRideSearch } from '../../hooks/useRides';
import { Select } from '../../components/ui/Select';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCards } from '../../components/ui/Skeleton';
import { SeatGrid } from '../../components/ui/SeatGrid';
import { RoadTrack } from '../../components/marketing/RoadTrack';
import { LocalityFilter } from '../../components/rides/LocalityFilter';
import { ProvinceFilter } from '../../components/rides/ProvinceFilter';
import { DateRangeFilter } from '../../components/rides/DateRangeFilter';
import { usePageMeta } from '../../hooks/usePageMeta';
import { PROVINCES } from '../../lib/locations';
import {
	hhmm,
	durationBetween,
	relativeDay,
	routeEndpoints,
	seatsLeft,
} from '../../lib/format';
import type { PublicRide } from '../../types/api';

/**
 * Pesquisa pública de boleias.
 *
 * Esta página dá a efectividade do produto a quem ainda não tem conta: a
 * mesma grelha de cartões que a landing mostra, mas com filtros e tudo. O
 * backend responde sem sessão (`/api/rides/public/search`) e devolve o total
 * em `X-Total-Count`, é ele que sabe se ainda vale mostrar "carregar mais".
 *
 * Os filtros são os mesmos de `/app/explorar` de propósito: quem cria conta
 * não deve re-aprender nada. O que muda aqui é o CTA do cartão — em vez de
 * reservar, leva ao detalhe público, onde a autenticação é pedida apenas
 * quando a pessoa decide pedir o lugar.
 */

const MODES = [
	{ value: 'interprovincial' as const, label: 'Interprovincial' },
	{ value: 'intermunicipal' as const, label: 'Intermunicipal' },
];

const PAGE_SIZE = 12;

/** Igual a `ExplorePage`: os campos são os mesmos, um estado só. */
interface Filters {
	mode: 'interprovincial' | 'intermunicipal';
	origin: string;
	destination: string;
	province: string;
	fromProvince: string;
	toProvince: string;
	dateFrom: string;
	dateTo: string;
}

const EMPTY_FILTERS: Filters = {
	mode: 'interprovincial',
	origin: '',
	destination: '',
	province: '',
	fromProvince: '',
	toProvince: '',
	dateFrom: '',
	dateTo: '',
};

function provinceOf(municipalityCode: string): string {
	if (!municipalityCode) return '';
	for (const province of PROVINCES) {
		if (
			province.municipalities.some(
				(municipality) => municipality.code === municipalityCode,
			)
		) {
			return province.code;
		}
	}
	return '';
}

/**
 * Hidrata a pesquisa da landing (os links antigos trazem ?de=&para=).
 *
 * É a mesma regra de `/app/explorar`: só os parâmetros que vierem na query
 * string inicial mandam, e o modo é inferido da sua forma quando a URL não o
 * diz. Depois, quem mexe nos selectores manda.
 */
function useSearchIntent(apply: (intent: Filters) => void): void {
	const [searchParams] = useSearchParams();
	const done = useRef(false);

	useEffect(() => {
		if (done.current) return;

		const fromProvince = searchParams.get('deProvincia') ?? '';
		const toProvince = searchParams.get('paraProvincia') ?? '';
		let origin = searchParams.get('de') ?? '';
		let destination = searchParams.get('para') ?? '';
		const declared = searchParams.get('modo');

		const byProvince = Boolean(fromProvince || toProvince);
		const byLocality = Boolean(origin || destination);

		if (!byProvince && !byLocality && !declared) return;
		done.current = true;

		const mode: Filters['mode'] =
			declared === 'intermunicipal'
				? 'intermunicipal'
				: declared === 'interprovincial'
					? 'interprovincial'
					: byProvince
						? 'interprovincial'
						: 'intermunicipal';

		let province = searchParams.get('provincia') ?? '';
		if (mode === 'intermunicipal') {
			if (!province) {
				province = provinceOf(origin) || provinceOf(destination);
			}
			if (province && origin && provinceOf(origin) !== province) {
				origin = '';
			}
			if (province && destination && provinceOf(destination) !== province) {
				destination = '';
			}
		}

		apply({
			mode,
			origin,
			destination,
			province,
			fromProvince,
			toProvince,
			dateFrom: '',
			dateTo: '',
		});
	}, [searchParams, apply]);
}

export function PublicBoleiasPage() {
	usePageMeta(
		'Boleias',
		'O que sai a partir de agora, com lugares livres. Pesquisa sem entrar na conta.',
	);

	const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
	const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
	const [sort, setSort] = useState('soon');

	const municipal = draft.mode === 'intermunicipal';

	const applyIntent = useCallback((intent: Filters) => {
		setDraft(intent);
		setApplied(intent);
	}, []);

	useSearchIntent(applyIntent);

	// A chave da consulta é o `applied`, nunca o `draft`. Um filtro a meio do
	// escrever não dispara pedido — é "Pesquisar" que dispara, e é o mesmo
	// acerto que a app autenticada já tinha.
	const query = useMemo(() => {
		const base: {
			limit: number;
			scope: 'INTERMUNICIPAL' | 'INTERPROVINCIAL';
			origin?: string;
			destination?: string;
			originProvinceId?: string;
			destinationProvinceId?: string;
			dateFrom?: string;
			dateTo?: string;
		} = {
			limit: PAGE_SIZE,
			scope:
				applied.mode === 'intermunicipal'
					? 'INTERMUNICIPAL'
					: 'INTERPROVINCIAL',
		};
		if (applied.mode === 'intermunicipal') {
			if (applied.origin) base.origin = applied.origin;
			if (applied.destination) base.destination = applied.destination;
		} else {
			if (applied.fromProvince) base.originProvinceId = applied.fromProvince;
			if (applied.toProvince) base.destinationProvinceId = applied.toProvince;
		}
		if (applied.dateFrom) base.dateFrom = applied.dateFrom;
		if (applied.dateTo) base.dateTo = applied.dateTo;
		return base;
	}, [applied]);

	const result = usePublicRideSearch(query, true);
	// O `useMemo` no `pages` não é purismo: o useMemo abaixo lista-o nas
	// dependências, e um array novo em cada render recalcava as linhas até
	// num estado que só mudava de tema.
	const pages = useMemo(() => result.data?.pages ?? [], [result.data]);
	const rows = useMemo(() => pages.flatMap((page) => page.rows ?? []), [pages]);
	const total = pages[0]?.total ?? 0;
	const noResults = !result.isPending && !result.isError && rows.length === 0;

	const filtered =
		applied.mode === 'intermunicipal'
			? Boolean(
					applied.origin ||
					applied.destination ||
					applied.dateFrom ||
					applied.dateTo,
				)
			: Boolean(
					applied.fromProvince ||
					applied.toProvince ||
					applied.dateFrom ||
					applied.dateTo,
				);

	function change<K extends keyof Filters>(key: K, value: Filters[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	function changePlace(key: 'origin' | 'destination', code: string) {
		setDraft((current) => {
			const province = current.province || provinceOf(code);
			const other = key === 'origin' ? current.destination : current.origin;
			const otherProvince = provinceOf(other);
			const clearOther = Boolean(
				province && other && otherProvince !== province,
			);
			return {
				...current,
				province,
				origin: key === 'origin' ? code : clearOther ? '' : current.origin,
				destination:
					key === 'destination'
						? code
						: clearOther
							? ''
							: current.destination,
			};
		});
	}

	function changeMode(next: 'interprovincial' | 'intermunicipal') {
		if (next === draft.mode) return;
		setDraft((current) => ({
			...current,
			mode: next,
			origin: '',
			destination: '',
			province: '',
			fromProvince: '',
			toProvince: '',
		}));
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
		<div className="mx-auto max-w-6xl px-6 py-14">
			<header className="max-w-2xl">
				<h1 className="text-h2 text-ink">Boleias a partir de agora</h1>
				<p className="mt-3 text-body text-muted">
					A pesquisa não pede conta. Para pedir um lugar é que a
					identidade é verificada — é o mesmo motorista a decidir com quem
					viaja.
				</p>
			</header>

			<div className="mt-10 rounded-lg border border-line bg-surface p-4">
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
							<div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
								<span className="text-label text-ink">
									Província
								</span>
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										onClick={() => changeProvince('')}
										aria-pressed={draft.province === ''}
										className={[
											'rounded-full border px-3 py-1.5 text-small transition-colors',
											draft.province === ''
												? 'border-ink bg-ink text-surface'
												: 'border-line text-muted hover:border-ink',
										].join(' ')}
									>
										Todas
									</button>
									{PROVINCES.map((province) => {
										const active =
											draft.province === province.code;
										return (
											<button
												key={province.code}
												type="button"
												onClick={() =>
													changeProvince(
														active ? '' : province.code,
													)
												}
												aria-pressed={active}
												className={[
													'rounded-full border px-3 py-1.5 text-small transition-colors',
													active
														? 'border-ink bg-ink text-surface'
														: 'border-line text-muted hover:border-ink',
												].join(' ')}
											>
												{province.name}
											</button>
										);
									})}
								</div>
							</div>

							<LocalityFilter
								label="De onde"
								value={draft.origin}
								onChange={(code) => changePlace('origin', code)}
								exclude={draft.destination}
								placeholder="Todas"
								restrictToProvince={draft.province || null}
							/>
							<LocalityFilter
								label="Para onde"
								value={draft.destination}
								onChange={(code) =>
									changePlace('destination', code)
								}
								exclude={draft.origin}
								placeholder="Todas"
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

					<DateRangeFilter
						valueFrom={draft.dateFrom}
						valueTo={draft.dateTo}
						onChange={(from, to) =>
							setDraft((current) => ({
								...current,
								dateFrom: from,
								dateTo: to,
							}))
						}
					/>
					<Select
						label="Ordenar por"
						value={sort}
						onChange={setSort}
						options={[
							{ value: 'soon', label: 'Mais próximas' },
							{ value: 'cheap', label: 'Mais baratas' },
						]}
					/>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<Button onClick={search}>
						<Search size={16} aria-hidden="true" />
						Pesquisar
					</Button>
					<Button variant="secondary" onClick={clearFilters}>
						Limpar filtros
					</Button>
				</div>
			</div>

			{result.isPending ? <SkeletonCards count={6} /> : null}

			{result.isError ? (
				<EmptyState
					icon={<Compass size={32} />}
					title="Não foi possível carregar as boleias"
					description="O servidor não respondeu. Pode ser a ligação, ou a boleia que foi para o fim da lista."
					action={
						<Button
							variant="secondary"
							onClick={() => result.refetch()}
						>
							Tentar de novo
						</Button>
					}
				/>
			) : null}

			{noResults ? (
				<EmptyState
					icon={<Compass size={32} />}
					title="Nenhuma boleia com estes filtros"
					description={
						filtered
							? 'Experimenta alargar o intervalo de datas ou limpar uma das províncias. Se a rota não estiver publicada, também não há nada a mostrar.'
							: 'Ainda não há boleias agendadas. Pode também ser que a rota que pretendes ainda não tenha sido publicada.'
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

			{rows.length > 0 ? (
				<div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{(sort === 'cheap' ? sortByPrice([...rows]) : rows).map(
						(ride) => (
							<PublicRideCard key={ride.id} ride={ride} />
						),
					)}
				</div>
			) : null}

			{result.hasNextPage ? (
				<div className="mt-10 flex flex-col items-center gap-2">
					<Button
						variant="secondary"
						onClick={() => result.fetchNextPage()}
						disabled={result.isFetchingNextPage}
					>
						{result.isFetchingNextPage
							? 'A carregar…'
							: `Carregar mais (${rows.length} de ${total})`}
					</Button>
				</div>
			) : null}
		</div>
	);
}

function sortByPrice(rows: PublicRide[]): PublicRide[] {
	return rows.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
}

/**
 * Cartão da pesquisa pública.
 *
 * É o mesmo cartão da landing, com a mesma leitura de cima para baixo. O
 * CTA leva ao detalhe público: a reserva começa quando a pessoa entra na
 * conta, senão seria um botão que pregunta o nome no meio do caminho.
 *
 * O número de lugares livres mostra-se a partir da diferença; quando os
 * lugares acabam, o CTA muda de cor e passa a dizer quanto fica sem lugar.
 */
function PublicRideCard({ ride }: { ride: PublicRide }) {
	const { origin, destination } = routeEndpoints(ride.routeName);
	const free = seatsLeft(ride.seatsTotal, ride.seatsTaken);

	return (
		<article className="flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand/40">
			<header className="flex items-baseline justify-between gap-3">
				<h3 className="text-h3 text-ink">{ride.routeName}</h3>
				<span className="shrink-0 font-mono text-data text-muted">
					{relativeDay(ride.departureAt)}
				</span>
			</header>

			<div className="mt-4 border-t border-line pt-4">
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

				<Link
					to={`/viagens/${ride.id}`}
					className={[
						'mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-label font-medium transition-colors',
						free === 0
							? 'bg-canvas text-muted'
							: 'bg-brand text-brand-ink hover:bg-brand/90',
					].join(' ')}
				>
					{free === 0 ? 'Sem lugares' : 'Reservar'}
					{free === 0 ? null : (
						<ArrowRight size={15} aria-hidden="true" />
					)}
				</Link>
			</footer>
		</article>
	);
}
