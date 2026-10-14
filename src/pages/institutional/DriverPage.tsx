import { Users, Wallet, BadgeCheck } from 'lucide-react';
import { PageHeader, PageCta } from '../../components/layout/legal/PageHeader';
import {
	Prose,
	P,
	Section,
	UL,
	LI,
	Aside,
} from '../../components/layout/legal/Prose';
import { SeatGrid } from '../../components/ui/SeatGrid';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * A página de conversão para quem vai conduzir.
 *
 * Faz um trabalho diferente das outras páginas institucionais. `/sobre` explica,
 * `/privacidade` informa; esta vende. Por isso tem um preço em destaque e
 * termina em duas acções, não em quatro parágrafos.
 *
 * E diz uma coisa que a maioria dos marketplaces nunca diz: **quanto se ganha e
 * quanto se fica com a Boleia.** Uma pessoa que vai conduzir para ganhar dinheiro
 * precisa de saber os dois números antes de se registar, e escondê-los é a forma
 * mais rápida de perder a confiança de quem ia confiar.
 */
export function DriverPage() {
	usePageMeta(
		'Para motoristas',
		'Publica os lugares vazios da tua viatura entre províncias de Angola. Sem comissão, pagamento em dinheiro na viatura, e decides tu quem sobe.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Para motoristas"
				title="A tua viatura tem lugares vazios."
				description="Podes enche-los com quem viaja para o mesmo lado, pelo mesmo dia."
			/>

			{/* O ganho, antes da explicação. */}
			<section className="border-b border-line bg-surface">
				<div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
					<Fact
						Icon={Wallet}
						term="O que ganhas"
						detail="Os lugares que vendes vezes o preço que tu defines, por lugar. Tu escolhes o preço."
					/>
					<Fact
						Icon={Users}
						term="O que ficas"
						detail="Tudo. Hoje a Boleia não cobra comissão nenhuma — não há taxa escondida no valor do lugar."
					/>
					<Fact
						Icon={BadgeCheck}
						term="Quem decide"
						detail="Tu. Vês o nome de cada passageiro, e aceitas, recusas ou cancelas quando quiseres."
					/>
				</div>
			</section>

			<div className="mx-auto max-w-6xl px-6 py-16">
				<Prose>
					<Section id="como-funciona" title="Como funciona">
						<OL_STEPS />
					</Section>

					<Section
						id="o-que-precisas"
						title="O que precisas antes de publicar"
					>
						<P>
							Duas coisas, e ambas passam por revisão de uma pessoa da
							equipa:
						</P>

						<UL>
							<LI>
								<strong className="text-ink">
									Identidade de motorista verificada.
								</strong>{' '}
								Nome completo e número do BI. Sem isto o teu perfil
								aparece como «Motorista» e o passageiro não sabe com
								quem vai.
							</LI>
							<LI>
								<strong className="text-ink">
									Pelo menos uma viatura verificada.
								</strong>{' '}
								Marca, modelo, cor e matrícula. Só podes publicar
								com uma viatura que já passou.
							</LI>
						</UL>

						<P>
							A verificação é feita por uma equipa, e demora um tempo
							que ainda não conseguimos prometer. Podes criar a conta
							e registar a viatura enquanto isso — só a publicação
							fica à espera.
						</P>

						<Aside>
							Se preferes ir só como passageiro, não precisas de nada
							disto. A conta é a mesma e a verificação de passageiro é
							mais leve.
						</Aside>
					</Section>

					<Section
						id="os-lugares"
						title="O que vês quando um passageiro pede"
					>
						<P>
							Vês quantos lugares quer, quanto vai pagar em dinheiro,
							e podes aceitar ou recusar. Recusar exige escrever a
							razão — que o passageiro vê. É mais trabalho para ti e é
							o que impede que «não» seja a resposta mais rápida e
							mais comum.
						</P>

						<P>
							Se não responderes em 30 minutos, o pedido expira
							sozinho e o lugar volta a ficar disponível. Não tens de
							estar a olhar para o ecrã.
						</P>

						{/*
						 * A mesma grelha de lugares que aparece na app. Mostrar a
						 * ferramenta aqui, antes de falar dela, é mais claro do que
						 * descrevê-la em texto e deixar a pessoa à procura dela
						 * quando chegar ao painel.
						 */}
						<div className="mt-6 flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:gap-10">
							<SeatGrid total={8} taken={5} showLabel={false} />
							<div className="min-w-0">
								<p className="text-label font-medium text-ink">
									5 de 8 lugares vendidos
								</p>
								<p className="mt-1 text-small text-muted">
									Um quadrado cheio é um lugar que já tem nome. Um
									quadrado com contorno está livre — e é esse que
									aparece primeiro a quem procura.
								</p>
							</div>
						</div>
					</Section>

					<Section id="o-pagamento" title="Como se paga">
						<P>
							Em dinheiro, na viatura, na hora do embarque. A Boleia
							não toca nele e não recebe comissão. Nem agora, nem no
							futuro próximo sem que isto mude e te seja dito.
						</P>

						<P>
							Isto significa que o risco também é teu: se um
							passageiro não pagar depois de subir, o que perdes és
							tu. Por isso o painel só mostra um pedido depois de a
							pessoa ter identidade verificada — e vê-la antes de
							aceitar é meio caminho feito.
						</P>
					</Section>

					<Section id="termos" title="O que te fica a dever a Boleia">
						<UL>
							{/*
							 * "Despublicar" era uma promessa sem botão: não existe
							 * `DELETE /api/rides/:id`, e cancelar é outra coisa —
							 * encerra a corrida e avisa quem tinha reserva.
							 *
							 * O nome do passageiro e a identidade verificada são
							 * verdade desde o Sprint 1: `listRideBookings` devolve
							 * `passenger: { id, name }`, e o painel do motorista
							 * mostra-o.
							 */}
							<LI>
								Corrigir ou cancelar uma boleia já publicada. Os
								passageiros com reserva confirmada são avisados de
								que ficou sem serviço.
							</LI>
							<LI>Ver o nome de quem pede antes de decidir.</LI>
							<LI>
								Cancelar uma boleia já publicada. Os passageiros com
								reserva confirmada são avisados de que ficou sem
								serviço.
							</LI>
							<LI>
								Saber que a tua identidade e a da tua viatura estão
								verificadas, e que isso aparece ao passageiro.
							</LI>
						</UL>

						<P>
							E o que não te fica: não garantimos lugares cheios, nem
							um ganho mínimo. A plataforma dá-te quem procura a tua
							rota; quem decide com que frequência enches a viatura és
							tu.
						</P>
					</Section>
				</Prose>
			</div>

			<PageCta
				title="Começa por um dia"
				body="Publica uma rota que conheças bem. Vê como corre, e depois repete nas outras."
				primary={{ to: '/criar-conta', label: 'Criar conta de motorista' }}
				secondary={{ to: '/app/viaturas', label: 'Registar a viatura' }}
			/>
		</>
	);
}

