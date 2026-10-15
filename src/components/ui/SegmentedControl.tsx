export interface SegmentedOption<T extends string> {
	value: T;
	label: string;
}

/**
 * Escolha entre duas a quatro opções, em cápsula.
 *
 * Espelha o `SegmentedControl` do telemóvel, com o mesmo truque: a opção
 * activa **inverte a superfície** em vez de levar um fundo de cor. É o que
 * faz o mesmo componente servir nos dois temas sem nenhum token novo, e sem a
 * variante "borda grossa azul" que aparece quando alguém escreve isto de
 * fora.
 *
 * `role="radiogroup"` e não `role="tablist"`: isto não muda de painel, escolhe
 * um valor. Um leitor de ecrã anunciaria "separador" para o que é uma pergunta,
 * e o `aria-selected` a responder com "p Separador" em vez do rótulo.
 */
export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	label,
	className = '',
}: {
	options: readonly SegmentedOption<T>[];
	value: T;
	onChange: (next: T) => void;
	label: string;
	className?: string;
}) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={`flex gap-1 rounded-full border border-line bg-canvas p-1 ${className}`}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => onChange(option.value)}
						className={[
							'min-h-11 flex-1 rounded-full px-3 text-body font-medium transition-colors',
							'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
							active
								? 'bg-ink text-surface'
								: 'text-muted hover:text-ink',
						].join(' ')}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
