/**
 * Telefones angolanos.
 *
 * Regra do cliente = regra do servidor. O backend normaliza o telefone com um
 * único passo (`raw.replace(/\s+/g, '')`) e valida um mínimo de 9 dígitos com
 * zod. Este ficheiro faz exactamente o mesmo.
 *
 * Isto parece pouco, e é de propósito. Uma versão "melhor" que cortasse o
 * `+244` ou tirasse os parênteses faria o cliente e o servidor discordarem
 * sobre quem é quem: o número escrito de uma maneira entraria, e o mesmo número
 * escrito de outra não encontraria a conta — porque o que ficou guardado foi
 * aquele, não este. Se um dia se normalizar melhor, muda-se nos dois sítios
 * ao mesmo tempo.
 */

/**
 * Espelha `normalizePhone` de `back/src/auth/otp.ts`: tira só espaços.
 *
 * Não corta o código do país. Se alguém se registou com `+244923456789`, foi
 * esse o número guardado, e é esse que tem de voltar.
 */
export function normalizePhone(input: string): string {
	return input.replace(/\s+/g, '');
}

/** Insere os espaços enquanto se escreve: "923 456 789". */
export function maskPhone(input: string): string {
	const digits = normalizePhone(input).slice(0, 15);
	const parts = [
		digits.slice(0, 3),
		digits.slice(3, 6),
		digits.slice(6, 9),
		digits.slice(9, 12),
		digits.slice(12, 15),
	];
	return parts.filter(Boolean).join(' ');
}

/** `9XX XXX XXX` — como se escreve um número angolano de 9 dígitos. */
export function phonePlaceholder(): string {
	return '9XX XXX XXX';
}

/**
 * O mesmo mínimo do schema zod do backend (`phone.min(9)`).
 *
 * Com um aviso acima: o número de um telemóvel angolano começa por 9, mas quem
 * tem um número de terra não passa. Recusar aqui traria de volta alguém que o
 * servidor ia aceitar.
 */
export function phoneError(input: string): string | null {
	const value = normalizePhone(input);
	if (value.length === 0) return 'Escreve o teu número de telefone.';
	if (value.length < 9) {
		return 'O número está incompleto. Escreve os 9 dígitos.';
	}
	return null;
}

/** A senha, com o mesmo mínimo de 8 caracteres que o backend exige. */
export function passwordError(password: string): string | null {
	if (password.length === 0) return 'Escreve a tua senha.';
	if (password.length < 8) {
		return 'A senha precisa de pelo menos 8 caracteres.';
	}
	return null;
}

/** Código de 6 dígitos de um só campo de texto. */
export function maskOtp(input: string): string {
	return input.replace(/\D/g, '').slice(0, 6);
}
