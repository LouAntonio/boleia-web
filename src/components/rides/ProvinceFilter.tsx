import { useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useProvinces } from '../../hooks/useLocalities';

/**
 * Escolha de uma província.
 *
 * É o filtro do modo **interprovincial**, onde origem e destino são províncias
 * e não municípios. Só existe porque o `GET /api/rides` passou a aceitar
 * `originProvinceId` / `destinationProvinceId`: sem eles, escolher uma província
 * seria um selector que não filtrava nada e o rótulo "interprovincial" ficaria
 * a prometer o que o servidor não faz.
 *
 * **Não tem caixa de pesquisa, ao contrário do `LocalityFilter`.** São 21
 * províncias contra 306 localidades: a lista cabe, e a pesquisa seria um campo
 * a mais para escrever. Espelha o `ProvincePicker` do telemóvel.
 */
export function ProvinceFilter({
	label,
	value,
	onChange,
	exclude,
	placeholder = 'Escolhe a província',
}: {
	label: string;
	/** Id da província escolhida, ou `''`. */
	value: string;
	onChange: (provinceId: string) => void;
	/** Província a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const provinces = useProvinces();

	const nameOf = new Map(
		(provinces.data ?? []).map((province) => [province.id, province.name]),
	);
	const selectedName = value ? (nameOf.get(value) ?? '') : '';
	const options = (provinces.data ?? []).filter(
		(province) => province.id !== exclude,
	);

	function pick(provinceId: string) {
		onChange(provinceId);
		setOpen(false);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-label text-ink">{label}</span>

			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label={
					selectedName
						? `${label}: ${selectedName}`
						: `${label}: ${placeholder}`
				}
				className={[
					'flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left transition-colors',
					selectedName
						? 'border-brand text-ink'
						: 'border-line text-muted',
				].join(' ')}
			>
				<span className="flex min-w-0 items-center gap-2">
					<MapPin
						size={16}
						aria-hidden="true"
						className="shrink-0 text-muted"
					/>
					<span className="truncate text-body">
						{selectedName || placeholder}
					</span>
				</span>
			</button>

			{open ? (
				<Modal
					title={label}
					description="As 21 províncias de Angola."
					onClose={() => setOpen(false)}
				>
					{provinces.isPending ? (
						<p className="py-8 text-center text-body text-muted">
							A carregar províncias…
						</p>
					) : (
						<ul className="-mx-2 max-h-96 divide-y divide-line overflow-y-auto">
							<li>
								<button
									type="button"
									onClick={() => pick('')}
									className="flex w-full items-center gap-3 px-3 py-3 text-left text-body text-muted transition-colors hover:bg-canvas"
								>
									Todas as províncias
								</button>
							</li>
							{options.map((province) => {
								const active = value === province.id;
								return (
									<li key={province.id}>
										<button
											type="button"
											onClick={() => pick(province.id)}
											aria-current={
												active ? 'true' : undefined
											}
											className={[
												'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
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
											<span className="min-w-0 flex-1 text-body text-ink">
												{province.name}
											</span>
											{active ? (
												<Check
													size={16}
													aria-hidden="true"
													className="shrink-0 text-brand-text"
												/>
											) : null}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</Modal>
			) : null}
		</div>
	);
}
