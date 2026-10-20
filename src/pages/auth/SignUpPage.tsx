import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthShell } from '../../components/layout/AuthShell';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { Divider } from '../../components/auth/Divider';
import { ConsentRow } from '../../components/auth/ConsentRow';
import { signUpPhone } from '../../lib/phone-auth';
import {
	maskPhone,
	phoneError,
	passwordError,
	phonePlaceholder,
} from '../../lib/phone';
import { apiErrorMessage } from '../../lib/axios';
import { carryRouteIntent } from '../../lib/route-intent';

export function SignUpPage() {
	const [params] = useSearchParams();
	const navigate = useNavigate();

	const [phone, setPhone] = useState('');
	const [name, setName] = useState('');
	const [surname, setSurname] = useState('');
	const [password, setPassword] = useState('');
	const [terms, setTerms] = useState(false);
	const [marketing, setMarketing] = useState(false);

	const [bad, setBad] = useState<Record<string, string | null>>({});
	const [busy, setBusy] = useState(false);

	/*
	 * A pesquisa da hero passa a origem, o destino e o modo. Não se mostra
	 * nada aqui, mas os parâmetros têm de atravessar o registo: quem escolheu
	 * "Luanda → Benguela" não a quer perder por ter de criar conta. A lista de
	 * chaves vive em `route-intent.ts`, partilhada com o `VerifyPage`.
	 */

	/**
	 * Marca um campo como errado e diz se passou.
	 *
	 * Os quatro campos são validados todos de uma vez, em vez de parar no
	 * primeiro: chegar a um formulário com um erro, corrigi-lo e aparecer outro
	 * obriga a pessoa a submeter duas vezes para o formulário dizer que está
	 * bem.
	 */
	function validate(): boolean {
		const problems: Record<string, string | null> = {
			phone: phoneError(phone),
			name: name.trim().length === 0 ? 'Escreve o teu nome.' : null,
			password: passwordError(password),
			terms: terms ? null : 'Tens de aceitar os termos para criar conta.',
		};

		setBad(problems);
		return Object.values(problems).every((problem) => problem === null);
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		if (!validate()) return;

		setBusy(true);
		try {
			await signUpPhone({
				phone: phone.trim(),
				password,
				name: name.trim(),
				surname: surname.trim() || undefined,
				termsAccepted: true,
				marketingAccepted: marketing,
			});

			/*
			 * O backend cria a conta mas não abre sessão: devolve um email
			 * sintético a partir do telefone e fica à espera do código de 6
			 * dígitos. Entrar aqui sem verificar deixaria a pessoa com uma conta
			 * que não consegue usar.
			 */
			const next = new URLSearchParams({ phone: phone.trim() });
			carryRouteIntent(params, next);

			toast.success('Enviámos um código para o teu telemóvel.');
			navigate(`/verificar?${next}`, { replace: true });
		} catch (error) {
			toast.error(
				apiErrorMessage(
					error,
					'Não foi possível criar a conta. Tenta de novo.',
				),
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<AuthShell
			title="Criar conta"
			subtitle="O teu número de telemóvel é a tua conta. Sem email, sem palavra-passe para guardar."
		>
			<form onSubmit={handleSubmit} noValidate>
				<GoogleButton label="Continuar com Google" />

				<Divider text="ou usa o teu número" />

				<div className="flex flex-col gap-4">
					<Field
						label="Número de telefone"
						value={phone}
						onChange={(event) => {
							setPhone(maskPhone(event.target.value));
						}}
						inputMode="tel"
						autoComplete="tel"
						placeholder={phonePlaceholder()}
						error={bad.phone}
						disabled={busy}
					/>

					<Field
						label="Nome"
						value={name}
						onChange={(event) => {
							setName(event.target.value);
						}}
						autoComplete="given-name"
						placeholder="Como te chamas"
						error={bad.name}
						disabled={busy}
					/>

					<Field
						label="Apelido"
						value={surname}
						onChange={(event) => setSurname(event.target.value)}
						autoComplete="family-name"
						hint="Opcional. É o que o passageiro vê ao lado do teu nome."
						disabled={busy}
					/>

					<Field
						label="Senha"
						type="password"
						value={password}
						onChange={(event) => {
							setPassword(event.target.value);
						}}
						autoComplete="new-password"
						hint="Pelo menos 8 caracteres."
						error={bad.password}
						disabled={busy}
					/>

					<ConsentRow
						terms={terms}
						marketing={marketing}
						onTermsChange={(value) => {
							setTerms(value);
						}}
						onMarketingChange={setMarketing}
						error={bad.terms}
						disabled={busy}
					/>

					<Button type="submit" size="lg" full disabled={busy}>
						{busy ? 'A criar conta…' : 'Criar conta'}
					</Button>
				</div>
			</form>

			<p className="mt-8 text-center text-body text-muted">
				Já tens conta?{' '}
				<Link
					to="/entrar"
					className="rounded-sm text-brand-text underline-offset-4 hover:underline"
				>
					Entrar
				</Link>
			</p>
		</AuthShell>
	);
}
