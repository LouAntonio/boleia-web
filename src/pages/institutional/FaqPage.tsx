import { PageHeader, PageCta } from '../../components/layout/legal/PageHeader';
import { FaqList } from '../../components/layout/legal/FaqList';
import type { FaqGroup } from '../../components/layout/legal/FaqList';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * As perguntas, ordenadas por quem as tem.
 *
 * A ordem não é alfabética nem por assunto: é pela ordem em que alguém
 * pergunta. "Como é que reservo" antes de "O que acontece se eu perder o meu
 * BI", porque a primeira é a barreira à entrada e a segunda só aparece depois de
 * já estar dentro.
 *
 * As respostas que dependem de uma decisão comercial estão marcadas com
 * `pending: true` e mostram o campo a amarelo. É mais honesto mostrar que a
 * resposta não está fechada do que dar um prazo inventado que alguém depois
 * não cumpre.
 */
export function FaqPage() {
	usePageMeta(
		'Perguntas frequentes',
		'Como reservar uma boleia, quanto custa, como se paga, o que a Boleia não cobra, e o que acontece quando um pedido não é respondido.',
	);

	return (
		<>
			<PageHeader
				eyebrow="Perguntas frequentes"
				title="As perguntas que chegam sempre."
				description="Se a tua não estiver aqui, escreve. Dizer que não sabemos é melhor do que não responder."
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
				<FaqList groups={GROUPS} />
			</div>

			<PageCta
				title="Não encontraste a tua?"
				body="Escreve para suporte@boleia. Se for sobre uma viagem concreta, diz o dia e a rota — ajuda a responder à primeira."
				primary={{ to: '/contacto', label: 'Falar connosco' }}
				secondary={{ to: '/app/explorar', label: 'Ver as boleias' }}
			/>
		</>
	);
}

