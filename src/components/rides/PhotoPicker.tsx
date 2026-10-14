import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../lib/api';
import { apiErrorMessage } from '../../lib/axios';

type OwnerType = 'VEHICLE' | 'DRIVER_KYC' | 'PASSENGER_KYC' | 'USER';

interface PhotoPickerProps {
	ownerType: OwnerType;
	/** Mínimo que o backend exige em `photoIds`. */
	min?: number;
	/** Máximo aceite. */
	max?: number;
	/** `Media.id` de cada foto já carregada. */
	photoIds: string[];
	onChange: (photoIds: string[]) => void;
	label: string;
	hint?: string;
}

/**
 * Grelha de espaços para fotografar.
 *
 * Existe porque `POST /api/vehicles` exige **mínimo 3** `photoIds`
 * (`vehicles.service.ts`, `cleanPhotoIds`). Uma versão anterior do registo de
 * viatura no site mandava `photoIds: []` com um comentário a dizer que as
 * fotos eram opcionais: o pedido devolvia sempre 400, sem viatura não havia
 * viatura verificada, e sem viatura verificada não se publicava boleia
 * nenhuma pelo site. A regra do servidor é a mesma para os dois clientes, e
 * o mobile já a cumpria — aqui estava apenas em falta.
 *
 * As miniaturas são `URL.createObjectURL` do ficheiro local, revogadas ao
 * remover, para a memória do browser não ficar com cada fotografia que passou
 * pelo modal.
 */
export function PhotoPicker({
	ownerType,
	min = 3,
	max = 6,
	photoIds,
	onChange,
	label,
	hint,
}: PhotoPickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const [previews, setPreviews] = useState<string[]>([]);

	const remaining = max - photoIds.length;

	async function handleFiles(files: File[]) {
		if (files.length === 0) return;
		setBusy(true);
		try {
			const accepted: string[] = [];
			const urls: string[] = [];
			for (const file of files.slice(0, remaining)) {
				const asset = await api.uploadImage(file, ownerType);
				accepted.push(asset.mediaId);
				urls.push(URL.createObjectURL(file));
			}
			onChange([...photoIds, ...accepted]);
			setPreviews((current) => [...current, ...urls]);
		} catch (error) {
			toast.error(
				apiErrorMessage(error, 'Não foi possível carregar a imagem.'),
			);
		} finally {
			setBusy(false);
		}
	}

	function removeAt(index: number) {
		const url = previews[index];
		if (url) URL.revokeObjectURL(url);
		setPreviews(previews.filter((_, i) => i !== index));
		onChange(photoIds.filter((_, i) => i !== index));
	}

	const missing = min - photoIds.length;

	return (
		<fieldset>
			<legend className="text-label text-ink">{label}</legend>
			{hint ? <p className="mt-1 text-small text-muted">{hint}</p> : null}

			<div className="mt-3 grid grid-cols-3 gap-3">
				{photoIds.map((mediaId, index) => (
					<div
						key={mediaId}
						className="relative aspect-square overflow-hidden rounded-lg border border-line bg-canvas"
					>
						{previews[index] ? (
							<img
								src={previews[index]}
								alt={`Fotografia ${index + 1}`}
								className="h-full w-full object-cover"
							/>
						) : null}
						<button
							type="button"
							onClick={() => removeAt(index)}
							aria-label={`Remover fotografia ${index + 1}`}
							className="absolute right-1 top-1 rounded-full bg-ink/70 p-1.5 text-white transition-colors hover:bg-ink"
						>
							<X size={14} aria-hidden="true" />
						</button>
					</div>
				))}

				{remaining > 0 ? (
					<>
						<input
							ref={inputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp"
							multiple={remaining > 1}
							className="sr-only"
							disabled={busy}
							onChange={(event) => {
								const files = Array.from(event.target.files ?? []);
								// Limpar o valor permite escolher o mesmo ficheiro
								// outra vez depois de o trocar.
								event.target.value = '';
								void handleFiles(files);
							}}
						/>
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							disabled={busy}
							className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-small text-muted transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50"
						>
							{busy ? (
								<Loader2 size={18} aria-hidden="true" />
							) : (
								<ImagePlus size={18} aria-hidden="true" />
							)}
							{busy ? 'A carregar…' : 'Adicionar'}
						</button>
					</>
				) : null}
			</div>

			{missing > 0 ? (
				<p className="mt-2 text-small text-muted">
					Faltam {missing} {missing === 1 ? 'foto' : 'fotos'}. O registo
					só é aceite com pelo menos {min}.
				</p>
			) : null}
		</fieldset>
	);
}
