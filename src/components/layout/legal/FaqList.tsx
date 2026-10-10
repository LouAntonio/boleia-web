import { ChevronDown } from 'lucide-react';

export interface FaqItem {
	q: string;
	a: string;
	/** Marcas a resposta que ainda depende de uma decisão comercial. */
	pending?: boolean;
}

export interface FaqGroup {
	title: string;
	items: FaqItem[];
}

/**
 * A lista de perguntas.
 *
 * `<details>` nativo, e não um acordeão feito à mão. O que se ganha com o
 * elemento nativo é o comportamento todo de graça: abre e fecha com o teclado,
 * comunica o estado ao leitor de ecrã ("recolhido", "expandido"), funciona sem
 * JavaScript e respeita a busca do browser pelo `Ctrl+F`.
 *
 * Um acordeão em React com `<button>` e `aria-expanded` dá o mesmo aspecto e
 * custa quarenta linhas, um `useState` por pergunta e mais um caminho onde as
 * coisas podem correr mal.
 */
export function FaqList({ groups }: { groups: FaqGroup[] }) {
	return (
		<div className="flex flex-col gap-14">
			{groups.map((group) => (
				<section key={group.title}>
					<h2 className="text-h3 text-ink">{group.title}</h2>

					<div className="mt-5 divide-y divide-line border-y border-line">
						{group.items.map((item) => (
							<details key={item.q} className="group">
								<summary
									className={[
										'flex cursor-pointer list-none items-start justify-between gap-4',
										'py-5 text-label font-medium text-ink',
										// `list-none` tira o triângulo do browser; o ícone
										// próprio abaixo é o indicador. Sem isto ficava
										// com dois marcadores de "abrir".
										'[&::-webkit-details-marker]:hidden',
									].join(' ')}
								>
									<span>{item.q}</span>
									<ChevronDown
										size={18}
										aria-hidden="true"
										className="mt-0.5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
									/>
								</summary>

								<div className="pb-5 pr-8 text-body text-muted">
									{item.a}

									{/*
									 * Uma resposta que depende de uma decisão que ainda não
									 * foi tomada diz-se. Um prazo inventado — «respondemos em
									 * 24 horas» — é uma promessa que alguém depois não cumpre,
									 * e é a pessoa que escreve a acreditar que resolve um
									 * problema.
									 */}
									{item.pending ? (
										<p className="mt-3 text-small text-muted">
											Esta resposta ainda está por fechar.{' '}
											<a
												href="/contacto"
												className="rounded-sm text-brand-text underline-offset-4 hover:underline"
											>
												Avisa-nos se precisares dela
											</a>
											.
										</p>
									) : null}
								</div>
							</details>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
