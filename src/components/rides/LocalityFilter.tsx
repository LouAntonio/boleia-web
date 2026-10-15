import { useMemo, useState } from 'react';
import { ChevronDown, Loader2, MapPin, Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
	indexLocalities,
	indexProvinces,
	useAllLocalities,
	useProvinces,
} from '../../hooks/useLocalities';
import { toAscii } from '../../lib/format';

interface LocalityFilterProps {
	label: string;
	/** Id da localidade escolhida, ou `''`. É o que o backend espera. */
	value: string;
	onChange: (localityId: string) => void;
	/** Localidade a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	placeholder?: string;
	/**
	 * Só oferecer localidades desta província.
	 *
	 * É o que distingue uma pesquisa intermunicipal de uma interprovincial: as
	 * duas continuam a filtrar por localidade, e o modo só restringe o universo
	 * de escolha. Sem isto, o rótulo "intermunicipal" seria uma promessa que a
	 * pesquisa não cumpre — o filtro aceitaria uma origem em Benguela e outra
	 * no Huambo e devolveria a viagem, como se fossem vizinhas.
	 *
	 * Espelha o `restrictToProvinceId` do `LocalityPicker` no telemóvel.
	 *
	 * Aplicado à lista **e** ao rótulo do valor já escolhido: se o que está
	 * seleccionado cair fora da restrição, o filtro deixa de o oferecer mas o
	 * gatilho continuava a mostrar o nome antigo, e a pessoa não sabia porque
	 * é que a origem desapareceu do modal.
	 */
	restrictToProvinceId?: string | null;
	/**
	 * Não buscar as localidades até alguém abrir o picker.
	 *
	 * Cada uso desta lista dispara 22 pedidos — as 21 províncias e uma
	 * localidade por província. Numa página pública isso é um burst de 21
	 * respostas que a maioria das visitas nunca precisa, porque a maioria não
	 * chega a tocar no filtro.
	 *
	 * O default é `false` de propósito. Quem tem um valor já escolhido precisa
	 * da lista disponível para mostrar o rótulo: o `ExplorePage` hidrata a
	 * origem e o destino a partir da query string, e com `lazy` o gatilho
	 * mostraria "Todos" com um filtro aplicado. Aqui — a landing page — não há
	 * valor herdado nenhum, e esperar pela primeira interacção é o
	 * comportamento certo.
	 */
	lazy?: boolean;
}

/**
 * Escolha de local de origem ou destino.
 *
 * O valor devolvido é sempre o **id da localidade**, e é isso que o backend
 * quer: `GET /api/rides` filtra por `ride_stop.localityId` e valida o valor
 * como UUID (`rides.service.ts`, `cleanId`).
 *
 * Este filtro era um `<select>` com as 21 províncias e mandava o **nome** da
 * província. Duas coisas erradas ao mesmo tempo: o nome não é um UUID, e uma
 * província não é uma localidade — mesmo que o valor passasse, a comparação
 * não encontrava nada. Na prática, escolher uma origem ou destino devolvia
 * `400` e a página mostrava "o servidor não respondeu", que é a mensagem
 * errada para o que era um erro do cliente.
 *
 * Porquê um modal com pesquisa e não dois `<select>` encadeados: Angola tem
 * 306 localidades na seed, e um `select` nativo com 306 linhas sem pesquisa é
 * pior do que o filtro que veio substituir. O gatilho continua a ter o
 * aspecto de um campo, por isso a grelha de filtros não muda.
 *
 * Espelha o `LocalityPicker` do telemóvel.
 */
