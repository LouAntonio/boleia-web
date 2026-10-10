import { Link } from 'react-router-dom';
import { PageHeader, PageCta } from '../../components/layout/legal/PageHeader';
import {
	Prose,
	P,
	Section,
	UL,
	LI,
	Aside,
} from '../../components/layout/legal/Prose';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * Porquê a Boleia existe.
 *
 * A página responde a três perguntas, pela ordem em que alguém as tem: o que
 * está errado, o que é que isto faz, e o que é que isto **não** faz.
 *
 * A terceira é a que quase ninguém escreve. Sair daqui à espera de
 * arranjar transporte e descobrir que não é o que se pensava é pior do
 * que ficar na estrada a fazer contas ao combustível.
 */
export function AboutPage() {
	usePageMeta(
		'Sobre',
		'Porque é que as boleias saem de Luanda com metade dos lugares vazios, e o que a Boleia faz sobre isso. O que o serviço é, e o que não é.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Sobre"
				title="Os lugares vazios custam dinheiro a quem conduz."
				description="A Boleia existe para os preencher. É isso, e é só isso."
			/>

			<div className="mx-auto max-w-6xl px-6 py-16">
				<Prose>
					<Section id="o-problema" title="O problema">
						<P>
							Uma boleia parte de Luanda às seis da manhã para
							Benguela. Tem oito lugares. Vão três. O combustível é do
							motorista, e o motorista não é alguém que faz isto por
							hobby: ele não pode vender lugares ao longo da estrada,
							e a estrada não espera por ele.
						</P>

						<P>
							Do outro lado, alguém precisa de ir para Benguela e não
							conhece ninguém que vá. O que existe hoje é um grupo de
							WhatsApp por viagem, uma mensagem de «alguém vai?», e a
							expectativa de que a pessoa que responde seja mesmo quem
							diz ser e de que a viatura esteja em condições.
						</P>

						<Aside>
							A Boleia não inventa o problema. O que faz é dar-lhe uma
							forma: publicar os lugares, e decidir com quem os enche.
						</Aside>
					</Section>

					<Section id="o-que-fazemos" title="O que fazemos">
						<P>
							Se és motorista, registas a tua viatura, defines a rota,
							o dia, o preço por lugar e quantos lugares queres
							vender. Vês os pedidos e decides quem sobe.
						</P>

						<P>
							Se és passageiro, vês o que sai, com o preço e os
							lugares que ainda há, e pedes o lugar que precisas. Vês
							quem vai conduzir e que viatura é, antes de pagares.
						</P>

						<P>
							Nenhum dos dois fica à espera de alguém decidir. O
							pedido expira se o motorista não responder em 30
							minutos, e o lugar volta a ficar livre para outra
							pessoa.
						</P>
					</Section>

					<Section id="o-que-nao-e" title="O que a Boleia não é">
						<P>
							Isto é a parte que quase ninguém escreve, e é a que mais
							importa. É melhor alguém fechar esta página do que sair
							daqui com uma ideia errada.
						</P>

						<UL>
							<LI>
								<strong className="text-ink">
									Não somos uma transportadora.
								</strong>{' '}
								Não temos frota, não conduzimos e não somos parte do
								contrato entre ti e quem vai conduzir. Esse contrato
								é contigo e com o motorista.
							</LI>
							<LI>
								<strong className="text-ink">
									Não alugamos viaturas.
								</strong>{' '}
								A tua viatura continua tua. O que fazemos é dizer-te
								quem a quer usar.
							</LI>
							<LI>
								<strong className="text-ink">
									Não transportamos carga.
								</strong>{' '}
								Um lugar é um lugar.
							</LI>
							<LI>
								<strong className="text-ink">
									Não cobrimos procura.
								</strong>{' '}
								Se a rota que precisas não tem nenhuma boleia
								publicada, não a inventamos. O site escreve que não
								há.
							</LI>
						</UL>
					</Section>

					<Section
						id="a-confianca"
						title="Porque é que pedimos documentos"
					>
						<P>
							Reservar um lugar numa boleia com alguém que não
							conheces é, no mejor caso, inconveniência. No pior, é
							risco — de um telefone, de um nome falso, de uma viatura
							que não arranca.
						</P>

						<P>
							Por isso, antes de qualquer pessoa poder reservar ou
							vender lugares, confirma a identidade. Isso custa-te um
							BI e duas fotografias, e é a única barreira entre ti e o
							resto da plataforma.
						</P>

						<P>
							Está explicado passo a passo na{' '}
							<Link
								to="/seguranca"
								className="rounded-sm text-brand-text underline-offset-4 hover:underline"
							>
								página de segurança
							</Link>
							.
						</P>
					</Section>
				</Prose>
			</div>

			<PageCta
				title="Duas maneiras de entrar"
				body="Se precisas de ir, procura a tua boleia. Se tens lugares vazios, publica-os."
				primary={{ to: '/app/explorar', label: 'Procurar uma boleia' }}
				secondary={{ to: '/motoristas', label: 'Quero conduzir' }}
			/>
		</>
	);
}
