import { Link } from 'react-router-dom';
import { IdCard, BusFront, Eye, Banknote, Clock, FileWarning } from 'lucide-react';
import { PageHeader, PageCta } from '../../components/layout/legal/PageHeader';
import {
	Prose,
	P,
	Section,
	UL,
	LI,
	Table,
	Aside,
} from '../../components/layout/legal/Prose';
import { Todo } from '../../components/layout/legal/LegalDoc';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * Como verificamos as pessoas e as viaturas.
 *
 * A mesma matéria que a secção "Confiança" da landing, em profundidade. Ali são
 * quatro frases para convencer; aqui é a resposta à pergunta que o passageiro
 * faz antes de carregar em reservar: «isto é mesmo fiável?».
 *
 * Por isso a página responde também ao que **não** fazemos com os documentos, e
 * quem os vê. Uma garantia de segurança que não diz quem tem acesso aos teus
 * documentos não é uma garantia, é um slogan.
 */
export function SecurityPage() {
	usePageMeta(
		'Segurança',
		'Como a Boleia verifica a identidade do passageiro e do motorista, e a matrícula das viaturas. O que guardamos, quem vê, e o que acontece quando uma verificação é recusada.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Segurança"
				title="O que uma boleia é, antes de ser um lugar."
				description="Reservar um sítio com quem não conheces é, no melhor caso, inconveniência. No pior, é risco."
			/>

			<section className="border-b border-line bg-surface">
				<div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2">
					<Guarantee
						Icon={IdCard}
						title="Identidade verificada"
						body="Toda a gente confirma o telefone ao criar a conta. Quem vai viajar ou conduzir envia o BI e fica à espera de revisão."
					/>
					<Guarantee
						Icon={BusFront}
						title="Viatura verificada"
						body="Marca, modelo e matrícula de cada viatura passam por revisão antes de poder vender lugares."
					/>
					<Guarantee
						Icon={Eye}
						title="Quem conduz, à vista"
						body="O passageiro vê o nome do motorista e a matrícula da viatura antes de pedir o lugar."
					/>
					<Guarantee
						Icon={Banknote}
						title="Paga-se na viatura"
						body="Em dinheiro, ao motorista, no embarque. A Boleia não toca no dinheiro nem guarda meio para caminho."
					/>
				</div>
			</section>

			<div className="mx-auto max-w-6xl px-6 py-16">
				<Prose>
					<Section id="o-que-pedimos" title="O que pedimos, e a quem">
						<P>
							O que cada lado tem de enviar. Um passageiro e um
							motorista não enviam o mesmo, e cada envio vai parar a
							uma revisão diferente.
						</P>

						<Table
							caption="O que cada lado tem de enviar para poder usar a plataforma."
							head={['Quem', 'O que envia', 'Para que serve']}
							rows={[
								[
									'Toda a gente',
									'Número de telefone',
									'Confirmar que o número pertence a quem diz ser. É por ele que entram os códigos de 6 dígitos e as notificações.',
								],
								[
									'Passageiro',
									'Nome completo, número do BI, frente e verso do BI e duas fotografias',
									'Confirmar que há uma pessoa real por trás da conta, e receber pedidos de lugar legítimos.',
								],
								[
									'Motorista',
									'Tudo o que o passageiro envia, mais o número e a validade da carta de condução e a própria carta',
									'Confirmar que a pessoa tem carta para conduzir, e não só uma conta verificada.',
								],
								[
									'Motorista',
									'Marca, modelo, cor, matrícula e número de lugares da viatura',
									'Confirmar que a viatura existe e que tem os lugares que diz ter.',
								],
							]}
						/>

						<Aside>
							O telefone é a única coisa que pedimos a toda a gente, e
							o consentimento para receber novidades é separado e
							opcional. Quem não o aceita pode usar a plataforma na
							mesma — só não recebe os avisos de marketing por
							WhatsApp.
						</Aside>
					</Section>

					<Section
						id="o-que-fazemos"
						title="O que fazemos com os documentos"
					>
						<P>
							Uma pergunta legítima, e a resposta curta é: servem para
							confirmar a identidade. Nada mais.
						</P>

						<UL>
							<LI>
								Não usamos as imagens para treinar nada, nem para
								comparar com uma lista de pessoas desaparecidas.
							</LI>
							<LI>
								{/*
								 * A resposta anterior dizia "o nome e o telefone".
								 * O telefone nunca foi exposto: `listRideBookings`
								 * devolve só `{ id, name }`, e o `RIDE_DETAIL_SELECT`
								 * só tem `driver: { id, name }`. Prometer o telefone
								 * seria descrever uma partilha de dados que o
								 * código não faz.
								 */}
								Não as mostramos a outros passageiros. Quem partilha
								uma viatura vê apenas o nome da outra pessoa, e nada
								mais.
							</LI>
							<LI>
								Não as usamos para decidir se uma pessoa pode voltar
								a usar a plataforma. Isso só acontece se ela for
								banida por incumprimento explícito dos termos.
							</LI>
						</UL>

						<P>
							Uma vez verificada, a pessoa não precisa de enviar os
							documentos de novo. Vão só para a equipa de revisão, que
							é composta por contas com a permissão de rever KYC — os
							papéis de moderador e de administrador no sistema.
						</P>
					</Section>

					<Section id="quem-ve" title="Quem vê o quê">
						<Table
							caption="Quem tem acesso a cada categoria de dados."
							head={['Dados', 'Quem vê']}
							rows={[
								[
									'Nome, apelido e fotografia de perfil',
									'O passageiro e o motorista que partilham a viagem.',
								],
								[
									'Telefone',
									'Ninguém. Nem o motorista, nem o passageiro. Só tu, e a equipa técnica, num incidente.',
								],
								[
									'Nome e matrícula da viatura',
									'Todos os passageiros da boleia.',
								],
								[
									'Fotografias do BI e da carta',
									'Só a equipa de revisão.',
								],
								[
									'Número do BI e da carta',
									'Só a equipa de revisão.',
								],
								[
									'Contactos de emergência',
									'Ninguém. Nem o motorista, nem os passageiros. É um dado de terceiro.',
								],
								[
									'Sessões activas e endereço IP',
									'A pessoa e a equipa técnica, para segurança. A lista de sessões ainda não é mostrada no perfil.',
								],
							]}
						/>

						<P>
							/* * Isto era uma promessa de controlo: "revoga a sessão
							e * muda a senha". O endpoint existe, o ecrã não. Dizer
							* que a gestão de sessões está a caminho vale mais * do
							que uma instrução que a pessoa não consegue * seguir. */
							Ainda não há um ecrã onde possas ver as tuas sessões por
							dispositivo nem revogar cada uma. O que existe é um
							botão para terminar a sessão neste dispositivo. A gestão
							de sessões por dispositivo está a caminho — se não
							reconheceres uma sessão enquanto isso, muda a senha.
						</P>
					</Section>

					<Section id="recusa" title="Quando uma verificação é recusada">
						<P>
							Uma verificação pode ser recusada quando a fotografia
							não é legível, não corresponde ao documento, ou quando o
							mesmo número de documento já está registado noutra
							conta.
						</P>

						<P>
							Nunca é recusada sem razão escrita. O motivo aparece ao
							lado do estado da verificação, e a pessoa pode corrigir
							e reenviar.
						</P>

						<P>
							Um pedido recusado não é perdido: o passageiro continua
							a poder navegar e a ver boleias. O que fica bloqueado é
							reservar lugar — porque uma reserva é um compromisso com
							outra pessoa, e esse compromisso precisa de um nome
							confirmado.
						</P>
					</Section>

					<Section id="quanto-tempo" title="Quanto tempo ficam guardados">
						<Table
							caption="Prazo de eliminação por categoria."
							head={['O quê', 'Durante quanto tempo']}
							rows={[
								[
									'Fotografias que carregaste mas nunca confirmaste',
									'24 horas. Passado esse prazo deixam de contar.',
								],
								[
									'Fotografias que foram apagadas a pedido',
									'30 dias, e depois deixam de existir.',
								],
								[
									'Sessões activas',
									'Até saíres da conta, ou revogares a sessão.',
								],
								[
									'Notificações',
									'Apagam-se quando fechas a conta.',
								],
								[
									'Dados da conta depois de fechares a conta',
									'A conta fica marcada como eliminada e deixa de ser acessível. A anonimização completa ainda não está activa — ver a política de privacidade.',
								],
							]}
						/>

						<P>
							A eliminação completa dos dados pessoais é o que está em
							falta. Está assinalado na{' '}
							<Link
								to="/privacidade"
								className="rounded-sm text-brand-text underline-offset-4 hover:underline"
							>
								política de privacidade
							</Link>{' '}
							e vale a pena conhecê-la antes de te registares.
						</P>
					</Section>

					<Section id="duvidas" title="Dúvidas">
						<P>
							Se tens uma pergunta que este site não responde,
							escreve. Não inventamos resposta para não deixar ninguém
							sem resposta — dizemos que não sabemos.
						</P>

						<P className="flex flex-wrap items-center gap-x-4 gap-y-2">
							<Clock
								size={16}
								aria-hidden="true"
								className="text-muted"
							/>
							<span className="text-muted">
								Respondemos em <Todo />. Se for urgente, o caminho
								mais rápido é o email.
							</span>
						</P>

						<P className="flex flex-wrap items-center gap-x-4 gap-y-2">
							<FileWarning
								size={16}
								aria-hidden="true"
								className="text-muted"
							/>
							<span className="text-muted">
								Cancelling e cobrança indevida:{' '}
								<a
									href="mailto:suporte@boleia.ao"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									suporte@boleia.ao
								</a>
								.
							</span>
						</P>
					</Section>
				</Prose>
			</div>

			<PageCta
				title="Confirma a tua identidade"
				body="Leva um BI e duas fotografias. Demora mais do que criar a conta, e é o que separa uma plataforma de um grupo de WhatsApp."
				primary={{ to: '/app/kyc', label: 'Verificar identidade' }}
				secondary={{ to: '/perguntas', label: 'Ver perguntas' }}
			/>
		</>
	);
}

function Guarantee({
	Icon,
	title,
	body,
}: {
	Icon: typeof IdCard;
	title: string;
	body: string;
}) {
	return (
		<div className="flex gap-4">
			<span
				aria-hidden="true"
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-text"
			>
				<Icon size={19} />
			</span>
			<div>
				<p className="text-label font-medium text-ink">{title}</p>
				<p className="mt-1 text-small text-muted">{body}</p>
			</div>
		</div>
	);
}
