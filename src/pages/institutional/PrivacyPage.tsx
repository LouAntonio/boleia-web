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
 * A política de privacidade.
 *
 * Este documento é diferente de qualquer outro do site: quase tudo o que está
 * escrito aqui **pode ser verificado lendo o código**. A lista de dados não saiu
 * de uma boa prática genérica — saiu do `schema.prisma`. Os prazos saíram das
 * variáveis que o backend lê. E onde o sistema não faz o que uma boa política
 * devia fazer, isso está escrito com o mesmo peso do resto.
 *
 * Três coisas merecem ser ditas antes de o texto começar, porque são as que um
 * revisor jurídico vai procurar primeiro e porque são as que uma pessoa devia
 * poder ler antes de entregar o BI:
 *
 * 1. **A eliminação de conta não anonimiza nada.** Marca a conta como
 *    eliminada, revoga as sessões e apaga as notificações. O resto fica, à
 *    espera de um passo de retenção que ainda não está escrito.
 * 2. **Não há exportação de dados.** É um direito que a Lei nº 22/11 prevê e que
 *    este sistema não implementa.
 * 3. **Há transferência internacional.** As fotografias vão para o Cloudinary e
 *    os códigos de verificação saem por WhatsApp. Nenhum dos dois está em Angola.
 *
 * A lei em vigor é a nº 22/11, de 17 de Junho. Está em revisão — há um projecto
 * publicado para consulta pública desde Março de 2025 — e por isso este texto
 * vai precisar de ser revisto quando a nova entrar em vigor.
 */
