import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { maskPhone, phoneError, phonePlaceholder } from '../../lib/phone';
import { apiErrorMessage } from '../../lib/axios';
import { showOtpToast } from '../../lib/otp-toast';
import { forgotPassword } from '../../lib/phone-auth';

export function ForgotPasswordPage() {
	const navigate = useNavigate();

	const [phone, setPhone] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const problem = phoneError(phone);
		if (problem) {
			setError(problem);
			return;
		}

		setBusy(true);
		try {
			const result = await forgotPassword(phone.trim());

			/*
			 * O backend responde com a mesma coisa exista ou não a conta, para não
			 * dizer a quem está a tentar entrar que um número não está
			 * registado. O cliente acompanha: a mesma mensagem nos dois casos.
			 *
			 * O `purpose=reset` diz à página do código que este é para mudar a
			 * senha e não para confirmar um registo novo — são o mesmo formulário
			 * e duas continuações diferentes.
			 */
			showOtpToast(
				result.otp,
				'Se esse número tiver conta, o código já vai a caminho.',
			);
			navigate(
				`/verificar?purpose=reset&phone=${encodeURIComponent(phone.trim())}`,
				{ replace: true },
			);
		} catch (err) {
			setError(apiErrorMessage(err, 'Não foi possível pedir o código.'));
		} finally {
			setBusy(false);
		}
	}

	return (
		<AuthShell
			title="Recuperar a senha"
			subtitle="Escreves o teu número e recebes um código por WhatsApp."
		>
			<form onSubmit={handleSubmit} noValidate>
				<Field
					label="Número de telefone"
					value={phone}
					onChange={(event) => {
						setPhone(maskPhone(event.target.value));
						setError(null);
					}}
					inputMode="tel"
					autoComplete="tel"
					placeholder={phonePlaceholder()}
					error={error}
					autoFocus
					disabled={busy}
				/>

				<Button
					type="submit"
					size="lg"
					full
					disabled={busy}
					className="mt-6"
				>
					{busy ? 'A enviar…' : 'Enviar código'}
				</Button>
			</form>

			<p className="mt-6 text-center text-body text-muted">
				Lembraste-te?{' '}
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
