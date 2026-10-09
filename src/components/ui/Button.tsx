import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
	full?: boolean;
	children: ReactNode;
}

/*
 * As cores vivem no CSS, em variantes, e não em `style={{ background: token }}`
 * como no telemóvel. Num ecrã largo há muitas vezes o mesmo botão em fundo claro
 * e escuro ao mesmo tempo; uma classe que aponta para `var(--...)` acompanha o
 * tema sem ninguém se lembrar de o actualizar.
 *
 * O essencial é que `primary` usa `--brand-ink` e nunca a cor do texto. O
 * `--brand` sozinho não chega a 4.5:1 com `--ink` por cima (dá 3.9:1) — é a
 * mesma regra que o telemóvel documenta e que `mobile/scripts/contrast.js`
 * verifica.
 */
const VARIANTS: Record<Variant, string> = {
	primary: 'bg-brand text-brand-ink hover:bg-brand/90 active:bg-brand',
	secondary:
		'bg-surface text-ink border border-line hover:bg-canvas active:bg-canvas',
	ghost: 'bg-transparent text-ink hover:bg-canvas active:bg-canvas',
	danger: 'bg-alert text-white hover:bg-alert/90 active:bg-alert',
};

const SIZES: Record<Size, string> = {
	sm: 'h-9 px-3 text-small gap-1.5',
	md: 'h-11 px-4 text-label gap-2',
	lg: 'h-13 px-6 text-label gap-2.5',
};

export function Button({
	variant = 'primary',
	size = 'md',
	full = false,
	className = '',
	type = 'button',
	...rest
}: ButtonProps) {
	return (
		<button
			type={type}
			className={[
				'inline-flex items-center justify-center rounded-md font-medium',
				// `transition` só na cor: animar a sombra e o `scale` num botão faz
				// o clique parecer lento mesmo quando é instantâneo.
				'transition-colors duration-150',
				'disabled:pointer-events-none disabled:opacity-45',
				SIZES[size],
				VARIANTS[variant],
				full ? 'w-full' : '',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			{...rest}
		/>
	);
}
