import { TONE_SURFACE, statusMeta } from '../../lib/status';

interface StatusStampProps {
	status: string;
	/** Substitui o rótulo. Para quando o contexto já diz o estado. */
	label?: string;
}

/**
 * O estado de uma corrida, reserva ou verificação.
 *
 * Ponto + texto sempre. O ponto é a leitura rápida para quem apanha isto de
 * relance; o texto é o que fica quando o ponto não chega.
 */
export function StatusStamp({ status, label }: StatusStampProps) {
	const { tone, label: text } = statusMeta(status);
	const surface = TONE_SURFACE[tone];

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-small font-medium ${surface.bg} ${surface.fg}`}
		>
			<span
				aria-hidden="true"
				className={`h-1.5 w-1.5 rounded-full ${surface.dot}`}
			/>
			{label ?? text}
		</span>
	);
}
