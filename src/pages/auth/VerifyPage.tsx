import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '../../components/layout/AuthShell';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { maskOtp } from '../../lib/phone';
import { apiErrorMessage } from '../../lib/axios';
import * as api from '../../lib/api';

/**
 * A confirmação do código.
 *
 * A mesma página serve os dois códigos, porque o formulário é o mesmo e só muda
 * o que acontece a seguir:
 *
 * - `signup` — confirma o telefone e a pessoa vai entrar.
 * - `reset` — devolve um `token` que só vale para a chamada seguinte a
 *   `/reset-password`, e que por isso viaja no `state` da navegação em vez de
 *   ir na query string. Na URL ele ficaria no histórico do browser, no
 *   `copy as link`, e no `Referer` de qualquer pedido seguinte.
 *
 * O `purpose` vem da query porque a página tem de sobreviver a um F5 — perder o
 * contexto do token nesse caso seria pior do que ouir numa URL.
 */
export function VerifyPage() {
	const [params] = useSearchParams();
	const navigate = useNavigate();

	const phone = params.get('phone') ?? '';
	const purpose: api.OtpPurpose =
		params.get('purpose') === 'reset' ? 'reset' : 'signup';

	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [resending, setResending] = useState(false);

	// Sem número não há código para confirmar. Chega aqui com o `?phone=` na
	// query porque o registo manda para aqui — e voltar ao formulário seria
	// menos útil do que dizer logo o que falta.
	if (!phone) {
		return (
			<AuthShell
				title="Falta o número"
				subtitle="Não sabemos que código confirmar."
			>
				<p className="text-body text-muted">
					Volta a criar a conta e o código é enviado outra vez.
				</p>
				<Link to="/criar-conta" className="mt-6 inline-block">
					<Button size="lg" full>
						Criar conta
					</Button>
				</Link>
			</AuthShell>
		);
	}

	const isReset = purpose === 'reset';

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		if (code.length !== 6) {
			setError('O código tem 6 dígitos.');
			return;
		}

		setBusy(true);
		setError(null);
		try {
			const result = await api.verifyOtp(phone, code, purpose);

			if (isReset) {
				if (!result.token) {
					// O código é válido mas o servidor não devolveu o token. Sem ele
					// não há nada a mandar para `/reset-password` — melhor dizer
					// isso do que deixar a pessoa numa página que não trabalha.
					setError('O código expirou. Pede outro.');
					return;
				}
				navigate('/redefinir', {
					replace: true,
					state: { token: result.token, phone },
				});
				return;
			}

			toast.success('Conta confirmada. Já podes entrar.');
			navigate('/entrar', { replace: true });
		} catch (err) {
			setError(
				apiErrorMessage(
					err,
					'O código não confere. Confirma os seis dígitos.',
				),
			);
		} finally {
			setBusy(false);
		}
	}

	async function handleResend() {
		setResending(true);
		try {
			await api.sendOtp(phone, purpose);
			toast.success('Enviámos outro código.');
		} catch (err) {
			toast.error(
				apiErrorMessage(err, 'Não foi possível reenviar o código.'),
			);
		} finally {
			setResending(false);
		}
	}

	return (
		<AuthShell
			title={isReset ? 'Confirma o código' : 'Confirma o teu número'}
			subtitle={`Enviámos um código de 6 dígitos para ${phone}.`}
		>
			<form onSubmit={handleSubmit} noValidate>
				<Field
					label="Código"
					value={code}
					onChange={(event) => {
						setCode(maskOtp(event.target.value));
						setError(null);
					}}
					inputMode="numeric"
					autoComplete="one-time-code"
					maxLength={6}
					placeholder="000000"
					className="font-mono text-h3 tracking-[0.3em]"
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
					{busy ? 'A confirmar…' : 'Confirmar'}
				</Button>
			</form>

			<div className="mt-6 flex flex-col gap-3">
				<Button
					type="button"
					variant="ghost"
					full
					onClick={handleResend}
					disabled={resending}
				>
					{resending ? 'A reenviar…' : 'Não recebi o código'}
				</Button>

				<Link
					to="/entrar"
					className="inline-flex items-center justify-center gap-1.5 rounded-sm text-small text-muted transition-colors hover:text-ink"
				>
					<ArrowLeft size={14} aria-hidden="true" />
					Voltar ao início de sessão
				</Link>
			</div>
		</AuthShell>
	);
}
