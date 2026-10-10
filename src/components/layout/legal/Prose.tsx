import type { ReactNode } from 'react';

/**
 * A coluna de leitura de uma página institucional.
 *
 * A largura é limitada a 68 caracteres porque é aí que o olho deixa de se
 * perder ao voltar ao início da linha. Numa página institucional a linha
 * inteira é a linha de leitura — um parágrafo de 1400px de largura obriga a
 * varrer o ecrã de lado para lado a cada frase.
 *
 * Em ecrãs estreitos não há limite: a coluna é `100%` até ao `lg`, onde passa
 * a ser 68ch.
 */
export function Prose({
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`max-w-[68ch] text-body leading-relaxed text-ink ${className}`}
		>
			{children}
		</div>
	);
}

/**
 * Um parágrafo com espaço antes.
 *
 * Existe para não ter um `<p className="mt-6">` repetido em cada página. Um
 * componente que faz uma coisa, para essa coisa ser escrita uma vez só.
 */
export function P({
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
}) {
	return <p className={`mt-5 ${className}`}>{children}</p>;
}

/** Uma secção com título. O `id` serve de âncora para o índice do documento. */
export function Section({
	id,
	title,
	children,
	level = 2,
}: {
	id: string;
	title: string;
	children: ReactNode;
	level?: 2 | 3;
}) {
	const Heading = level === 2 ? 'h2' : 'h3';

	return (
		<section className="mt-12 first:mt-0">
			<Heading
				id={id}
				className={[
					'scroll-mt-24 text-ink',
					level === 2 ? 'text-h3' : 'text-label font-medium',
				].join(' ')}
			>
				{title}
			</Heading>
			<div className={level === 2 ? 'mt-2' : 'mt-1'}>{children}</div>
		</section>
	);
}

/**
 * Uma lista de itens.
 *
 * O marcador é o do browser, e não um ponto desenhado à mão. Uma `<ul>` com
 * `li` dentro é uma coisa que o leitor de ecrã sabe anunciar — número de itens
 * e onde acaba a lista — e uma sequência de `<div>` com um `•` à frente não é.
 */
export function UL({ children }: { children: ReactNode }) {
	return (
		<ul className="mt-5 flex list-disc flex-col gap-2 pl-5 marker:text-muted">
			{children}
		</ul>
	);
}

export function LI({ children }: { children: ReactNode }) {
	return <li className="pl-1">{children}</li>;
}

/** Uma lista numerada, para os passos e as condições. */
export function OL({ children }: { children: ReactNode }) {
	return (
		<ol className="mt-5 flex list-decimal flex-col gap-3 pl-5 marker:font-medium marker:text-muted">
			{children}
		</ol>
	);
}

/**
 * Uma tabela de dados.
 *
 * Enrolada num `div` com `overflow-x-auto`: numa janela estreita, uma tabela
 * de três colunas de texto comprido transborda a página e cria uma barra de
 * rolagem horizontal no corpo inteiro — que é a forma mais rápida de fazer um
 * site parecer partido num telemóvel.
 *
 * `role="table"` com `caption` é redundante para quem vê, e indispensável para
 * quem ouve: sem o `caption`, a pessoa com leitor de ecrã sabe que há uma
 * tabela e nunca sabe de quê.
 */
export function Table({
	caption,
	head,
	rows,
}: {
	caption: string;
	head: string[];
	rows: ReactNode[][];
}) {
	return (
		<div className="mt-6 overflow-x-auto rounded-lg border border-line">
			<table className="w-full min-w-[34rem] border-collapse text-small">
				<caption className="sr-only">{caption}</caption>

				<thead>
					<tr className="border-b border-line bg-canvas">
						{head.map((cell) => (
							<th
								key={cell}
								scope="col"
								className="px-4 py-3 text-left font-medium text-ink"
							>
								{cell}
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{rows.map((row, rowIndex) => (
						<tr
							key={rowIndex}
							className="border-b border-line last:border-0"
						>
							{row.map((cell, cellIndex) => (
								<td
									key={cellIndex}
									className={[
										'px-4 py-3 align-top',
										cellIndex === 0
											? 'font-medium text-ink'
											: 'text-muted',
									].join(' ')}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** Uma nota que se lê de outra maneira: contexto, ressalva, aviso. */
export function Aside({ children }: { children: ReactNode }) {
	return (
		<p className="mt-5 border-l-2 border-brand pl-4 text-muted">{children}</p>
	);
}