export function PrivacyPage() {
	usePageMeta(
		'Política de privacidade',
		'Que dados a Boleia guarda, para quê, quem os vê e durante quanto tempo. Escrita a partir do que o sistema faz de facto, e segundo a Lei nº 22/11 de 17 de Junho.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Privacidade"
				title="Que dados guardamos, e o que fazemos com eles."
				description="Escrito a partir do que o sistema faz de facto — não a partir de uma boa prática genérica. Onde a coisa ainda não está feita, diz-se."
			/>

			<div className="mx-auto max-w-6xl px-6 py-14">
				<DraftNotice missing={6} />

				<div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
					<DocIndex items={INDEX} />

					<Prose>
						<Section
							id="responsavel"
							title="Quem é o responsável pelo tratamento"
						>
							<P>
								O responsável pelo tratamento, na sentido da Lei nº
								22/11, é a entidade que opera esta plataforma:{' '}
								<Todo />, com o número de identificação <Todo /> e
								sede em <Todo />.
							</P>

							<P>
								Para qualquer assunto relativo a dados pessoais —
								acesso, rectificação, apagamento, oposição ou
								reclamação — o contacto é{' '}
								<a
									href="mailto:suporte@boleia.ao"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									suporte@boleia.ao
								</a>
								.
							</P>
						</Section>

						<Section id="o-que-guardamos" title="O que guardamos">
							<P>
								Esta lista não é uma Kategorias de formulário. Cada
								linha corresponde a dados que existem no sistema de
								informação.
							</P>

							<Table
								caption="Todos os dados pessoais tratados pela Boleia, por categoria."
								head={['Dados', 'Quem os dá', 'Para que servem']}
								rows={[
									[
										'Nome, apelido, email e telefone',
										'Toda a gente',
										'Criar a conta e conseguir entrar. O telefone é a identidade: quem entra, entra com o número.',
									],
									[
										'Fotografia e texto de apresentação',
										'A pessoa, se quiser',
										'Aparecer na reserva com um nome em vez de um número. Tudo opcional.',
									],
									[
										'Endereço IP e tipo de dispositivo',
										'O sistema, sozinho',
										'Segurança da conta: detectar acessos e sessões. É registado automaticamente em cada entrada.',
									],
									[
										'Fotografias do BI, duas fotografias tuas, e a carta de condução',
										'Quem se verifica',
										'Confirmar que há uma pessoa real por trás da conta, e que tem carta para conduzir, se for publicar.',
									],
									[
										'Número do BI e número da carta',
										'Quem se verifica',
										'O mesmo. E impedir que o mesmo documento seja usado em duas contas.',
									],
									[
										'Marca, modelo, cor, matrícula e lugares da viatura',
										'O motorista',
										'Confirmar que a viatura existe e tem os lugares que diz ter. Aparece ao passageiro.',
									],
									[
										'Rotas, horários, lugares reservados e valores',
										'O motorista e o passageiro',
										'Fazer a reserva. Sem isto não há boleia.',
									],
									[
										'Nome e telefone do contacto de emergência',
										'Uma terceira pessoa',
										'Ter a quem avisar se precisares de ajuda numa viagem. Não é mostrado a mais ninguém.',
									],
									[
										'Token de notificações do dispositivo',
										'O sistema',
										'Enviar-te avisos de reservas no telemóvel. É um identificador do aparelho, não da conta.',
									],
									[
										'Número de telefone e código de verificação',
										'O sistema',
										'Entrar e recuperar a senha. O código nunca é guardado em texto simples — só a sua impressão digital.',
									],
									[
										'Conteúdo das mensagens com o suporte',
										'Quem escreve',
										'Responder. Vem por email, e não fica num sistema nosso.',
									],
								]}
							/>

							<Aside>
								O contacto de emergência é o único bloco de dados
								que uma pessoa fornece e não é dela. Se a puseres,
								deves avisar essa pessoa de que o número dela fica
								guardado.
							</Aside>
						</Section>

						<Section
							id="fundamento"
							title="Em que nos apoiamos para tratar cada um"
						>
							<P>
								A Lei nº 22/11 permite tratar dados com base no
								consentimento, na execução de um contrato, no
								cumprimento de uma obrigação legal, ou no legítimo
								interesse do responsável — desde que este não
								prevaleça sobre os seus direitos.
							</P>

							<UL>
								<LI>
									<strong className="text-ink">Contrato.</strong>{' '}
									Os dados da conta, as rotas, as reservas e o
									preço existem para que a viagem marcada possa
									acontecer. Sem eles não há serviço para usar.
								</LI>
								<LI>
									<strong className="text-ink">
										Consentimento.
									</strong>{' '}
									Os documentos de identidade e de viatura.
									Pede-se consentimento explícito, e podes
									retirá-lo apagando a conta.
								</LI>
								<LI>
									<strong className="text-ink">
										Obrigação legal.
									</strong>{' '}
									Os registos de verificação de identidade podem
									ter de ser conservados por um prazo mínimo, por
									causa das regras de identificação de prestadores
									de serviço de transporte. <Todo />
								</LI>
								<LI>
									<strong className="text-ink">
										Legítimo interesse.
									</strong>{' '}
									O endereço IP e o tipo de dispositivo, para
									manter a conta O endereço IP e o tipo de
									dispositivo, para manter a conta segura e
									detectar acessos suspeitos.
								</LI>
								<LI>
									<strong className="text-ink">
										Consentimento separado.
									</strong>{' '}
									As novidades sobre rotas e preços, por WhatsApp.
									É a única comunicação promocional, e podes
									desligá-la sem perder nada de funcionalidades.
								</LI>
							</UL>
						</Section>

						<Section id="quem-ve" title="Quem vê os teus dados">
							<P>Três grupos, e só três.</P>

							<UL>
								<LI>
									<strong className="text-ink">
										Os outros lados da tua reserva.
									</strong>{' '}
									O passageiro vê o nome e o telefone do motorista
									e a matrícula da viatura. O motorista vê o nome
									e o telefone de quem reservou, e a reserva. É o
									mínimo para que uma viagem marcada funcione.
								</LI>
								<LI>
									<strong className="text-ink">
										A equipa de revisão.
									</strong>{' '}
									As pessoas com permissão de rever documentos de
									identidade e viaturas vêem as fotografias, o
									número do BI e o número da carta. É a única
									coisa para que estão autorizadas.
								</LI>
								<LI>
									<strong className="text-ink">
										A equipa técnica, quando é necessário.
									</strong>{' '}
									Para resolver um problema técnico ou responder a
									uma exigência legal.
								</LI>
							</UL>

							<P>
								Não vendemos dados pessoais. Não os usamos para
								publicidade. Não os partilhamos com redes de
								anúncios.
							</P>
						</Section>

						<Section id="terceiros" title="Serviços de terceiros">
							<P>
								Três serviços externos participam. Dois deles
								transferem dados pessoais para fora de Angola, e
								isso é uma responsabilidade nossa, não deles.
							</P>

							<Table
								caption="Terceiros que recebem dados pessoais e o motivo."
								head={['Serviço', 'Que dados', 'Onde']}
								rows={[
									[
										'Cloudinary',
										'Fotografias de BI, de viatura, da carta e as tuas duas fotografias. Recebem-nas no momento do envio e guardam-nas.',
										'Fora de Angola. Empresa sujeita ao seu próprio regime de protecção de dados.',
									],
									[
										'WhatsApp',
										'O teu número de telefone e o código de verificação de 6 dígitos. Recebem-os para os te entregar.',
										'Fora de Angola.',
									],
									[
										'Resend',
										'O teu endereço de email, quando há alguma notificação.',
										'Fora de Angola.',
									],
									[
										'Google',
										'Email e nome, se entrares com a tua conta Google.',
										'Fora de Angola.',
									],
									[
										'Postgres',
										'Todos os dados da tabela acima.',
										'Nos servidores que a Boleia utiliza. A localização está por definir.',
									],
								]}
							/>

							<P>
								Ao usares a Boleia, os teus documentos de identidade
								chegam ao Cloudinary e o teu número de telefone
								chega ao WhatsApp. Isso é uma transferência de dados
								para fora do país e está sujeito à obrigação de
								comunicação à Agência de Protecção de Dados.{' '}
								<Todo />
							</P>
						</Section>

						<Section id="prazos" title="Quanto tempo guardamos">
							<P>
								A Lei nº 22/11 obriga a conservar só enquanto a
								finalidade se mantiver de pé. Passada essa altura,
								os dados apagam-se ou anonimizam-se.
							</P>

							<Table
								caption="Prazos de conservação por categoria."
								head={['O quê', 'Prazo']}
								rows={[
									[
										'Fotografias enviadas que nunca foram confirmadas',
										'24 horas.',
									],
									[
										'Fotografias que foram apagadas',
										'30 dias, e depois deixam de existir.',
									],
									[
										'Sessões',
										'Até saíres da conta ou revogares a sessão.',
									],
									[
										'Notificações',
										'Apagam-se quando fechas a conta.',
									],
									[
										'Documentos de identidade',
										<Todo key="kyc" />,
									],
									[
										'Histórico de viagens e reservas',
										<Todo key="viagens" />,
									],
									[
										'Registos de verificação',
										<Todo key="auditoria" />,
									],
								]}
							/>

							<P className="text-alert">
								Uma coisa que esta política diz com clareza:{' '}
								<strong className="font-medium">
									fechar a conta hoje não apaga os teus dados.
								</strong>{' '}
								O pedido de eliminação marca a conta como eliminada,
								baneia o acesso e revoga todas as sessões. O nome, o
								email, o telefone, o BI e as fotografias continuam
								guardados, à espera de um passo de anonimização
								automática que ainda não foi construído.
							</P>

							<P>
								Isto está escrito aqui porque tens direito a sabê-lo
								antes de me entregares um BI, e porque um sistema
								que promete apagar e não apaga é pior do que um
								sistema que nunca prometeu.
							</P>
						</Section>

						<Section id="direitos" title="Os teus direitos">
							<P>
								A Lei nº 22/11 reconhece-te o direito a saber o que
								a Boleia tem sobre ti, a corrigir, a pedir o
								apagamento e a opor-te. O que cada um deles
								significa na prática, e se está feito:
							</P>

							<Table
								caption="Direitos do titular e o estado da sua implementação."
								head={['Direito', 'Como se exerce', 'Estado']}
								rows={[
									[
										'Informação e acesso',
										'Na página de perfil vê os teus dados e as sessões activas de cada dispositivo. Para o resto, escreve para suporte@boleia.ao.',
										'Existe',
									],
									[
										'Rectificação',
										'Na página de perfil, separador Perfil. Alteras o nome, o apelido e o telefone.',
										'Existe',
									],
									[
										'Apagamento',
										'Na página de perfil. Vê a secção anterior: o apagamento ainda não é completo.',
										'Parcial',
									],
									[
										'Portabilidade',
										'Espira receber uma cópia dos teus dados num formato legível por máquina.',
										'Não existe',
									],
									[
										'Oposição',
										'Para o tratamento que se baseia no legítimo interesse, escrevas para suporte@boleia.ao. Para o marketing, basta desligar a opção na conta.',
										'Existe',
									],
								]}
							/>

							<P>
								A portabilidade é o que falta. É um direito que a
								lei prevê e que este sistema não implementa, e
								dizê-lo é mais útil do que fingir que a direcção de
								perfil é uma exportação.
							</P>
						</Section>

						<Section id="automaticas" title="Decisões automáticas">
							<P>
								A Boleia usa duas decisões automáticas, e nenhuma
								delas é sobre uma pessoa.
							</P>

							<UL>
								<LI>
									<strong className="text-ink">
										A ordenação da lista de boleias.
									</strong>{' '}
									Por hora de partida, por preço ou por número de
									lugares, conforme escolheres. Não há nenhuma
									avaliação tua por trás disto: não há perfil, não
									há pontuação de risco.
								</LI>
								<LI>
									<strong className="text-ink">
										A verificação automática de documentos.
									</strong>{' '}
									Um documento ilegível ou um número de BI já
									usado noutra conta chumbam automaticamente,
									antes de alguém olhar. O resto passa por uma
									pessoa.
								</LI>
							</UL>

							<Aside>
								Nenhuma reserva é recusada por um sistema. Quem
								decide se um pedido de lugar sobe para a viatura é o
								motorista, que é uma pessoa.
							</Aside>
						</Section>

						<Section id="menores" title="Menores de idade">
							<P>
								A Boleia é para maiores de 18 anos. Não é um serviço
								de transporte escolar, e não aceita criar contas a
								menores. <Todo />
							</P>
						</Section>

						<Section id="seguranca" title="Como protegemos isto">
							<P>
								As senhas nunca são guardadas em texto simples — só
								a sua impressão digital, com um método de que só o
								sistema tem a chave. As sessões expiram, e podes
								revogar qualquer uma. Os códigos de verificação
								expiram em 5 minutos e não podem ser reusados.
							</P>

							<P>
								Nenhum sistema é à prova de tudo. Se suspeitares que
								a tua conta foi comprometida, muda a senha, revoga
								as sessões e{' '}
								<a
									href="mailto:suporte@boleia.ao"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									escreve-nos
								</a>
								.
							</P>
						</Section>

						<Section
							id="reclamar"
							title="Se não gostares de como isto é feito"
						>
							<P>
								Primeiro escreve para nós. Se a resposta não chegar,
								ou se não for a que esperavas, tens o direito de
								reclamar para a Agência de Protecção de Dados de
								Angola — e esse caminho é nosso, não teu.
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
	{ id: 'responsavel', label: 'Quem é o responsável' },
	{ id: 'o-que-guardamos', label: 'O que guardamos' },
	{ id: 'fundamento', label: 'Em que nos apoiamos' },
	{ id: 'quem-ve', label: 'Quem vê os teus dados' },
	{ id: 'terceiros', label: 'Serviços de terceiros' },
	{ id: 'prazos', label: 'Quanto tempo guardamos' },
	{ id: 'direitos', label: 'Os teus direitos' },
	{ id: 'automaticas', label: 'Decisões automáticas' },
	{ id: 'menores', label: 'Menores de idade' },
	{ id: 'seguranca', label: 'Como protegemos isto' },
	{ id: 'reclamar', label: 'Reclamações' },
];
