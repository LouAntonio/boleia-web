import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { Divider } from '../../components/auth/Divider';
import { useSignIn } from '../../hooks/useAuth';
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
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [phoneBad, setPhoneBad] = useState<string | null>(null);
	const [passwordBad, setPasswordBad] = useState<string | null>(null);

	const signIn = useSignIn();
	const navigate = useNavigate();
	const location = useLocation();

	// Onde a pessoa estava antes de a sessão a mandar para aqui.
	const back = (location.state as RedirectState | null)?.from ?? '/app/explorar';

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const phoneProblem = phoneError(phone);
		const passwordProblem = passwordError(password);
		setPhoneBad(phoneProblem);
		setPasswordBad(passwordProblem);
		if (phoneProblem || passwordProblem) return;

		signIn.mutate(
			{ phone: phone.trim(), password, rememberMe: true },
			// `useSignIn` já leva a `/app/explorar` quando não há origem. Esta
			// segunda callback só interessa quando a pessoa veio de dentro da app.
			{ onSuccess: () => navigate(back, { replace: true }) },
		);
	}

	return (
		<AuthShell title="Entrar" subtitle="Com o telemóvel com que te registaste.">
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

					<div className="flex justify-end">
						<Link
							to="/recuperar"
							className="rounded-sm text-small text-brand-text underline-offset-4 hover:underline"
						>
							Esqueci-me da senha
						</Link>
					</div>

					<Button
						type="submit"
						size="lg"
						full
						disabled={signIn.isPending}
					>
						{signIn.isPending ? 'A entrar…' : 'Entrar'}
					</Button>
				</div>
			</form>

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
