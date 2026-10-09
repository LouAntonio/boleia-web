import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	/** Erro do campo. `null` quando não há — nunca uma string vazia. */
	error?: string | null;
	hint?: ReactNode;
	/** Botão ou afordância à direita (mostrar senha, limpar, unidade). */
	trailing?: ReactNode;
}

/**
 * Um campo com rótulo, dica e erro — sempre os três, ligados por `htmlFor`.
 *
 * O `aria-describedby` aponta para o erro só quando ele existe: apontar para um
 * elemento vazio faz o leitor de ecrã anunciar um campo "inválido" sem dizer por
 *quê, que é pior do que não anunciar nada.
 */
export function Field({
	label,
	error,
	hint,
	trailing,
	className = '',
	id,
	...rest
}: FieldProps) {
	const generatedId = useId();
	const fieldId = id ?? generatedId;
	const errorId = `${fieldId}-erro`;
	const hintId = `${fieldId}-dica`;

	const describedBy =
		[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
		undefined;

	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			<label htmlFor={fieldId} className="text-label text-ink">
				{label}
			</label>

			<div className="relative">
				<input
					id={fieldId}
					aria-invalid={error ? true : undefined}
					aria-describedby={describedBy}
					className={[
						'h-11 w-full rounded-md border bg-surface px-3 text-body text-ink',
						'placeholder:text-muted',
						'transition-colors',
						// Com afordância à direita o texto tem de parar antes dela,
						// senão a primeira letra do valor fica por baixo do ícone.
						trailing ? 'pr-11' : '',
						error ? 'border-alert' : 'border-line focus:border-brand',
					].join(' ')}
					{...rest}
				/>

				{trailing ? (
					<div className="absolute inset-y-0 right-0 flex items-center pr-3">
						{trailing}
					</div>
				) : null}
			</div>

			{hint ? (
				<p id={hintId} className="text-small text-muted">
					{hint}
				</p>
			) : null}

			{error ? (
				<p id={errorId} role="alert" className="text-small text-alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
