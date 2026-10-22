import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '../../components/layout/AuthShell';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { Divider } from '../../components/auth/Divider';
import { useSignIn } from '../../hooks/useAuth';
import { authClient, toAuthRequestError } from '../../lib/auth-client';
import {
	maskPhone,
	phoneError,
	passwordError,
	phonePlaceholder,
} from '../../lib/phone';

interface RedirectState {
	from?: string;
}

export function SignInPage() {
	/*
	 * Dois modos de entrada no mesmo ecrã: o número com senha, e o email com
	 * link mágico. `mode` escolhe o formulário; o resto do estado pertence a
	 * cada painel — assim trocar de modo não deixa metade de um campo
	 * preenchido no outro.
	 */
	const [mode, setMode] = useState<'phone' | 'email'>('phone');

	const location = useLocation();

	/*
	 * Onde a pessoa estava antes de a sessão a mandar para aqui. Pode vir de
	 * dois sítios com o mesmo nome: a `RequireAuth`, que o põe quando uma
	 * sessão caduca a meio de uma pesquisa, e a `VerifyPage`, que o usa para
	 * levar o filtro escolhido na landing até ao Explorar.
	 */
	const back = (location.state as RedirectState | null)?.from;

	// Para o link mágico o `callbackURL` é absoluto: quem clica abre a URL
	// completa a partir do cliente de email, e um caminho relativo aí não
	// chega a lado nenhum.
	const callbackURL = `${window.location.origin}${back ?? '/app'}`;

	return (
		<AuthShell title="Entrar" subtitle="Com o telemóvel com que te registaste.">
			{mode === 'email' ? (
				<MagicLinkPanel
					callbackURL={callbackURL}
					onBack={() => setMode('phone')}
				/>
			) : (
				<PhonePasswordPanel back={back} onEmail={() => setMode('email')} />
			)}

			<p className="mt-8 text-center text-body text-muted">
				Ainda não tens conta?{' '}
				<Link
					to="/criar-conta"
					className="rounded-sm text-brand-text underline-offset-4 hover:underline"
				>
					Criar conta
				</Link>
			</p>
		</AuthShell>
	);
}

/**
 * Entrada por email, com link mágico.
 *
 * Não há senha: o email é provado pelo link que o servidor manda, e a sessão
 * nasce no instante em que ele é aberto. O `callbackURL` devolve a pessoa a
 * onde ela estava antes de o login a interromper — o mesmo `from` que o
 * telefone usa, mas navegada pelo verify do servidor e não pela SPA.
 *
 * Depois do envio o ecrã não navega: passa ao estado "link enviado", porque
 * é isso que a pessoa tem de fazer a seguir — abrir a caixa de entrada.
 * Reenviar é um clique, não um recarregar de página.
 */
function MagicLinkPanel({
	callbackURL,
	onBack,
}: {
	callbackURL: string;
	onBack: () => void;
}) {
	const [email, setEmail] = useState('');
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [emailBad, setEmailBad] = useState<string | null>(null);

	const send = useMutation({
		mutationFn: async (input: { email: string; callbackURL: string }) => {
			const result = await authClient.signIn.magicLink({
				email: input.email,
				callbackURL: input.callbackURL,
			});
			const error = toAuthRequestError(
				result,
				'Não enviámos o link. Tenta de novo.',
			);
			if (error) throw error;
			return result.data;
		},
		onSuccess: (_data, variables) => {
			setSentTo(variables.email);
			setEmail('');
		},
		onError: (error: unknown) => {
			toast.error(
				error instanceof Error
					? error.message
					: 'Não enviámos o link. Tenta de novo.',
			);
		},
	});

	if (sentTo !== null) {
		return (
			<div className="flex flex-col gap-5">
				<div className="rounded-md border border-line bg-canvas p-4">
					<p className="text-body text-ink">
						Enviámos o link para <strong>{sentTo}</strong>.
					</p>
					<p className="mt-2 text-small text-muted">
						Abre-o para entrares. O link expira em 5 minutos, e uma vez
						usado não serve de novo.
					</p>
				</div>

				<Button variant="ghost" onClick={onBack}>
					Entrar de outra forma
				</Button>
			</div>
		);
	}

	return (
		<form
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				const value = email.trim();
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
					setEmailBad('Escreve um email válido.');
					return;
				}
				send.mutate({ email: value, callbackURL });
			}}
		>
			<div className="flex flex-col gap-4">
				<Button type="button" variant="ghost" onClick={onBack}>
					Entrar com o número
				</Button>

				<Field
					label="Email"
					type="email"
					value={email}
					onChange={(event) => {
						setEmail(event.target.value);
						setEmailBad(null);
					}}
					autoComplete="email"
					placeholder="o.teu@email.ao"
					error={emailBad}
					disabled={send.isPending}
				/>

				<Button
					type="submit"
					size="lg"
					full
					disabled={send.isPending || !email.trim()}
				>
					{send.isPending ? 'A enviar o link…' : 'Enviar link mágico'}
				</Button>
			</div>
		</form>
	);
}