const STEPS = [
	{
		title: 'Regista a conta com o teu número',
		body: 'O telemóvel é a conta. Confirmas o número com um código de 6 dígitos que chega por WhatsApp.',
	},
	{
		title: 'Verifica a identidade e a viatura',
		body: 'Nome e BI, as fotografias do documento, e a marca, modelo e matrícula da viatura. A equipa revê.',
	},
	{
		title: 'Publica a rota',
		body: 'Escolhes de onde para onde, o dia, a hora de saída, os lugares e o preço por lugar.',
	},
	{
		title: 'Decides quem sobe',
		body: 'Os pedidos chegam ao teu painel. Aceitas, recusas com uma razão, ou deixas expirar.',
	},
	{
		title: 'Pegas o dinheiro na estrada',
		body: 'Cada passageiro paga-te o lugar em dinheiro, no momento em que sobe. Sem comissão, sem intermediário.',
	},
];

function OL_STEPS() {
	return (
		<ol className="mt-5 flex list-decimal flex-col gap-5 pl-5 marker:font-medium marker:text-muted">
			{STEPS.map((step) => (
				<li key={step.title} className="pl-1">
					<p className="font-medium text-ink">{step.title}</p>
					<p className="mt-1 text-muted">{step.body}</p>
				</li>
			))}
		</ol>
	);
}

function Fact({
	Icon,
	term,
	detail,
}: {
	Icon: typeof Wallet;
	term: string;
	detail: string;
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
				<p className="text-label font-medium text-ink">{term}</p>
				<p className="mt-1 text-small text-muted">{detail}</p>
			</div>
		</div>
	);
}
