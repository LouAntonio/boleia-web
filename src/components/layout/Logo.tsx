/**
 * O logótipo.
 *
 * A marca tem dois ficheiros e eles servem para sítios diferentes:
 *
 * - `icon.png` — o quadrado amarelo com o monograma. É o ícone da aplicação, e é
 *   o que vai no cabeçalho e no `favicon`. Funciona em fundo claro e escuro
 *   porque é uma peça fechada, com a sua própria margem.
 * - `logo.png` — o lockup completo com a palavra e a assinatura. Tem fundo
 *   `#121212` **opaco**, num quadrado de 374×374. Numa superfície clara ficaria
 *   um bloco preto a flutuar, por isso só entra no rodapé, que já é preto, e na
 *   página 404.
 *
 * Não existe fonte vectorial da marca, e não há versão "clara" do lockup para
 * consulta. Quando a houver, é aqui que entra.
 */
export function Logo({
	variant = 'icon',
	className = '',
}: {
	variant?: 'icon' | 'full';
	className?: string;
}) {
	if (variant === 'full') {
		return (
			<img
				src="/images/logo.png"
				alt="Boleia — disponibilidade, rapidez e segurança"
				className={`h-16 w-auto rounded ${className}`}
				width={64}
				height={64}
			/>
		);
	}

	return (
		<img
			src="/images/icon.png"
			alt="Boleia"
			className={`h-9 w-9 rounded-md ${className}`}
			width={36}
			height={36}
		/>
	);
}
