import { useEffect } from 'react';

/**
 * O título da página.
 *
 * Numa SPA o `<title>` não muda sozinho: escrever "Explorar" na navegação
 * deixaria o separador do browser, a história do teclado e o leitor de ecrã a
 * dizer "Boleia" em toda a parte. É uma linha por página e vale o esforço.
 */
export function usePageTitle(title: string): void {
	useEffect(() => {
		const previous = document.title;
		document.title = title === '/' ? 'Boleia' : `${title} · Boleia`;
		return () => {
			document.title = previous;
		};
	}, [title]);
}
