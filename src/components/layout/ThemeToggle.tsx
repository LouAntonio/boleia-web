import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore, applyTheme } from '../../stores/useThemeStore';

const OPTIONS = [
	{ value: 'light', label: 'Claro', Icon: Sun },
	{ value: 'dark', label: 'Escuro', Icon: Moon },
	{ value: 'system', label: 'Do sistema', Icon: Monitor },
] as const;

/**
 * Claro / escuro / do sistema.
 *
 * Três botões e não um interruptor de dois: quem escolheu "do sistema" e depois
 * muda de tema no sistema não tem forma de voltar atrás, porque o valor
 * "claro" e o valor "sistema" dariam o mesmo resultado no ecrã e não se
 * distinguem.
 */
export function ThemeToggle() {
	const theme = useThemeStore((s) => s.theme);
	const setTheme = useThemeStore((s) => s.setTheme);

	return (
		<div
			role="radiogroup"
			aria-label="Tema"
			className="flex items-center gap-0.5 rounded-full border border-line bg-canvas p-0.5"
		>
			{OPTIONS.map(({ value, label, Icon }) => {
				const active = theme === value;
				return (
					<button
						key={value}
						type="button"
						role="radio"
						aria-checked={active}
						aria-label={label}
						title={label}
						onClick={() => {
							setTheme(value);
							applyTheme(value);
						}}
						className={[
							'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
							active
								? 'bg-surface text-ink'
								: 'text-muted hover:text-ink',
						].join(' ')}
					>
						<Icon size={15} aria-hidden="true" />
					</button>
				);
			})}
		</div>
	);
}
