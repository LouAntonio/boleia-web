/**
 * A linha de separação com texto.
 *
 * Numa coluna de 22rem, um "ou" flutuando entre dois botões parece logo o
 * suficiente. A linha completa, com o texto no meio de um fundo que a apaga,
 * é mais uma coisa para desenhar e mantém a coluna legível em ecrãs largos.
 */
export function Divider({ text }: { text?: string }) {
	if (!text) {
		return <hr className="my-6 border-line" />;
	}

	return (
		<div className="my-6 flex items-center gap-3">
			<span className="h-px flex-1 bg-line" />
			<span className="text-small text-muted">{text}</span>
			<span className="h-px flex-1 bg-line" />
		</div>
	);
}
