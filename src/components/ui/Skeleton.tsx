/**
 * Esqueletos de carga.
 *
 * Um esqueleto tem a forma do que vai aparecer. Um `animate-pulse` com um bloco
 * cinzento genérico faz a página dar um salto quando o conteúdo chega, e esse
 * salto é mais visível do que a espera.
 */
export function SkeletonLine({ className = '' }: { className?: string }) {
	return (
		<div
			className={`animate-pulse-soft rounded bg-line ${className}`}
			aria-hidden="true"
		/>
	);
}

export function SkeletonCard({ className = '' }: { className?: string }) {
	return (
		<div
			className={`rounded-lg border border-line bg-surface p-5 ${className}`}
			aria-hidden="true"
		>
			<SkeletonLine className="h-4 w-1/3" />
			<SkeletonLine className="mt-3 h-3 w-2/3" />
			<SkeletonLine className="mt-2 h-3 w-1/2" />
			<SkeletonLine className="mt-6 h-8 w-24" />
		</div>
	);
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
	return (
		<div
			className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
			role="status"
			aria-label="A carregar"
		>
			{Array.from({ length: count }, (_, index) => (
				<SkeletonCard key={index} />
			))}
			<span className="sr-only">A carregar</span>
		</div>
	);
}
