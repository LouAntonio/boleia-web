import { Suspense, type ReactNode } from 'react';

/**
 * O esqueleto enquanto um bloco de rota chega.
 *
 * A ordem é a mesma em que o `<PageHeader>` põe as coisas: cabeçalho, título,
 * descrição, e só depois o conteúdo. Um esqueleto com a forma errada faz a
 * página dar um salto quando o conteúdo chega, e o salto acaba por ser mais
 * visível do que a espera.
 */
export function PageFallback() {
	return (
		<div
			className="min-h-screen bg-canvas"
			role="status"
			aria-label="A carregar a página"
		>
			<div className="mx-auto max-w-6xl px-6 py-16">
				<div className="animate-pulse-soft h-10 w-2/3 max-w-xl rounded bg-line" />
				<div className="mt-6 h-6 w-1/2 max-w-lg rounded bg-line" />
				<div className="mt-16 h-40 w-full rounded-lg border border-line bg-surface" />
			</div>
		</div>
	);
}

/**
 * Envolve a rota activa.
 *
 * O `Suspense` está **acima** do `<Routes>` e não dentro de cada `<Route>`: com
 * ele dentro, cada navegação apareceria e desapareceria. Com um só, o fallback
 * é o mesmo e a transição entre duas páginas não pisca o ecrã.
 */
export function PageSuspense({ children }: { children: ReactNode }) {
	return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}
