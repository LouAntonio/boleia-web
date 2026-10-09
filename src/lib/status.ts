import type { BookingStatus, KycStatus, RideStatus } from '../types/api';

/**
 * Estados de negócio → tom visual, e o rótulo que se lê.
 *
 * Um estado nunca se mostra só pela cor. Cada `StatusStamp` tem sempre texto
 * ao lado do ponto, porque 1 em 12 homens não distingue o verde do vermelho —
 * e um passageiro que não sabe se a reserva está confirmada não se levanta para
 * a estação por causa disso.
 */
export type StatusTone = 'pending' | 'active' | 'done' | 'failed' | 'neutral';

/** O fundo e o texto de cada tom. Usado pelo `StatusStamp` e pelas listas. */
export const TONE_SURFACE: Record<
	StatusTone,
	{ bg: string; fg: string; dot: string }
> = {
	pending: { bg: 'bg-caution', fg: 'text-caution-ink', dot: 'bg-caution-ink/60' },
	active: { bg: 'bg-brand-soft', fg: 'text-brand-text', dot: 'bg-brand' },
	done: { bg: 'bg-ok-soft', fg: 'text-ok', dot: 'bg-ok' },
	failed: { bg: 'bg-alert-soft', fg: 'text-alert', dot: 'bg-alert' },
	neutral: { bg: 'bg-canvas', fg: 'text-muted', dot: 'bg-muted' },
};

const RIDE: Record<RideStatus, { tone: StatusTone; label: string }> = {
	SCHEDULED: { tone: 'pending', label: 'Agendada' },
	IN_PROGRESS: { tone: 'active', label: 'Em curso' },
	COMPLETED: { tone: 'done', label: 'Concluída' },
	CANCELLED: { tone: 'failed', label: 'Cancelada' },
};

const BOOKING: Record<BookingStatus, { tone: StatusTone; label: string }> = {
	// `REQUESTED` é o estado mais frequente e o que mais incomoda. Amarelo, e não
	// azul: azul diz "a tratar", amarelo diz "ainda não há resposta".
	REQUESTED: { tone: 'pending', label: 'À espera' },
	CONFIRMED: { tone: 'done', label: 'Confirmada' },
	IN_PROGRESS: { tone: 'active', label: 'Em curso' },
	COMPLETED: { tone: 'done', label: 'Concluída' },
	REJECTED: { tone: 'failed', label: 'Recusada' },
	CANCELLED: { tone: 'neutral', label: 'Cancelada' },
	// Expirou porque o motorista não respondeu a tempo. Neutro, não vermelho:
	// não houve culpa de ninguém.
	EXPIRED: { tone: 'neutral', label: 'Expirou' },
};

const KYC: Record<KycStatus, { tone: StatusTone; label: string }> = {
	NOT_SUBMITTED: { tone: 'neutral', label: 'Por enviar' },
	PENDING: { tone: 'pending', label: 'Em análise' },
	VERIFIED: { tone: 'done', label: 'Verificado' },
	REJECTED: { tone: 'failed', label: 'Recusado' },
};

export function statusMeta(status: string): { tone: StatusTone; label: string } {
	const ride = RIDE[status as RideStatus];
	if (ride) return ride;

	const booking = BOOKING[status as BookingStatus];
	if (booking) return booking;

	const kyc = KYC[status as KycStatus];
	if (kyc) return kyc;

	// Um estado que este site não conhece não é erro nenhum: mostra-se neutro e
	// com o próprio nome, e o site não se parte quando o backend ganha um.
	return { tone: 'neutral', label: status.replace(/_/g, ' ') };
}
