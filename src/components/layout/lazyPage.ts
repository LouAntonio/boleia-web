import { lazy, type ComponentType } from 'react';

/**
 * Carrega uma página só quando alguém a pede.
 *
 * Com as sete páginas institucionais no mesmo ficheiro, o bundle inicial subiu
 * 18 KB gzip e o Vite passou a avisar que um bloco tinha mais de 500 KB. Numa SPA
 * isso é o tempo de espera de toda a gente que só queria ler a landing e acabou
 * de descarregar também o editor de KYC e o painel do motorista.
 *
 * Um `lazy` por **rota** — e não por componente — dá a cada pessoa exactamente o
 * que pediu e nada mais.
 *
 * As páginas exportam por nome, e o `lazy` do React quer o `default`: daí o
 * segundo argumento. Passar só o `import()` dava um erro de tipo que ninguém
 * percebe à primeira.
 *
 * Vive fora de `Lazy.tsx` porque aquele ficheiro exporta componentes, e o
 * `react-refresh` só funciona quando um ficheiro exporta uma coisa só. Com o
 * helper aqui dentro, o Fast Refresh do Vite parava de funcionar para o
 * developer inteiro.
 */
export function lazyPage<P>(
	loader: () => Promise<Record<string, ComponentType<P>>>,
	name: string,
): ComponentType<P> {
	const Page = lazy(async () => {
		const module = await loader();
		const Exportado = module[name];

		if (!Exportado) {
			// Falhar aqui com uma mensagem clara é melhor do que a página
			// aparecer vazia sem que nada diga porquê.
			throw new Error(`A página "${name}" não tem esse export.`);
		}

		return { default: Exportado };
	});

	return Page as ComponentType<P>;
}
