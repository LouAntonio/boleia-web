import type { ReactNode } from 'react';

interface SelectProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
	error?: string | null;
	hint?: ReactNode;
	className?: string;
	disabled?: boolean;
}

/**
 * Um `select` nativo com o mesmo esqueleto do `Field`.
 *
 * Nativo de propósito. Um `listbox` à mão precisa de teclado, de leitor de
 * ecrã, de portal, de tratamento do botão direito — para uma lista de
 * províncias que o browser já sabe fazer melhor e em todas as plataformas.
 */
export function Select({
	label,
	value,
	onChange,
	options,
	placeholder,
	error,
	hint,
	className = '',
	disabled = false,
}: SelectProps) {
	const hasError = Boolean(error);

	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			<label className="text-label text-ink">{label}</label>

			<div className="relative">
				<select
					value={value}
					disabled={disabled}
					aria-invalid={hasError || undefined}
					onChange={(event) => onChange(event.target.value)}
					className={[
						'h-11 w-full appearance-none rounded-md border bg-surface',
						'pr-9 pl-3 text-body text-ink transition-colors',
						'disabled:opacity-45',
						hasError
							? 'border-alert'
							: 'border-line focus:border-brand',
					].join(' ')}
				>
					{placeholder ? (
						<option value="" disabled>
							{placeholder}
						</option>
					) : null}
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				{/*
					Seta do browser não dá para estilizar, e a do browser num tema
					escuro é preta sobre preta. Esta substitui-a sem tirar o `select`
					nativo de baixo — continua a ser um select, com o teclado todo.
				*/}
				<svg
					aria-hidden="true"
					viewBox="0 0 20 20"
					className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
				>
					<path
						d="M6 8l4 4 4-4"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>

			{hint ? <p className="text-small text-muted">{hint}</p> : null}
			{error ? (
				<p role="alert" className="text-small text-alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
