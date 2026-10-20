import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useObjectUrl } from '../../hooks/useObjectUrl';

interface PhotoPickerProps {
	/** Mínimo que o backend exige em `photoIds`. */
	min?: number;
	/** Máximo aceite. */
	max?: number;
	/** Ficheiros escolhidos e **ainda não enviados**. */
	files: File[];
	onChange: (files: File[]) => void;
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
 * Os ficheiros ficam **locais** até ao submit: este componente não fala com a
 * API. Quem envia é o `AddVehicleDialog`, depois de validar o resto do
 * formulário — uma viatura que nunca chega a ser registada não deixa fotos
 * penduradas no Cloudinary.
 *
 * As miniaturas são `URL.createObjectURL` do ficheiro local (`useObjectUrl`),
 * revogadas na troca ou no unmount, para a memória do browser não ficar com
 * cada fotografia que passou pelo modal.
 */
export function PhotoPicker({
	min = 3,
	max = 6,
	files,
	onChange,
	label,
	hint,
}: PhotoPickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const remaining = max - files.length;

	function handleFiles(picked: File[]) {
		if (picked.length === 0 || remaining <= 0) return;
		onChange([...files, ...picked.slice(0, remaining)]);
	}

	function removeAt(index: number) {
		onChange(files.filter((_, position) => position !== index));
	}

	const missing = min - files.length;

	return (
		<fieldset>
			<legend className="text-label text-ink">{label}</legend>
			{hint ? <p className="mt-1 text-small text-muted">{hint}</p> : null}

			<div className="mt-3 grid grid-cols-3 gap-3">
				{files.map((file, index) => (
					<PhotoTile
						key={`${file.name}-${file.lastModified}-${index}`}
						file={file}
						index={index}
						onRemove={() => removeAt(index)}
					/>
				))}

				{remaining > 0 ? (
					<>
						<input
							ref={inputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp"
							multiple={remaining > 1}
							className="sr-only"
							onChange={(event) => {
								const picked = Array.from(event.target.files ?? []);
								// Limpar o valor permite escolher o mesmo ficheiro
								// outra vez depois de o trocar.
								event.target.value = '';
								handleFiles(picked);
							}}
						/>
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-small text-muted transition-colors hover:border-brand hover:text-brand-text"
						>
							<ImagePlus size={18} aria-hidden="true" />
							Adicionar
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

function PhotoTile({
	file,
	index,
	onRemove,
}: {
	file: File;
	index: number;
	onRemove: () => void;
}) {
	const preview = useObjectUrl(file);

	return (
		<div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-canvas">
			{preview ? (
				<img
					src={preview}
					alt={`Fotografia ${index + 1}`}
					className="h-full w-full object-cover"
				/>
			) : null}
			<button
				type="button"
				onClick={onRemove}
				aria-label={`Remover fotografia ${index + 1}`}
				className="absolute right-1 top-1 rounded-full bg-ink/70 p-1.5 text-white transition-colors hover:bg-ink"
			>
				<X size={14} aria-hidden="true" />
			</button>
		</div>
	);
}
