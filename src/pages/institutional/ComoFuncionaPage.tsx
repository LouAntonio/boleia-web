import { Link } from 'react-router-dom';
import { PageHeader, PageCta } from '../../components/layout/legal/PageHeader';
import {
	Prose,
	P,
	Section,
	OL,
	LI,
	Aside,
} from '../../components/layout/legal/Prose';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * Como funciona, de ponta a ponta.
 *
 * Não é um separador "passageiros" e outro "motoristas": a mesma pessoa é
 * passageira numa boleia de terça e motorista na de sábado, e o que ela
 * precisa de perceber primeiro é o circuito inteiro — publicar, pedir,
 * aceitar, viajar, pagar — e só depois afinar de que lado entra.
 *
 * Os passos dizem também os momentos em que o sistema fala por si: o pedido
 * expira, o motorista recusa com um motivo, o código vai por WhatsApp. Uma
 * página que descreve só o caminho feliz é a razão de haver chamadas de
 * apoio no fim da viagem.
 */
export function ComoFuncionaPage() {
	usePageMeta(
		'Como funciona',
		'O circuito por inteiro: publicar, pedir, aceitar, viajar e pagar. Inclui também o que acontece quando alguém não responde ou recusa — porque é aí que uma explicação é precisada.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Como funciona"
				title="Do anúncio à chegada, com as regras à vista."
				description="O circuito é o mesmo numa distância curta em Luanda e numa interprovincial até Huambo. Mudam o preço e as paragens — não muda a forma como as coisas acontecem."
			/>

			<div className="mx-auto max-w-6xl px-6 py-16">
				<Prose>
					<Section id="o-circuito" title="O circuito por inteiro">
						<P>Antes do pormenor, o circuito de cima:</P>

						<OL>
							<LI>
								<strong className="text-ink">
									Entrar com o número.
								</strong>{' '}
								O código por WhatsApp é a conta: sem ele, não se
								está dentro. Email e senha são opcionais e vive em
								"Conta".
							</LI>
							<LI>
								<strong className="text-ink">
									Provar quem és.
								</strong>{' '}
								Uma foto do BI (frente e verso) e uma fotografia
								tua, passageiro e condutor. De quem vai conduzir,
								ainda a carta e a viatura.
							</LI>
							<LI>
								<strong className="text-ink">
									Ver o que sai, sem precisar de conta.
								</strong>{' '}
								A lista de boleias — em{' '}
								<Link
									to="/boleias"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									/boleias
								</Link>{' '}
								— é pública: dia, rota, lugares livres e preço. Nada
								de mais.
							</LI>
							<LI>
								<strong className="text-ink">Pedir o lugar.</strong>{' '}
								Escolhe-se a rota, o dia, quantos lugares e o ponto
								onde se entra. Depois é o motorista que decide: tem
								30 minutos para aceitar ou recusar.
							</LI>
							<LI>
								<strong className="text-ink">
									Pagar na viatura e viajar.
								</strong>{' '}
								Dinheiro na mão, ao combustível que o carro faz. O
								motorista dá partida e a corrida é seguida até ao
								destino.
							</LI>
						</OL>

						<Aside>
							A Boleia arranja e organiza. A viagem em si é um acordo
							entre quem conduz e quem vem — e é esse acordo que a
							identidade verificada protege.
						</Aside>
					</Section>

					<Section id="se-vais-conduzir" title="Se vais conduzir">
						<P>
							Publicar não tem mensalidade nem comissão: a Boleia não
							fica com parte do que recebes por lugar. O teu é o teu,
							e o aprovisionamento serve só para assegurar o lugar, a
							pessoa e a viatura.
						</P>

						<P>O que acontece, pela ordem:</P>

						<OL>
							<LI>
								Registas a viatura — make, modelo, cor, matrícula e
								fotos. O gestor confirma-a; sem isso, o cartão do
								motorista não conta para publicar.
							</LI>
							<LI>
								Publicas a boleia: rota, dia e hora de partida,
								quantos lugares queres vender e quanto fica cada um.
								As paragens intermédias são opcionais, e o preço é
								seu — a plataforma não deita prestações nem sombras.
							</LI>
							<LI>
								Decides cada pedido à mão. Aceitou, a pessoa entra;
								recusou, o lugar volta ao ar e o motivo chega ao
								passageiro.
							</LI>
							<LI>
								Recebes os Kwanzas na viatura e o dia de partida.
								Quando a corrida termina, a boleia passa a histórico
								e as avaliações ficam por receber.
							</LI>
						</OL>
					</Section>

					<Section id="se-vais-viajar" title="Se vais viajar">
						<P>
							Antes de pedir, sabes três coisas: o dia e a hora de
							partida, os lugares que ainda há e o preço por lugar. O
							que não se vê na lista — o nome do motorista e quem já
							vai na boleia — aparece no detalhe, aberto a qualquer
							pessoa com o link.
						</P>

						<OL>
							<LI>
								<strong className="text-ink">
									Procurar sem entrar.
								</strong>{' '}
								A pesquisa em{' '}
								<Link
									to="/boleias"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									/boleias
								</Link>{' '}
								não pede sessão: a lista de corridas é pública.
							</LI>
							<LI>
								<strong className="text-ink">Ver quem vai.</strong>{' '}
								O detalhe de cada corrida mostra o nome do
								motorista, a viatura que ele registou e as pessoas
								confirmadas — cada uma ligada ao perfil público
								(nome completo, apresentação e membro desde).
							</LI>
							<LI>
								<strong className="text-ink">Pedir o lugar.</strong>{' '}
								De sessão e com o código por WhatsApp. Sem sessão, o
								site devolve à autenticação para terminar o pedido.
							</LI>
							<LI>
								<strong className="text-ink">
									Viajar e pagar.
								</strong>{' '}
								Dinheiro na viatura, a combinar na confirmação. A
								Boleia não fica com montes, não trasfega e não cobra
								à parte.
							</LI>
						</OL>
					</Section>

					<Section id="o-que-pode-falhar" title="O que pode falhar">
						<OL>
							<LI>
								<strong className="text-ink">
									30 minutos sem resposta = expira.
								</strong>{' '}
								O lugar volta solto no instante em que o pedido
								esgotar o tempo. Não fica pendente à espera de
								alguém lembrar.
							</LI>
							<LI>
								<strong className="text-ink">
									Recusa de pedido.
								</strong>{' '}
								Vem com um motivo, e o motivo chega ao passageiro.
								Não é uma recusa muda.
							</LI>
							<LI>
								<strong className="text-ink">
									Código por WhatsApp que não chega.
								</strong>{' '}
								Reenviar é um clique, e o código anterior morre. Se
								o número está errado na conta, ele mudas-no em
								"Conta" — aí é que se pede outro código, agora para
								o número novo.
							</LI>
							<LI>
								<strong className="text-ink">
									Contagem de lugares.
								</strong>{' '}
								Só a reserva confirmada ocupa lugar. Um pedido no ar
								não conta — entra quando o motorista aceita, e o
								contador mostra.
							</LI>
						</OL>
					</Section>
				</Prose>
			</div>

			<PageCta
				title="Já sabes o circuito — escolhe por onde entra"
				body="Se precisas de ir, a lista está aberta e não pede conta. Se tens lugares vazios, publica-os."
				primary={{ to: '/boleias', label: 'Ver as boleias' }}
				secondary={{ to: '/para-motoristas', label: 'Quero conduzir' }}
			/>
		</>
	);
}