export function LocalityFilter({
	label,
	value,
	onChange,
	exclude,
	placeholder = 'Todos',
	lazy = false,
	restrictToProvinceId = null,
}: LocalityFilterProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	/*
	 * A província pode vir de fora (`restrictToProvinceId`, no modo
	 * intermunicipal) ou ser escolhida aqui dentro do modal. Quando vem de fora
	 * é a fonte de verdade: trocar de província lá fora tem de mandar o modal
	 * atrás, senão a pessoa vê um modal cheio de municípios da província
	 * anterior e escolhe um que já não serve.
	 */
	const [ownProvinceId, setOwnProvinceId] = useState('');
	const provinceId = restrictToProvinceId ?? ownProvinceId;
	// Sem `lazy`, `activated` é `true` desde o início e o gancho não muda
	// nada. Com `lazy`, só o primeiro `show()` o vira — e nesse momento o
	// modal abre já a mostrar o "A carregar localidades…" que está mais abaixo.
	const [activated, setActivated] = useState(!lazy);

	const provinces = useProvinces(activated);
	const { localities, isLoading } = useAllLocalities(activated);

	const byId = useMemo(() => indexLocalities(localities), [localities]);
	const provinceName = useMemo(
		() => indexProvinces(provinces.data ?? []),
		[provinces.data],
	);

	const selected = useMemo(() => {
		if (!value) return undefined;
		const found = byId.get(value);
		/*
		 * Se a escolha actual cai fora da província restringida, não a
		 * despensa. Mostrar o nome de uma origem que o modal já não oferece é
		 * pior do que mostrar o placeholder: a pessoa lê "Luanda" no gatilho e
		 * não percebe porque é que Luanda desapareceu da lista.
		 */
		if (
			found &&
			restrictToProvinceId &&
			found.provinceId !== restrictToProvinceId
		) {
			return undefined;
		}
		return found;
	}, [value, byId, restrictToProvinceId]);
	const selectedLabel = selected
		? `${selected.municipality} · ${provinceName.get(selected.provinceId) ?? ''}`
		: '';

	// Só se oferecem províncias que tenham localidades: uma província vazia na
	// lista é um beco sem saída.
	const provincesWithLocalities = useMemo(() => {
		const present = new Set(localities.map((item) => item.provinceId));
		return (provinces.data ?? []).filter((province) =>
			present.has(province.id),
		);
	}, [provinces.data, localities]);

	const options = useMemo(() => {
		const q = toAscii(query.trim());
		return localities
			.filter((item) => item.id !== exclude)
			.filter((item) => !provinceId || item.provinceId === provinceId)
			.filter((item) => {
				if (!q) return true;
				return (
					toAscii(item.municipality).includes(q) ||
					toAscii(item.name).includes(q) ||
					toAscii(provinceName.get(item.provinceId) ?? '').includes(q)
				);
			})
			.slice(0, 200);
	}, [localities, exclude, provinceId, query, provinceName]);

	function show() {
		setQuery('');
		setOwnProvinceId('');
		// Abrir é a interacção que justifica pagar as 21 peticiones. O modal
		// mostra-se logo com o estado de carregamento que já existe; da segunda
		// vez vem do cache.
		setActivated(true);
		setOpen(true);
	}

	function pick(localityId: string) {
		onChange(localityId);
		setOpen(false);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-label text-ink">{label}</span>

			<button
				type="button"
				onClick={show}
				aria-label={
					selectedLabel
						? `${label}: ${selectedLabel}`
						: `${label}: ${placeholder}`
				}
				className={[
					'flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left transition-colors',
					selected ? 'border-brand text-ink' : 'border-line text-muted',
				].join(' ')}
			>
				<span className="truncate text-body">
					{selectedLabel || placeholder}
				</span>
				<ChevronDown
					size={16}
					aria-hidden="true"
					className="shrink-0 text-muted"
				/>
			</button>

			{open ? (
				<Modal
					title={label}
					description="Procura pelo município, pelo nome da localidade ou pela província."
					onClose={() => setOpen(false)}
				>
					<div className="flex flex-col gap-4">
						<div className="relative">
							<Search
								size={16}
								aria-hidden="true"
								className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
							/>
							<input
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Ex.: Talatona, Benguela, Huambo"
								autoFocus
								className="h-11 w-full rounded-md border border-line bg-surface pr-3 pl-9 text-body text-ink focus:border-brand"
							/>
						</div>

						{/*
						 * A escolha de província desaparece quando a restrição vem
						 * de fora. Não é cosmético: oferecer aqui as 21
						 * províncias deixaria a pessoa escolher uma que o filtro
						 * de cima já impõe, e ela não encontraria nada dentro
						 * dessa escolha.
						 */}
						{!restrictToProvinceId ? (
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => setOwnProvinceId('')}
									aria-pressed={provinceId === ''}
									className={[
										'rounded-full border px-3 py-1.5 text-small transition-colors',
										provinceId === ''
											? 'border-ink bg-ink text-surface'
											: 'border-line text-muted hover:border-ink',
									].join(' ')}
								>
									Todas
								</button>
								{provincesWithLocalities.map((province) => {
									const active = provinceId === province.id;
									return (
										<button
											key={province.id}
											type="button"
											onClick={() =>
												setOwnProvinceId(
													active ? '' : province.id,
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
						) : null}

						{isLoading ? (
							<p className="flex items-center justify-center gap-2 py-8 text-body text-muted">
								<Loader2
									size={16}
									aria-hidden="true"
									className="animate-spin"
								/>
								A carregar localidades…
							</p>
						) : options.length === 0 ? (
							<p className="py-8 text-center text-body text-muted">
								Nenhum município a bater certo.
							</p>
						) : (
							<ul className="-mx-2 max-h-80 overflow-y-auto">
								{options.map((item) => {
									const active = value === item.id;
									return (
										<li key={item.id}>
											<button
												type="button"
												onClick={() => pick(item.id)}
												aria-current={
													active ? 'true' : undefined
												}
												className={[
													'flex w-full items-center gap-3 border-b border-line px-2 py-3 text-left transition-colors',
													active
														? 'bg-canvas'
														: 'hover:bg-canvas',
												].join(' ')}
											>
												<MapPin
													size={16}
													aria-hidden="true"
													className="shrink-0 text-muted"
												/>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-body text-ink">
														{item.municipality}
													</span>
													<span className="block truncate text-small text-muted">
														{item.name} ·{' '}
														{provinceName.get(
															item.provinceId,
														) ?? ''}
													</span>
												</span>
												{active ? (
													<span className="shrink-0 text-small text-brand-text">
														Escolhido
													</span>
												) : null}
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</Modal>
			) : null}
		</div>
	);
}
