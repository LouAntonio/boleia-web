import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Clock, Scale } from 'lucide-react';
import { PageHeader } from '../../components/layout/legal/PageHeader';
import { Prose, P, Section } from '../../components/layout/legal/Prose';
import { Todo } from '../../components/layout/legal/LegalDoc';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * O mesmo endereço que o backend já publica.
 *
 * `suporte@boleia.ao` não é um contacto inventado: é o mesmo valor que o
 * `SUPPORT_EMAIL` do backend mete nos contactos do `/docs`. Duas páginas de
 * contacto com dois endereços diferentes é o tipo de coisa que ninguém nota
 * durante um mês e depois custa uma semana de support tickets perdidos.
 */

export function ContactPage() {
	usePageMeta(
		'Contacto',
		'Como falar com a Boleia. Email de suporte, formulário, e onde procurar antes de escrever. Também sobre os teus dados pessoais e sobre reclamações.',
	);

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [assunto, setAssunto] = useState('');
	const [mensagem, setMensagem] = useState('');
	const [erro, setErro] = useState<string | null>(null);

	/**
	 * O formulário não vai ao servidor: monta um `mailto:`.
	 *
	 * Um endpoint novo seria um ficheiro de fila, um template de email, uma
	 * protecção contra spam e mais uma coisa para manter. Um `mailto:` abre o
	 * cliente que a pessoa já tem instalado, não guarda nada no servidor e não
	 * funciona se o endereço de quem escreve estiver errado — que é
	 * precisamente o que se quer, porque o email é o que fica com quem tem o
	 * assunto na mão.
	 */
	function abrirClienteDeEmail(event: React.FormEvent) {
		event.preventDefault();

		if (!email.trim() || !mensagem.trim()) {
			setErro('Preenche o teu email e a mensagem.');
			return;
		}

		const corpoFinal = encodeURIComponent(
			[
				`De: ${name.trim() || 'quem escreve'}`,
				'',
				mensagem.trim(),
				'',
				'---',
				'Enviado pelo formulário do boleia.ao',
			].join('\n'),
		);

		// O assunto começa por `Boleia` para o email chegar identificável em
		// qualquer lista, e não como "Sem assunto" losto numa caixa de entrada.
		const linhaAssunto = [
			'Boleia',
			assunto.trim() ? `— ${assunto.trim()}` : '— contacto pelo site',
		].join(' ');

		window.location.href = `mailto:suporte@boleia.ao?subject=${encodeURIComponent(
			linhaAssunto,
		)}&body=${corpoFinal}`;
	}

	return (
		<>
			<PageHeader
				eyebrow="Contacto"
				title="Fala connosco."
				description="Uma pessoa lê o que escreves. Não há bot e não há resposta automática."
			/>

			<section className="border-b border-line bg-surface">
				<div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
					<Channel
						Icon={Mail}
						term="Email"
						detail="suporte@boleia.ao"
						href="mailto:suporte@boleia.ao"
					/>
					<Channel Icon={Clock} term="Respondemos em" detail={<Todo />} />
					<Channel
						Icon={MessageSquare}
						term="Antes de escrever"
						detail={
							<Link
								to="/perguntas"
								className="rounded-sm text-brand-text underline-offset-4 hover:underline"
							>
								As perguntas frequentes
							</Link>
						}
					/>
				</div>
			</section>

			<div className="mx-auto max-w-6xl px-6 py-16">
				<div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
					{/* O formulário. */}
					<div>
						<h2 className="text-h3 text-ink">Escreve-nos</h2>
						<P className="mt-2 text-muted">
							O formulário abre o teu programa de email com a mensagem
							já escrita. Tu decides se envias, podes reler antes, e a
							mensagem fica no teu histórico.
						</P>

						<form
							onSubmit={abrirClienteDeEmail}
							noValidate
							className="mt-8 flex max-w-lg flex-col gap-4"
						>
							<Field
								label="Como te chamas"
								value={name}
								onChange={(event) => setName(event.target.value)}
								autoComplete="name"
								placeholder="Opcional"
								disabled={false}
							/>

							<Field
								label="Teu email"
								type="email"
								value={email}
								onChange={(event) => {
									setEmail(event.target.value);
									setErro(null);
								}}
								autoComplete="email"
								placeholder="para te respondermos"
								required
							/>

							<Field
								label="Assunto"
								value={assunto}
								onChange={(event) => setAssunto(event.target.value)}
								placeholder="Reserva, pagamento, conta…"
							/>

							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="mensagem"
									className="text-label text-ink"
								>
									Mensagem
								</label>
								<textarea
									id="mensagem"
									value={mensagem}
									onChange={(event) => {
										setMensagem(event.target.value);
										setErro(null);
									}}
									rows={6}
									required
									placeholder="O que aconteceu, o que esperavas, o que fizeste."
									className="rounded-md border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted focus:border-brand"
								/>
							</div>

							{erro ? (
								<p role="alert" className="text-small text-alert">
									{erro}
								</p>
							) : null}

							<div className="pt-1">
								<Button type="submit" size="lg">
									Abrir no meu email
								</Button>
							</div>

							<p className="text-small text-muted">
								Ou escreve directamente para{' '}
								<a
									href="mailto:suporte@boleia.ao"
									className="rounded-sm text-brand-text underline-offset-4 hover:underline"
								>
									suporte@boleia.ao
								</a>
								.
							</p>
						</form>
					</div>

					{/* O resto das perguntas, que não são de suporte. */}
					<aside className="flex flex-col gap-8">
						<Prose className="max-w-none">
							<Section id="dados" title="Os teus dados pessoais">
								<P className="mt-0 text-small">
									Para pedir acesso, rectificação, apagamento ou
									para reclamar de como tratámos os teus dados, o
									mesmo endereço serve. Vê a{' '}
									<Link
										to="/privacidade"
										className="rounded-sm text-brand-text underline-offset-4 hover:underline"
									>
										política de privacidade
									</Link>{' '}
									para o que existe e o que ainda não existe.
								</P>
							</Section>

							<Section id="reclamacoes" title="Reclamação formal">
								<P className="mt-0 text-small">
									Um problema com um passageiro ou com um
									motorista resolve-se primeiro entre as duas
									partes — a Boleia não é parte desse contrato. Se
									isso não resolver, escreve e a Boleia trata do
									resto.
								</P>
							</Section>

							<Section id="burla" title="Suspeitas de burla">
								<P className="mt-0 text-small">
									Nunca pedimos códigos, senhas, BI ou fotografias
									de documentos por telefone ou WhatsApp. Se
									alguém te disser que é da Boleia e to pede isso,
									é burla. Confirma connosco por email.
								</P>
							</Section>

							<Section id="apd" title="Reclamar de nós à APD">
								<P className="mt-0 text-small">
									A Lei nº 22/11 de 17 de Junho dá a qualquer
									pessoa o direito de reclamar para a Agência de
									Protecção de Dados. Se não gostares de como
									respondemos, podes apresentar essa reclamação.
								</P>
							</Section>
						</Prose>

						<div className="rounded-lg border border-line bg-surface p-5">
							<Scale
								size={18}
								aria-hidden="true"
								className="text-muted"
							/>
							<p className="mt-3 text-small text-muted">
								A Lei nº 22/11 está em revisão desde Março de 2025.
								Estes textos são escritos contra a lei em vigor e
								vão precisar de ser revistos quando a nova entrar em
								vigor.
							</p>
						</div>
					</aside>
				</div>
			</div>
		</>
	);
}

function Channel({
	Icon,
	term,
	detail,
	href,
}: {
	Icon: typeof Mail;
	term: string;
	detail: React.ReactNode;
	href?: string;
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
				<p className="text-small text-muted">{term}</p>
				<p className="mt-0.5 text-label font-medium text-ink">
					{href ? (
						<a
							href={href}
							className="rounded-sm underline-offset-4 hover:underline"
						>
							{detail}
						</a>
					) : (
						detail
					)}
				</p>
			</div>
		</div>
	);
}
