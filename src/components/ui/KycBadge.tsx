import type { KycState } from '../../types/api';

/**
 * O estado de uma verificação, escrito por extenso.
 *
 * Uma frase, não um selo: "Verificado" a seco não diz *que* foi verificado, e o
 * ecrã onde isto aparece já tem um `StatusStamp` ao lado com a cor. Aqui o
 * assunto é o texto — e o caso que mais importa é o de fora: uma recusa sem
 * explicação deixaria a pessoa sem forma de saber o que corrigir.
 */
export function KycBadge({
	state,
	what,
}: {
	state: KycState | null;
	what: string;
}) {
	if (!state || state.status === 'NOT_SUBMITTED') {
		return (
			<p className="text-small text-muted">
				Não enviaste ainda a tua {what}.
			</p>
		);
	}

	if (state.status === 'PENDING') {
		return (
			<p className="text-small text-caution-ink">
				A tua {what} está em análise.
			</p>
		);
	}

	if (state.status === 'REJECTED') {
		return (
			<p className="text-small text-alert">
				A tua {what} foi recusada
				{state.rejectionReason ? `: ${state.rejectionReason}` : '.'}
			</p>
		);
	}

	return <p className="text-small text-ok">A tua {what} está verificada.</p>;
}
