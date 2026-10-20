import { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { PROVINCES } from '../../lib/locations';
import { toAscii } from '../../lib/format';

interface LocalityFilterProps {
	label: string;
	/**
	 * Código do município escolhido, ou `''`.
	 *
	 * É o código (`huambo.catabola`) que vai para `GET /api/rides` em
	 * `origin`/`destination`. O UUID continua aceito pelo backend, mas os
	 * clientes já não o conhecem.
	 */
	value: string;
	onChange: (municipalityCode: string) => void;
	/** Município a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	placeholder?: string;
	/**
	 * Só oferecer municípios desta província (código).
	 *
	 * É o que distingue uma pesquisa intermunicipal de uma interprovincial: as
	 * duas continuam a filtrar por município, e o modo só restringe o universo
	 * de escolha. Sem isto, o rótulo "intermunicipal" seria uma promessa que a
	 * pesquisa não cumpre — o filtro aceitaria uma origem em Benguela e outra
	 * no Huambo e devolveria a viagem, como se fossem vizinhas.
	 *
	 * Espelha o `restrictToProvince` do `LocalityPicker` no telemóvel.
	 *
	 * Aplicado à lista **e** ao rótulo do valor já escolhido: se o que está
	 * seleccionado cair fora da restrição, o filtro deixa de o oferecer mas o
	 * gatilho continuava a mostrar o nome antigo, e a pessoa não sabia porque
	 * é que a origem desapareceu do modal.
	 */
	restrictToProvince?: string | null;
}

type MunicipalityEntry = (typeof PROVINCES)[number]['municipalities'][number];
type ProvinceEntry = (typeof PROVINCES)[number];

/**
 * O município escolhido e a província a que pertence, para o rótulo do gatilho.
 *
 * Vive fora do componente porque é uma procura pura sobre uma constante: o
 * React Compiler não deixa preservar um `useMemo` cujo resultado pode não
 * existir, e memoizar isto à mão não valia o atrito.
 */
function findSelected(
	code: string,
	restrictToProvince: string | null,
): (MunicipalityEntry & { province: ProvinceEntry }) | undefined {
	if (!code) return undefined;
	for (const province of PROVINCES) {
		const found = province.municipalities.find(
			(municipality) => municipality.code === code,
		);
		if (!found) continue;
		if (restrictToProvince && province.code !== restrictToProvince) {
			return undefined;
		}
		return { ...found, province };
	}
	return undefined;
}

/**
 * Escolha de local de origem ou destino.
 *
 * A lista é local (`lib/locations.ts`), gerada da seed do backend. Este filtro
 * chegou a disparar 22 pedidos à API para montar as 306 localidades — as 21
 * províncias e uma chamada por província. Nenhum desses dados muda, e nenhum
 * deles precisa de servidor.
 *
 * O valor devolvido é o **código do município**, e não o nome: há três nomes
 * repetidos entre províncias (Canacassala, Catabola e Quizenga), e o código
 * leva a província à frente (`huambo.catabola`) precisamente para os
 * distinguir.
 *
 * Porquê um modal com pesquisa e não dois `<select>` encadeados: são 306
 * municípios, e um `select` nativo com 306 linhas sem pesquisa é pior do que
 * o filtro que veio substituir. O gatilho continua a ter o aspecto de um
 * campo, por isso a grelha de filtros não muda.
 *
 * Espelha o `LocalityPicker` do telemóvel.
 */
export function LocalityFilter({
	label,
	value,
	onChange,
	exclude,
	placeholder = 'Todos',
	restrictToProvince = null,
}: LocalityFilterProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	/*
	 * A província pode vir de fora (`restrictToProvince`, no modo
	 * intermunicipal) ou ser escolhida aqui dentro do modal. Quando vem de fora
	 * é a fonte de verdade: trocar de província lá fora tem de mandar o modal
	 * atrás, senão a pessoa vê um modal cheio de municípios da província
	 * anterior e escolhe um que já não serve.
	 */
	const [ownProvince, setOwnProvince] = useState('');
	const province = restrictToProvince ?? ownProvince;

	/**
	 * O município escolhido, com a província a que pertence.
	 *
	 * Se a escolha actual cai fora da província restringida, não a despensa.
	 * Mostrar o nome de uma origem que o modal já não oferece é pior do que
	 * mostrar o placeholder: a pessoa lê "Luanda" no gatilho e não percebe
	 * porque é que Luanda desapareceu da lista.
	 */
	const selected = findSelected(value, restrictToProvince);
	const selectedLabel = selected
		? `${selected.name} · ${selected.province.name}`
		: '';

	const options = useMemo(() => {
		const q = toAscii(query.trim());
		return PROVINCES.filter(
			(candidate) => !province || candidate.code === province,
		)
			.flatMap((candidate) =>
				candidate.municipalities.map((municipality) => ({
					...municipality,
					province: candidate,
				})),
			)
			.filter((municipality) => municipality.code !== exclude)
			.filter((municipality) => {
				if (!q) return true;
				return (
					toAscii(municipality.name).includes(q) ||
					toAscii(municipality.province.name).includes(q)
				);
			})
			.slice(0, 200);
	}, [exclude, province, query]);

	function show() {
		setQuery('');
		setOwnProvince('');
		setOpen(true);
	}

	function pick(municipalityCode: string) {
		onChange(municipalityCode);
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
					description="Procura pelo município ou pela província."
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
						{!restrictToProvince ? (
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => setOwnProvince('')}
									aria-pressed={province === ''}
									className={[
										'rounded-full border px-3 py-1.5 text-small transition-colors',
										province === ''
											? 'border-ink bg-ink text-surface'
											: 'border-line text-muted hover:border-ink',
									].join(' ')}
								>
									Todas
								</button>
								{PROVINCES.map((candidate) => {
									const active = province === candidate.code;
									return (
										<button
											key={candidate.code}
											type="button"
											onClick={() =>
												setOwnProvince(
													active ? '' : candidate.code,
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
											{candidate.name}
										</button>
									);
								})}
							</div>
						) : null}

						{options.length === 0 ? (
							<p className="py-8 text-center text-body text-muted">
								Nenhum município a bater certo.
							</p>
						) : (
							<ul className="-mx-2 max-h-80 overflow-y-auto">
								{options.map((municipality) => {
									const active = value === municipality.code;
									return (
										<li key={municipality.code}>
											<button
												type="button"
												onClick={() =>
													pick(municipality.code)
												}
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
														{municipality.name}
													</span>
													<span className="block truncate text-small text-muted">
														{municipality.province.name}
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