const GROUPS: FaqGroup[] = [
	{
		title: 'Para quem viaja',
		items: [
			{
				q: 'Como é que reservo um lugar?',
				a: 'Procuras a rota na página de explorar, abres a boleia, escolhes quantos lugares queres e envias o pedido. O motorista aceita ou recusa — e tu vês a resposta no separador Reservas, e por notificação.',
			},
			{
				q: 'Quanto custa?',
				a: 'O preço é o que o motorista define, por lugar. Vê o valor antes de pedir e não há nada a pagar para reservar.',
			},
			{
				q: 'Como é que se paga?',
				a: 'Em dinheiro, diretamente ao motorista, no momento em que sobes para a viatura. A Boleia não recebe dinheiro, não tem carteira e não cobra nada disso.',
			},
			{
				q: 'A Boleia cobra comissão?',
				a: 'Não. Nem ao passageiro nem ao motorista. O que o passageiro paga é o preço do lugar, e é isso que o motorista recebe.',
			},
			{
				q: 'Posso levar alguém comigo?',
				a: 'Sim. Podes pedir até ao número de lugares que a viatura indicar. Se não houver lugar suficiente para o grupo, o pedido não é aceite.',
			},
			{
				q: 'Posso cancelar?',
				a: 'Sim, a qualquer momento antes de a viagem começar, a partir de Reservas. O lugar volta logo a ficar disponível e, se pagaste algo ao motorista, o cancelamento é resolvido com ele directamente.',
			},
			{
				q: 'E se o motorista não responder ao meu pedido?',
				a: 'O pedido expira sozinho ao fim de 30 minutos. O lugar volta a ficar livre e não precisas de fazer nada.',
			},
			{
				q: 'Consigo ver quem vai conduzir?',
				a: 'Sim. Antes de enviar o pedido, a página da boleia mostra o nome do motorista e a matrícula e o modelo da viatura.',
			},
			{
				q: 'Posso reservar sem ter verificado a identidade?',
				a: 'Podes ver e procurar tudo. Para pedir lugar é preciso ter a identidade verificada, porque a reserva é um compromisso com outra pessoa e precisa de um nome confirmado.',
			},
			{
				q: 'A app web e a app do telemóvel são a mesma conta?',
				a: 'São. Entras com o mesmo número de telefone e vês as mesmas reservas, do telemóvel ou do computador.',
			},
		],
	},

	{
		title: 'Para quem conduz',
		items: [
			{
				q: 'O que preciso para publicar uma boleia?',
				a: 'Ter a identidade de motorista verificada e pelo menos uma viatura verificada. Podes criar a conta e registar a viatura enquanto a revisão não está feita — a publicação é que fica à espera.',
			},
			{
				q: 'Quanto tempo demora a revisão?',
				a: 'Por preencher. Assim que o prazo estiver aqui escrito, podes mostrar a quem quiser.',
				pending: true,
			},
			{
				q: 'Quem escolhe o preço?',
				a: 'Tu. O passageiro vê o valor antes de pedir e paga esse valor a ti, em dinheiro, no dia. A Boleia fica com zero.',
			},
			{
				q: 'Posso recusar um pedido?',
				a: 'Sim. Mas a recusa exige escrever uma razão, e o passageiro vê-a. Sem a razão, o lugar fica tomado por uma pessoa que talvez precisasse dele mais.',
			},
			{
				q: 'E se eu não responder a nenhum pedido?',
				a: 'Passados 30 minutos, os pedidos expiram sozinhos e os lugares voltam a ficar livres. Não perdes nada em não estar a olhar para o ecrã.',
			},
			{
				q: 'Posso cancelar uma boleia já publicada?',
				a: 'Sim. Quem tinha reserva confirmada é avisado de que deixou de haver serviço.',
			},
			{
				q: 'A Boleia garante passageiros?',
				a: 'Não. Ela mostra a tua rota a quem procura e dá-te as ferramentas para gerir quem sobe. Quantas vezes enches a viatura depende de ti.',
			},
			{
				q: 'Quando recebo o dinheiro?',
				a: 'De cada passageiro, em dinheiro, no momento em que ele sobe. O dinheiro nunca passa pela plataforma.',
			},
		],
	},

	{
		title: 'A tua conta',
		items: [
			{
				q: 'Esqueci-me da senha. O que faço?',
				a: 'Na página de entrada, «Esqueci-me da senha». Pedes um código para o teu número, confirmas, e defines uma senha nova.',
			},
			{
				q: 'Onde entro com o Google?',
				a: 'Há um botão na página de entrada e no registo. Se já usas o telemóvel com a Boleia e depois entrares com o Google com outro email, são contas diferentes — é melhor usares sempre o mesmo caminho.',
			},
			{
				/*
				 * A resposta anterior prometia a lista de sessões activas por
				 * dispositivo e a revogação de cada uma. A API tem o endpoint
				 * (`GET /api/sessions`), mas não há ecrã nenhum que o mostre —
				 * o perfil só oferece "Terminar sessão" para este dispositivo.
				 * Descrever o que existe é melhor do que descrever o que não.
				 */
				q: 'Posso ver onde a minha conta está aberta?',
				a: 'Ainda não. Há um botão para terminar a sessão neste dispositivo, no perfil, em Sessão. A lista de sessões por dispositivo e a revogação de cada uma ainda não estão no site — preferimos dizer-te isto a prometer-te um ecrã que não existe.',
			},
			{
				q: 'Como apago a conta?',
				a: 'Ainda não há um botão para isso no site. Escreve para suporte@boleia.ao e pedimos confirmação antes de eliminar seja o que for. A conta fica marcada como eliminada, deixa de ser acessível e todas as sessões são revogadas de imediato.',
			},
			{
				q: 'O que acontece aos meus dados quando apago a conta?',
				a: 'Sessões e notificações apagam-se de imediato. O resto fica marcado como eliminada mas ainda não é apagado nem anonimizado — esse passo ainda não está activo. Está escrito com todos os detalhes na política de privacidade, e vale a pena leres antes de te registares.',
			},
			{
				q: 'Posso levar o meu contacto de emergência?',
				a: 'Podes guardar um, no perfil, para o caso de precisares de ajuda numa viagem. É o nome e o número de uma pessoa. Ninguém na Boleia nem os outros passageiros o veem.',
			},
			{
				q: 'Recebi uma mensagem a pedir os meus dados. É da Boleia?',
				a: 'Não pedimos por telefone nem por WhatsApp códigos, senhas, BI ou photographs. Se alguém te disser que é da Boleia e te pede isso, é burla. Verifica por suporte@boleia.ao.',
			},
		],
	},

	{
		title: 'Sobre a Boleia',
		items: [
			{
				q: 'Funciona noutra cidade além de Luanda?',
				a: 'Depende de haver motoristas a querer partir. Se a tua rota ainda não tem nenhuma boleia publicada, o site diz que não tem e não mostra nada inventado.',
			},
			{
				q: 'O que é uma "bola" e uma "boleia"?',
				a: 'Uma "bola" é a viagem partilhada e os seus lugares. "Boleia" é a viatura. A Boleia é a plataforma que liga as duas coisas.',
			},
			{
				q: 'Quanto tempo demora a responder o suporte?',
				a: 'Por preencher.',
				pending: true,
			},
			{
				q: 'Tem reembolso?',
				a: 'Por preencher. Hoje a Boleia não mexe em dinheiro: o que um passageiro paga a um motorista é entre eles, e qualquer problema é resolvido nessa relação.',
				pending: true,
			},
			{
				q: 'A Boleia é uma transportadora?',
				a: 'Não. Não temos frota, não conduzimos e não somos parte do contrato entre o passageiro e o motorista. Somos o meio entre quem tem lugares e quem os quer.',
			},
		],
	},
];
