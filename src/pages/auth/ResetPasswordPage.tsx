import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthShell } from '../../components/layout/AuthShell';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { passwordError } from '../../lib/phone';
import { apiErrorMessage } from '../../lib/axios';
import * as api from '../../lib/api';

interface ResetState {
	token?: string;
	phone?: string;
}

export function ResetPasswordPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const state = (location.state as ResetState | null) ?? null;

	const [password, setPassword] = useState('');
	const [repeat, setRepeat] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [repeatError, setRepeatError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	/*
	 * O `token` vem do `state` da navegação, não da URL — ver `VerifyPage`.
	 * Sem ele, recarregar a página manda a pessoa ao início de sessão sem dizer
	 * porque: o que aconteceu foi que o token vive no histórico do browser e
	 * desapareceu com o `F5`.
	 */
	if (!state?.token) {
		return (
			<AuthShell
				title="O código expirou"
				subtitle="O pedido de recuperação não chegou até ao fim."
			>
				<p className="text-body text-muted">
					Os códigos são válidos por pouco tempo. Pede um novo e confirma
					o número outra vez.
				</p>
				<Link to="/recuperar" className="mt-6 inline-block">
					<Button size="lg" full>
						Pedir novo código
					</Button>
				</Link>
			</AuthShell>
		);
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const problem = passwordError(password);
		const mismatch = password !== repeat ? 'As senhas não são iguais.' : null;

		setError(problem);
		setRepeatError(mismatch);
		if (problem || mismatch) return;

		setBusy(true);
		try {
			await api.resetPassword(state?.token as string, password);
			toast.success('Senha mudada. Entra com a nova.');
			navigate('/entrar', { replace: true });
		} catch (err) {
			setError(apiErrorMessage(err, 'Não foi possível mudar a senha.'));
		} finally {
			setBusy(false);
		}
	}

	return (
		<AuthShell
			title="Nova senha"
			subtitle={`Escreve uma senha nova para ${state.phone}.`}
		>
			<form onSubmit={handleSubmit} noValidate>
				<div className="flex flex-col gap-4">
					<Field
						label="Senha nova"
						type="password"
						value={password}
						onChange={(event) => {
							setPassword(event.target.value);
							setError(null);
						}}
						autoComplete="new-password"
						hint="Pelo menos 8 caracteres."
						error={error}
						autoFocus
						disabled={busy}
					/>

					<Field
						label="Repete a senha"
						type="password"
						value={repeat}
						onChange={(event) => {
							setRepeat(event.target.value);
							setRepeatError(null);
						}}
						autoComplete="new-password"
						error={repeatError}
						disabled={busy}
					/>

					<Button type="submit" size="lg" full disabled={busy}>
						{busy ? 'A guardar…' : 'Guardar senha nova'}
					</Button>
				</div>
			</form>
		</AuthShell>
	);
}
