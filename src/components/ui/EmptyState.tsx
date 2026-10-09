import type { ReactNode } from 'react';

interface EmptyStateProps {
	title: string;
	/** O que a pessoa pode fazer a seguir. Nunca uma desculpa. */
	description?: string;
	action?: ReactNode;
	icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
			{icon ? <div className="mb-4 text-muted">{icon}</div> : null}
			<h3 className="text-h3 text-ink">{title}</h3>
			{description ? (
				<p className="mt-2 max-w-md text-body text-muted">{description}</p>
			) : null}
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}
