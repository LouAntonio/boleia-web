import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

/**
 * Tema em `localStorage`, e não em `prefers-color-scheme` sozinho.
 *
 * A escolha tem de sobreviver a um sistema operativo claro com o site fechado:
 * quem escolheu escuro porque está num quarto com pouca luz não quer um
 * clarão branco às oito da manhã. `system` continua disponível para quem
 * prefere seguir o sistema.
 */
export const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			theme: 'system',
			setTheme: (theme) => set({ theme }),
		}),
		{ name: 'boleia-web-theme' },
	),
);

/**
 * Aplica o tema ao `<html>`: a classe `.dark` e a cor da barra de endereços.
 *
 * Vive aqui e não num `useEffect` dentro de um componente porque tem de correr
 * antes do primeiro pixel — no `main.tsx`, à partida. Um tema aplicado depois do
 * primeiro render é um clarão branco para quem escolheu escuro.
 *
 * Uma classe chega: todas as cores são variáveis CSS em `:root` e `.dark`
 * (`src/index.css`), por isso trocar a classe troca a paleta inteira. Escrever
 * cada cor em `style` aqui seria ter a paleta em dois sítios a divergir.
 */
export function applyTheme(theme: Theme): void {
	const prefersDark =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-color-scheme: dark)').matches;

	const dark = theme === 'dark' || (theme === 'system' && prefersDark);

	const root = document.documentElement;
	root.classList.toggle('dark', dark);

	const meta = document.querySelector<HTMLMetaElement>(
		'meta[name="theme-color"]',
	);
	if (meta) {
		// Os mesmos valores de `--canvas` em `src/index.css`. Um número solto
		// aqui acabaria a divergir do token.
		meta.content = dark ? '#171B20' : '#F5F7FB';
	}
}
