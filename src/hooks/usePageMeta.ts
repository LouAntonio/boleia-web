import { useEffect } from 'react';

/** As meta tags que cada página reescreve. */
const KEYS = [
	{ attr: 'name', key: 'description' },
	{ attr: 'property', key: 'og:title' },
	{ attr: 'property', key: 'og:description' },
	{ attr: 'property', key: 'og:url' },
] as const;

/**
 * O `<title>` e as meta tags de uma página.
 *
 * Numa SPA o browser não muda o `<title>` sozinho, e a descrição — que é o que
 * aparece quando alguém cola o link num chat ou o guarda nos favoritos —
 * também não. Sem isto, todas as páginas do site se anunciam como "Boleia" e
 * com a descrição da landing.
 *
 * Em `/` a descrição do `index.html` serve tal e qual; nas restantes páginas, a
 * descrição é a que a própria página escreve.
 */
export function usePageMeta(title: string, description?: string): void {
	const fullTitle = title === '/' ? 'Boleia' : `${title} · Boleia`;

	useEffect(() => {
		// O que estava lá antes de esta página mexer. Uma meta pode não existir
		// (é o caso das `og:*` no `index.html`), e "não existia" é informação
		// que o `cleanup` precisa de volta.
		const previousTitle = document.title;
		const previous = KEYS.map((meta) => ({
			...meta,
			content: document.querySelector<HTMLMetaElement>(
				`meta[${meta.attr}="${meta.key}"]`,
			)?.content,
		}));

		document.title = fullTitle;
		write('property', 'og:title', fullTitle);
		write('property', 'og:url', window.location.href);

		if (description) {
			write('name', 'description', description);
			write('property', 'og:description', description);
		}

		return () => {
			document.title = previousTitle;

			for (const { attr, key, content } of previous) {
				if (content !== undefined) {
					write(attr, key, content);
				} else {
					// A meta não existia antes desta página. Deixá-la seria
					// deixar lixo de uma página anterior na seguinte.
					document.querySelector(`meta[${attr}="${key}"]`)?.remove();
				}
			}
		};
	}, [fullTitle, description]);
}

function write(attr: 'name' | 'property', key: string, content: string): void {
	let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);

	if (!meta) {
		meta = document.createElement('meta');
		meta.setAttribute(attr, key);
		document.head.appendChild(meta);
	}

	meta.content = content;
}

/** Para as páginas que só têm título. */
export function usePageTitle(title: string): void {
	usePageMeta(title);
}
