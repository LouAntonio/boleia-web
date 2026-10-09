import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { App } from './App';
import { queryClient } from './lib/queryClient';
import { useThemeStore, applyTheme } from './stores/useThemeStore';

/*
 * O tema é aplicado antes de o React montar, não num `useEffect` depois.
 *
 * Quem escolheu escuro veria um rectângulo branco — do tamanho da página toda —
 * até ao primeiro render. Numa ligação rápida quase passa despercebido; num
 * telemóvel é um clarão que dura o suficiente para ser notado. Aplicar aqui
 * custa uma linha e elimina-o.
 */
applyTheme(useThemeStore.getState().theme);

createRoot(document.getElementById('root') as HTMLElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<App />
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: 'var(--surface)',
							color: 'var(--ink)',
							border: '1px solid var(--line)',
							fontFamily: 'var(--font-body)',
						},
					}}
				/>
			</BrowserRouter>
		</QueryClientProvider>
	</StrictMode>,
);
