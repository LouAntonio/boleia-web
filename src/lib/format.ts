/**
 * Formatadores puros.
 *
 * Nada aqui toca em rede, estado ou componente — só o `Date` quando é
 * inevitável. Se alguma vez precisarem de saber o sítio de onde vêm, é sinal de
 * que o que estão a fazer não era um formatador.
 */

/** "Lourenço António" -> "LA". Usado no avatar. */
export function initials(name: string, surname?: string | null): string {
	const first = name.trim().charAt(0);
	const last = (surname ?? '').trim().charAt(0);
	return `${first}${last}`.toUpperCase();
}

/** 8500 -> "8 500 Kz". O símbolo fica longe do número. */
export function fmtKz(value: number): string {
	const rounded = Math.round(value);
	const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	return `${grouped} Kz`;
}

/** Campo de preço: só dígitos, agrupados, enquanto se escreve. */
export function formatKzInput(raw: string): string {
	return raw
		.replace(/\D/g, '')
		.slice(0, 8)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function parseKzInput(raw: string): number {
	return Math.max(0, Number(raw.replace(/\D/g, '')) || 0);
}

/**
 * "08:30" na hora local do browser.
 *
 * O fuso de quem lê é o fuso de quem viaja, e no Angola há só um. Ainda assim,
 * isto converte a data tal como o servidor a mandou — e o backend já devolve as
 * horas de paragem em WAT, pelo que `timeLabel` não passa aqui.
 */
export function hhmm(iso: string): string {
	const date = new Date(Date.parse(iso));
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleTimeString('pt-PT', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

/** "sex, 10 out 2026". */
export function fmtDate(iso: string): string {
	const date = new Date(Date.parse(iso));
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString('pt-PT', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});
}

export function fmtLongDate(iso: string): string {
	const date = new Date(Date.parse(iso));
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString('pt-PT', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

/** Duração em minutos -> "6h20" ou "45min". */
export function fmtDuration(totalMinutes: number): string {
	const minutes = Math.max(0, Math.round(totalMinutes));
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}min`;
	return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

export function durationBetween(fromISO: string, toISO: string): string {
	return fmtDuration((Date.parse(toISO) - Date.parse(fromISO)) / 60000);
}

/** "a hoje" / "amanhã" / "sex, 10 out", para agrupar a lista por dia. */
export function relativeDay(iso: string): string {
	const date = new Date(Date.parse(iso));
	if (Number.isNaN(date.getTime())) return '—';

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const target = new Date(date);
	target.setHours(0, 0, 0, 0);

	const days = Math.round((target.getTime() - today.getTime()) / 86400000);
	if (days === 0) return 'Hoje';
	if (days === 1) return 'Amanhã';
	return fmtDate(iso);
}

/** `AAAA-MM-DD` no fuso local. O input type="date" fala esta língua. */
export function toDateInput(iso: string): string {
	const date = new Date(Date.parse(iso));
	if (Number.isNaN(date.getTime())) return '';
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** Remove acentos e desce a caixa, para comparar nomes de localidades. */
export function toAscii(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

/** Lugares que ainda sobram. Nunca negativo, mesmo que o backend se atrapalhe. */
export function seatsLeft(seatsTotal: number, seatsTaken: number): number {
	return Math.max(0, seatsTotal - seatsTaken);
}

/** "2 de 4 lugares" — o número grande é o que interessa, o resto é contexto. */
export function seatsLabel(seatsTotal: number, seatsTaken: number): string {
	const free = seatsLeft(seatsTotal, seatsTaken);
	if (free === 0) return 'Esgotada';
	if (free === 1) return 'Último lugar';
	return `${free} de ${seatsTotal} lugares`;
}