/**
 * Entrada por número e senha — a que já existia.
 *
 * O atalho para o email está no fundo do formulário e não no topo: quem
 * procura o modo novo sempre `scrolla` para baixo a procurá-lo, e quem entra
 * como sempre não deve ver nada à frente do campo que já conhecia.
 */
function PhonePasswordPanel({
	back,
	onEmail,
}: {
	back?: string;
	onEmail: () => void;
}) {
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [phoneBad, setPhoneBad] = useState<string | null>(null);
	const [passwordBad, setPasswordBad] = useState<string | null>(null);

	// A navegação acontece no `onSuccess` da mutação, e não aqui: passar o
	// `back` para o `useSignIn` é o que garante que uma troca de modo não a
	// sobrepõe em duas callbacks.
	const signIn = useSignIn(back);

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const phoneProblem = phoneError(phone);
		const passwordProblem = passwordError(password);
		setPhoneBad(phoneProblem);
		setPasswordBad(passwordProblem);
		if (phoneProblem || passwordProblem) return;

		signIn.mutate({ phone: phone.trim(), password, rememberMe: true });
	}

	return (
		<form onSubmit={handleSubmit} noValidate>
			<GoogleButton label="Continuar com Google" />

			<Divider text="ou entra com o teu número" />

			<div className="flex flex-col gap-4">
				<Field
					label="Número de telefone"
					value={phone}
					onChange={(event) => {
						setPhone(maskPhone(event.target.value));
						setPhoneBad(null);
					}}
					inputMode="tel"
					autoComplete="tel"
					placeholder={phonePlaceholder()}
					error={phoneBad}
					disabled={signIn.isPending}
				/>

				<Field
					label="Senha"
					type={showPassword ? 'text' : 'password'}
					value={password}
					onChange={(event) => {
						setPassword(event.target.value);
						setPasswordBad(null);
					}}
					autoComplete="current-password"
					error={passwordBad}
					disabled={signIn.isPending}
					trailing={
						<button
							type="button"
							onClick={() => setShowPassword((value) => !value)}
							aria-label={
								showPassword
									? 'Esconder a senha'
									: 'Mostrar a senha'
							}
							className="rounded-sm p-1 text-muted transition-colors hover:text-ink"
							// `tabIndex` negativo tira o botão da ordem do teclado:
							// quem usa um leitor de ecrã ouve o valor do campo
							// como "senha, editável, texto escondido", e não
							// precisa de mais um botão no meio do caminho.
							tabIndex={-1}
						>
							{showPassword ? (
								<EyeOff size={17} aria-hidden="true" />
							) : (
								<Eye size={17} aria-hidden="true" />
							)}
						</button>
					}
				/>

				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={onEmail}
						className="rounded-sm text-small text-brand-text underline-offset-4 hover:underline"
					>
						Entrar por email
					</button>

					<Link
						to="/recuperar"
						className="rounded-sm text-small text-brand-text underline-offset-4 hover:underline"
					>
						Esqueci-me da senha
					</Link>
				</div>

				<Button type="submit" size="lg" full disabled={signIn.isPending}>
					{signIn.isPending ? 'A entrar…' : 'Entrar'}
				</Button>
			</div>
		</form>
	);
}
