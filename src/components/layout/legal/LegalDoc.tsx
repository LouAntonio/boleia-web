import type { ReactNode } from 'react';

/**
 * Um buraco no texto que alguém tem de preencher.
 *
 * Estes documentos legais não podiam ser escritos inteiros: a razão social, o
 * foro competente e os prazos de retenção são decisões de quem manda na
 * empresa, e o modo honesto de os meter no site é dizer que estão por preencher
 * em vez de os inventar.
 *
 * O risco é óbvio e por isso o marcador é **impossível de não ver**: fundo
 * âmbar, contorno, cor do texto trocada e o texto `[a preencher]` escrito.
 * Uma lacuna só a amarelo e com linha é uma lacuna que alguém passa por alto
 * e publica um termo incompleto a pensar que está pronto.
 *
 * `--caution` e `--caution-ink` é o par que a regra do projecto reserva a
 * avisos, e é a mesma cor de fundo dos separadores de reserva.
 */
export function Todo({ children }: { children?: ReactNode }) {
	return (
		<mark
			className={[
				'rounded-sm bg-caution px-1.5 py-0.5 font-medium text-caution-ink',
				// Um contorno separado faz o destaque ver-se também em fundo
				// escuro e por quem não distingue o âmbar do fundo.
				'border border-caution-ink/20',
			].join(' ')}
		>
			{children ?? 'a preencher'}
		</mark>
	);
}

/**
 * O aviso no topo de um documento por fechar.
 *
 * Só aparece nos documentos que ainda têm `Todo` dentro. O objectivo é que
 * ninguém chegue ao fim de um termo e perceba só nessa altura que aquilo não
 * está pronto.
 */
export function DraftNotice({ missing }: { missing: number }) {
	return (
		<div
			role="note"
			className="mb-10 rounded-lg border border-caution bg-caution px-5 py-4"
		>
			<p className="text-label font-medium text-caution-ink">
				Documento por fechar
			</p>
			<p className="mt-1.5 text-small text-caution-ink">
				Faltam {missing} {missing === 1 ? 'informação' : 'informações'} que
				só quem manda na Boleia pode dar: os campos a amarelo. O resto está
				escrito a partir do que o sistema faz de facto e do que a Lei nº
				22/11 exige.
			</p>
			<p className="mt-2 text-small text-caution-ink">
				Este texto precisa de revisão jurídica antes de valer alguma coisa
				como documento. Encontra a lista do que falta no{' '}
				<a href="/contacto" className="underline">
					contacto
				</a>
				.
			</p>
		</div>
	);
}

/**
 * O índice de um documento longo.
 *
 * Só aparece a partir de `lg`. Em ecrã estreito empurraria o documento todo
 * para baixo para não dizer nada de útil, e o leitor de ecrã ouve uma lista de
 * títulos que ainda não leu.
 *
 * As âncoras são `<a href="#id">` e não `<Link>`: numa página de texto, um
 * link interno tem de funcionar com o botão do meio do rato, com o "abrir num
 * separador novo" e com o copiar ligação — coisas que o router não dá.
 */
export function DocIndex({ items }: { items: { id: string; label: string }[] }) {
	return (
		<nav aria-label="Índice" className="hidden lg:block">
			<h2 className="text-label font-medium text-ink">Neste documento</h2>
			<ol className="mt-4 flex flex-col gap-2.5 border-l border-line pl-4">
				{items.map((item, index) => (
					<li key={item.id}>
						<a
							href={`#${item.id}`}
							className="flex gap-2 rounded-sm text-small text-muted transition-colors hover:text-ink"
						>
							<span className="font-mono text-data text-muted">
								{String(index + 1).padStart(2, '0')}
							</span>
							{item.label}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}

/**
 * A data de revisão de um documento.
 *
 * Uma vez com texto, uma vez como `<time>` legível por máquina. "Última
 * actualização" sem data ao lado não informa ninguém: um documento legal sem
 * data é um documento que ninguém pode avaliar.
 */
export function RevisionDate({ iso }: { iso: string }) {
	return (
		<p className="mt-10 border-t border-line pt-6 text-small text-muted">
			Última actualização:{' '}
			<time dateTime={iso} className="text-ink">
				{new Date(iso).toLocaleDateString('pt-PT', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
				})}
			</time>
		</p>
	);
}
