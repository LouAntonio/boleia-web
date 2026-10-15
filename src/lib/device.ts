/**
 * Como se diz, em português, onde foi aberta uma sessão.
 *
 * O backend guarda `ipAddress` e `userAgent` crus e não faz parse. Mostrar
 * `Mozilla/5.0 (Linux; Android 14…)` numa lista de sessões não é informação, é
 * ruído: quem está a tentar perceber se reconhece a sessão não reconhece um
 * user-agent.
 *
 * **Só se traduz o que se reconhece.** Um agente desconhecido devolve `null` e
 * quem chama mostra o que vier. Inventar um nome bonito para uma string que não
 * se conhece seria escrever uma mentira num ecrã de segurança.
 */

/**
 * Browser, pela ordem em que se procura.
 *
 * O `crios` e o `fxios` têm de vir antes do `chrome` e do `firefox` porque o
 * Safari no iOS também se anuncia como Chrome, e o Firefox no iOS como Safari.
 * Um iPhone lido na ordem errada aparece como "Chrome · iOS".
 */
const BROWSERS: readonly { re: RegExp; name: string }[] = [
	{ re: /edg[ea]\//i, name: 'Edge' },
	{ re: /opr\/|opera/i, name: 'Opera' },
	{ re: /samsungbrowser/i, name: 'Samsung Internet' },
	{ re: /crios/i, name: 'Chrome' },
	{ re: /fxios/i, name: 'Firefox' },
	{ re: /firefox/i, name: 'Firefox' },
	{ re: /chrome/i, name: 'Chrome' },
	{ re: /safari/i, name: 'Safari' },
	{ re: /curl|wget|postman|insomnia|node-fetch|axios/i, name: 'Programa' },
];

const SYSTEMS: readonly { re: RegExp; name: string }[] = [
	{ re: /windows nt 10/i, name: 'Windows' },
	{ re: /windows/i, name: 'Windows' },
	{ re: /iphone|ipad|ipod/i, name: 'iOS' },
	{ re: /mac os x/i, name: 'macOS' },
	{ re: /android/i, name: 'Android' },
	{ re: /cros/i, name: 'ChromeOS' },
	{ re: /linux/i, name: 'Linux' },
];

/**
 * O agente do utilizador, reduzido a duas palavras.
 *
 * Não inclui a versão: `Chrome 131` envelhece mal e não ajuda ninguém a
 * reconhecer a sessão que está a ver. "Chrome · Windows" diz o essencial.
 */
export function describeDevice(userAgent: string | null): string | null {
	if (!userAgent) return null;
	const parts: string[] = [];

	for (const { re, name } of BROWSERS) {
		if (re.test(userAgent)) {
			parts.push(name);
			break;
		}
	}
	for (const { re, name } of SYSTEMS) {
		if (re.test(userAgent)) {
			parts.push(name);
			break;
		}
	}

	return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Data de criação da sessão, escrita à mão.
 *
 * `toLocaleDateString('pt-PT')` depende do ICU que o browser traz, e nem
 * todos trazem o mesmo. Um ecrã de segurança que às vezes escreve "12 Mar"
 * noutro "Mar 12" lê-se como defeito.
 */
export function sessionDate(value: string | Date | null | undefined): string {
	if (!value) return '—';
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return '—';

	const months = [
		'janeiro',
		'fevereiro',
		'março',
		'abril',
		'maio',
		'junho',
		'julho',
		'agosto',
		'setembro',
		'outubro',
		'novembro',
		'dezembro',
	];
	return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}
