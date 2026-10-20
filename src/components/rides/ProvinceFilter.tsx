import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { PROVINCES } from '../../lib/locations';

/**
 * Escolha de uma província.
 *
 * É o filtro do modo **interprovincial**, onde origem e destino são províncias
 * e não municípios. O valor devolvido é o **código** da província
 * (`cuanza-norte`), que é o identificador que o `GET /api/rides` aceita em
 * `originProvinceId`/`destinationProvinceId` — o UUID continua aceito, mas os
 * clientes já não o conhecem.
 *
 * A lista é local (`lib/locations.ts`), gerada da seed do backend: são 21
 * províncias que não mudam e não justificam um pedido. Antes, abrir este
 * filtro ia buscar as províncias à API.
 *
 * **Em chips que quebram para a linha seguinte**, e não numa lista vertical:
 * 21 nomes curtos leem-se melhor lado a lado, e a lista deixa de parecer um
 * menu de navegação. É o mesmo desenho das províncias dentro do
 * `LocalityFilter` e do `LocalityPicker` do telemóvel.
 */
export function ProvinceFilter({
	label,
	value,
	onChange,
	exclude,
	placeholder = 'Todas',
}: {
	label: string;
	/** Código da província escolhida, ou `''`. */
	value: string;
	onChange: (provinceCode: string) => void;
	/** Província a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);

	const selectedName = PROVINCES.find(
		(province) => province.code === value,
	)?.name;
	const options = PROVINCES.filter((province) => province.code !== exclude);

	function pick(provinceCode: string) {
		onChange(provinceCode);
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
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => pick('')}
							aria-pressed={value === ''}
							className={[
								'rounded-full border px-3 py-1.5 text-small transition-colors',
								value === ''
									? 'border-ink bg-ink text-surface'
									: 'border-line text-muted hover:border-ink',
							].join(' ')}
						>
							{placeholder}
						</button>
						{options.map((province) => {
							const active = value === province.code;
							return (
								<button
									key={province.code}
									type="button"
									onClick={() => pick(province.code)}
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
				</Modal>
			) : null}
		</div>
	);
}
