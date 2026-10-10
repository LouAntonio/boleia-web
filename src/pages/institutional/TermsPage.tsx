import { PageHeader } from '../../components/layout/legal/PageHeader';
import {
	Prose,
	P,
	Section,
	UL,
	LI,
	Table,
	Aside,
} from '../../components/layout/legal/Prose';
import {
	Todo,
	DraftNotice,
	DocIndex,
	RevisionDate,
} from '../../components/layout/legal/LegalDoc';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * Os termos e condições.
 *
 * Ao contrário da política de privacidade, quase nada aqui é verificável por
 * leitura de código. Os termos são um documento de decisões: quem arrisca, quem
 * pode ser responsabilizado, onde se resolve uma disputa. Escrevê-los é escrever
 * em nome de alguém que não me deu esses números — e por isso o que depende
 * disso fica marcado, em destaque e não escondido.
 *
 * O que **é** escrevível sem invenção é a parte operacional: o que a Boleia faz,
 * o que não faz, e o que acontece quando alguém não cumpre. E essa parte é a
 * mais importante de um termo de utilização: uma pessoa lê o que a plataforma
 * promete, não a lei.
 */
export function TermsPage() {
	usePageMeta(
		'Termos e condições',
		'O que a Boleia é, o que não é, como funciona uma reserva, quem pode usar a plataforma e o que acontece quando alguém não cumpre os termos.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Termos"
				title="As regras da plataforma."
				description="A Boleia liga quem tem lugares a quem os quer. O resto é contrato entre ti e quem vai conduzir."
			/>

			<div className="mx-auto max-w-6xl px-6 py-14">
				<DraftNotice missing={5} />

				<div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
					<DocIndex items={INDEX} />

					<Prose>
						<Section id="quem-e" title="Quem escreve isto">
							<P>
								Estes termos são entre ti e a entidade que opera a
								Boleia: <Todo />, com o número de identificação{' '}
								<Todo />, sede em <Todo />, que adiante é «a
								Boleia».
							</P>

							<P>
								Quando usas a plataforma, aceitas estes termos. Se
								não aceitares, não precisas de fechar a conta —
								basta não usares.
							</P>
						</Section>

						<Section id="o-que-e" title="O que a Boleia é">
							<P>
								A Boleia é um serviço que permite a pessoas
								publicarem lugares livres numa viatura e a outras
								reservarem-nos. É isso.
							</P>

							<P>
								Não é uma transportadora, não é uma agência de
								viagens, não aluga viaturas e não transporta carga.
								Não temos frota, não conduzimos, e não somos uma das
								partes do contrato entre o passageiro e o motorista.
							</P>

							<Aside>
								Isto não é uma cláusula para parecer que a is. É a
								diferença entre reservar um lugar numa boleia e
								contratar uma empresa de transportes, e quem pagar
								por essa diferença paga-a a quem conduz. reservar um
								lugar numa boleia e contratar uma empresa de
								transportes, e quem pagar por essa diferença paga-a
								a quem conduz.
							</Aside>
						</Section>

						<Section id="quem-pode" title="Quem pode usar">
							<UL>
								<LI>
									Quem tem mais de 18 anos. Não criamos contas a
									menores.
								</LI>
								<LI>
									Quem tem um número de telefone que controla. A
									conta é o número, e perder acesso ao número é
									perder acesso à conta.
								</LI>
								<LI>
									Quem tem capacidade para pagar o preço e para
									conduzir, se for condutor.
								</LI>
								<LI>
									Quem tem uma conta pessoal. Não é permitido
									criar contas em nome de outra pessoa nem usar a
									plataforma para pedir dinheiro a outra pessoa em
									nome próprio.
								</LI>
							</UL>

							<P>
								A Boleia pode suspender uma conta que não cumpra
								estes termos. A suspensão tira acesso à plataforma e
								fecha as reservas em curso com aviso.
							</P>
						</Section>

						<Section
							id="verificacao"
							title="A verificação de identidade"
						>
							<P>
								Para pedir lugares, e para os publicar, é preciso
								ter a identidade verificada. Podes pedir sem ter, e
								consegues ver tudo — o que falta é poder assumir um
								compromisso com outra pessoa.
							</P>

							<UL>
								<LI>
									<strong className="text-ink">
										Para reservar.
									</strong>{' '}
									Identidade de passageiro: nome e número do BI,
									mais fotografias do documento e duas tuas.
								</LI>
								<LI>
									<strong className="text-ink">
										Para publicar.
									</strong>{' '}
									Identidade de motorista — a mesma coisa, mais a
									carta de condução — e pelo menos uma viatura
									verificada.
								</LI>
							</UL>

							<P>
								Uma verificação recusada nunca é sem razão, e a
								razão é mostrada. Podes corrigir e reenviar. Uma
								verificação recusada por envio de documentos de
								outra pessoa pode levar a suspensão da conta.
							</P>
						</Section>

						<Section id="reservas" title="Como funciona uma reserva">
							<P>
								Uma reserva é um pedido, não uma reserva fechada. O
								lugar só é definitivo quando o motorista aceita.
							</P>

							<Table
								caption="O que cada estado de uma reserva significa."
								head={['Estado', 'O que está a acontecer']}
								rows={[
									[
										'À espera',
										'Enviaste o pedido. O motorista ainda não respondeu. Se não responder em 30 minutos, expira.',
									],
									[
										'Confirmada',
										'O motorista aceitou. O lugar é teu e o passageiro vê os teus dados.',
									],
									[
										'Recusada',
										'O motorista não pode. Vê a razão que escreveu, se escreveu.',
									],
									[
										'Cancelada',
										'Qualquer um dos lados cancelou. O lugar volta a ficar livre.',
									],
									[
										'Expirou',
										'Passaram 30 minutos sem resposta. Não houve culpa de ninguém.',
									],
									['Concluída', 'A viagem aconteceu.'],
								]}
							/>

							<P>
								O passageiro pode cancelar uma reserva a qualquer
								momento antes de a viagem começar. O motorista pode
								cancelar uma boleia publicada, e quem tinha reserva
								confirmada é avisado.
							</P>
						</Section>

						<Section id="pagamento" title="Preço e pagamento">
							<P>
								O preço por lugar é definido pelo motorista e
								visível no momento do pedido. A Boleia não o altera,
								não o cobra e não o intermedia.
							</P>

							<P>
								O pagamento é feito em dinheiro, ao motorista, no
								momento do embarque. A Boleia não tem carteira, não
								recebe dinheiro e hoje
								<strong className="text-ink">
									não cobra comissão
								</strong>{' '}
								de ninguém.
							</P>

							<P>
								Isto tem duas consequências que assumimos por
								escrito. A primeira: não há garantia de pagamento do
								passageiro ao motorista — é um risco de quem conduz,
								e por isso o painel mostra a identidade do
								passageiro antes de aceitar. A segunda: não há
								mecanismo centralizado de reembolso, porque não há
								um pagamento centralizado a reembolsar. <Todo />
							</P>
						</Section>

						<Section id="conduta" title="Conduta na plataforma">
							<P>Fica proibido, e a Boleia suspende quem o fizer:</P>

							<UL>
								<LI>
									Publicar uma rota ou uma viatura que não exists,
									ou com lugares mais do que a viatura tem.
								</LI>
								<LI>
									Cancelar repetidamente boleias publicadas,
									deixando passageiros com reserva confirmada sem
									serviço.
								</LI>
								<LI>
									Cobrar a um passageiro mais do que o preço
									publicado.
								</LI>
								<LI>
									Usar a plataforma para qualquer tipo de
									transporte de carga, de expresso ou de táxi
									apps.
								</LI>
								<LI>
									Pedir dinheiro a um passageiro fora do preço do
									lugar.
								</LI>
								<LI>
									Enviar documentos de identidade falsos, ou os de
									outra pessoa.
								</LI>
								<LI>
									Pedir a outro utilizador a palavra-passe, o
									código de verificação ou as fotografias do BI.
								</LI>
							</UL>
						</Section>

						<Section id="suspensao" title="Suspensão e encerramento">
							<P>
								Se houver um incidente grave, a conta é suspensa e
								as reservas em curso são avisadas. Se o problema se
								repetir, a conta é encerrada. são avisadas. Se selo
								problema repetir, a conta é encerrada.
							</P>

							<P>
								Podes pedir a eliminação da tua conta a qualquer
								momento, no perfil. Isso encerra a conta e revoga as
								sessões.{' '}
								<a
									href="/privacidade"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									A política de privacidade
								</a>{' '}
								explica o que acontece aos teus dados depois disso —
								e vale a pena leres antes de te registares.
							</P>
						</Section>

						<Section id="responsabilidade" title="Responsabilidade">
							<P>
								A Boleia é uma plataforma. Coloca as duas partes em
								contacto e mantém os registos do que foi combinado.
								Não garante que a viagem chegue ao destino, que o
								preço seja justo, ou que as pessoas se tratem bem
								depois do primeiro contacto. e mantém os registos do
								que foi combinado. Não garante que a viagem chegue
								ao destino, que o preço seja justo, ou que as
								pessoas se tratem bem depois do primeiro contacto.
							</P>

							<P>
								O contrato de transporte, os direitos e deveres que
								daí resultam, e o preço são entre o passageiro e o
								motorista. A Boleia não é parte desse contrato e não
								responde por incumprimentos de terceiros. <Todo />
							</P>

							<P>
								Respondemos pelo que é nosso: pela Plataforma estar
								disponível, pelos dados que guardamos e pelo que
								fazemos com eles, e por qualquer acesso indevido a
								contas. <Todo />
							</P>
						</Section>

						<Section id="disputas" title="Onde se resolvem as dúvidas">
							<P>
								Primeiro entre as partes envolvidas. Se isso não
								resolver, entre ti e a Boleia, por email, através de{' '}
								<a
									href="mailto:suporte@boleia.ao"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									suporte@boleia.ao
								</a>
								. <Todo />
							</P>

							<Aside>
								Isto não afasta o direito de qualquer parte de
								recorrer aos órgãos de justiça competentes, nem de
								apresentar queixa à Agência de Protecção de Dados.
							</Aside>
						</Section>

						<Section id="alteracoes" title="Se estes termos mudarem">
							<P>
								Quando mudarem, a data em baixo muda. Se a mudança
								for importante, avisa quem tem conta antes de a
								aplicar — e nunca aplica de surpresa a algo que já
								estava aceite.
							</P>

							<P>
								Continuar a usar a plataforma depois da data
								significa aceitar os termos novos. Se não aceitares,
								fechar a conta continua a ser uma opção.
							</P>
						</Section>

						<RevisionDate iso="2026-10-10" />
					</Prose>
				</div>
			</div>
		</>
	);
}

const INDEX = [
	{ id: 'quem-e', label: 'Quem escreve isto' },
	{ id: 'o-que-e', label: 'O que a Boleia é' },
	{ id: 'quem-pode', label: 'Quem pode usar' },
	{ id: 'verificacao', label: 'A verificação de identidade' },
	{ id: 'reservas', label: 'Como funciona uma reserva' },
	{ id: 'pagamento', label: 'Preço e pagamento' },
	{ id: 'conduta', label: 'Conduta' },
	{ id: 'suspensao', label: 'Suspensão e encerramento' },
	{ id: 'responsabilidade', label: 'Responsabilidade' },
	{ id: 'disputas', label: 'Onde se resolvem as dúvidas' },
	{ id: 'alteracoes', label: 'Se estes termos mudarem' },
];
