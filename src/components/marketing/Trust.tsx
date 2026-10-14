import { BadgeCheck, BusFront, IdCard, PhoneCall, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/*
 * A confiança.
 *
 * Quatro regras do produto, ditas como regras e não como certificação. "Stripe
 * certified" e "SOC2 compliant" são carimbos que uma pessoa não sabe
 * verificar; "a tua identidade é verificada antes de publicares uma boleia" é
 * uma coisa que dá para conferir e dá para cobrar.
 *
 * O `laterite` está reservado a avisos por uma regra do projecto, por isso aqui
 * não há cor de destaque a mais — só o azul da marca e o cinza do texto.
 */
const GUARANTEES = [
	{
		Icon: IdCard,
		title: 'Identidade verificada',
		body: 'Quem entra confirma o telefone. Quem conduz envia o BI e uma fotografia, e fica à espera de revisão antes de aparecer como motorista.',
	},
	{
		Icon: BusFront,
		title: 'Viatura verificada',
		body: 'Cada viatura é registada com marca, modelo e matrícula, e passa por revisão antes de a pessoa poder vender lugares.',
	},
	{
		Icon: BadgeCheck,
		title: 'Quem viaja, vê com quem',
		body: 'O nome do motorista e a matrícula da viatura aparecem no detalhe da boleia. Não é um génio desconhecido ao volante.',
	},
	{
		Icon: PhoneCall,
		title: 'Paga-se na viatura',
		body: 'Em dinheiro, ao motorista, na hora do embarque. Não há carteira no telemóvel nem pagamento por outra pessoa.',
	},
];

export function Trust() {
	return (
		<section
			id="confianca"
			className="scroll-mt-20 border-b border-line bg-surface"
		>
			<div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
				<header className="max-w-2xl">
					<h2 className="text-h2 text-ink">O que há de garantido</h2>
					<p className="mt-3 text-body text-muted">
						Isto não é uma promessa de marketing. São quatro regras que
						o servidor impõe, e que uma pessoa pode cobrar.
					</p>
				</header>

				<ul className="mt-14 grid gap-8 sm:grid-cols-2">
					{GUARANTEES.map(({ Icon, title, body }) => (
						<li key={title} className="flex gap-4">
							<span
								aria-hidden="true"
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-text"
							>
								<Icon size={19} />
							</span>
							<div>
								<h3 className="text-h3 text-ink">{title}</h3>
								<p className="mt-1.5 text-body text-muted">
									{body}
								</p>
							</div>
						</li>
					))}
				</ul>

				{/*
				 * A secção diz que as quatro coisas são verdade; a página diz como
				 * se confirma e o que se guarda. Sem este link, alguém que lê a
				 * landing e fica na dúvida fica na dúvida.
				 */}
				<Link
					to="/seguranca"
					className="mt-10 inline-flex items-center gap-1.5 rounded-sm text-label font-medium text-brand-text underline-offset-4 hover:underline"
				>
					Como isto se confirma
					<ArrowRight size={16} aria-hidden="true" />
				</Link>
			</div>
		</section>
	);
}
