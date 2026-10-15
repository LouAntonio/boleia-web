import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { authClient, toAuthRequestError } from '../../lib/auth-client';
import * as api from '../../lib/api';
import { describeDevice, sessionDate } from '../../lib/device';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageMeta';
import { useSignOut } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';

/**
 * Conta e segurança.
 *
 * **Não repete o nome e o apelido.** O `ProfilePage` já os edita, com botão de
 * guardar e sem erros. Copiar o formulário para aqui seria ter dois sítios a
 * editar o mesmo campo, e a pessoa a perguntar qual deles está certo. A identidade
 * fica no perfil; esta página tem o que lá falta.
 *
 * **Nada disto precisa de backend novo.** Cada bloco é um endpoint que já
 * existia: `POST /api/account/delete`, `POST /api/account/unlink-google`, e os
 * stock do better-auth (`change-email`, `send-verification-email`,
 * `list-sessions`, `revoke-session`, `revoke-other-sessions`,
 * `change-password`, `link-social`).
 */
export function AccountPage() {
	usePageTitle('Conta e segurança');

	const queryClient = useQueryClient();
	const signOut = useSignOut();
	const user = useAuthStore((s) => s.user);

	const [newEmail, setNewEmail] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');

	/**
	 * As sessões e as contas ligadas vão pelo `authClient`, não pelo axios.
	 *
	 * São endpoints do próprio better-auth e a sessão vive num cookie que o
	 * `apiClient` não tem porquê ler — mandar por aí obrigaria a ir buscar o
	 * cookie à mão para um ecrã que, no resto, é igual aos outros.
	 */
	const sessionsQuery = useQuery({
		queryKey: ['account', 'sessions'],
		queryFn: async () => {
			const { data, error } = await authClient.listSessions();
			if (error)
				throw toAuthRequestError(
					{ data, error },
					'Não foi possível ler as sessões.',
				);
			return (data ?? []) as api.SessionRow[];
		},
	});
	const accountsQuery = useQuery({
		queryKey: ['account', 'accounts'],
		queryFn: async () => {
			const { data } = await authClient.listAccounts();
			return data ?? [];
		},
	});

	const sessions = sessionsQuery.data ?? [];
	const googleLinked = (accountsQuery.data ?? []).some(
		(a) => a.providerId === 'google',
	);

	const refresh = () => queryClient.invalidateQueries({ queryKey: ['account'] });

	/**
	 * O email a sério é o que não vive no domínio sintético.
	 *
	 * Toda a conta de telefone nasce com `<phone>@boleia.ao` porque o better-auth
	 * exige um email e não há outro campo. Esse endereço não recebe correio, logo
	 * está sempre por verificar — e dizê-lo é melhor do que mostrar um
	 * "verificado" que não verifica nada.
	 */
	const currentEmail = user?.email ?? '';
	const synthetic = currentEmail.endsWith('@boleia.ao');
	const emailVerified = !synthetic && user?.emailVerified === true;

	const changeEmail = useMutation({
		mutationFn: async (value: string) => {
			const { data, error } = await authClient.changeEmail({
				newEmail: value,
			});
			const failure = toAuthRequestError(
				{ data, error },
				'Não foi possível trocar.',
			);
			if (failure) throw failure;
		},
		onSuccess: async () => {
			setNewEmail('');
			await refresh();
			toast.success(
				'Enviámos um link para o novo endereço. Ele só passa a valer depois de carregares nesse link.',
			);
		},
		onError: (error) =>
			toast.error(apiErrorMessage(error, 'Não foi possível trocar o email.')),
	});

	const resendVerification = useMutation({
		mutationFn: () => authClient.sendVerificationEmail({ email: currentEmail }),
		onSuccess: () => toast.success('Email enviado. Confirma o teu endereço.'),
		onError: () => toast.error('Não foi possível reenviar. Tenta mais tarde.'),
	});

	const unlink = useMutation({
		mutationFn: api.unlinkGoogle,
		onSuccess: async () => {
			await refresh();
			toast.success('Conta Google desvinculada.');
		},
		onError: (error) =>
			toast.error(apiErrorMessage(error, 'Não foi possível desvincular.')),
	});

	const changePassword = useMutation({
		mutationFn: async () => {
			const { data, error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			const failure = toAuthRequestError(
				{ data, error },
				'Não foi possível trocar a palavra-passe.',
			);
			if (failure) throw failure;
		},
		onSuccess: async () => {
			setCurrentPassword('');
			setNewPassword('');
			await refresh();
			toast.success(
				'Palavra-passe trocada. As outras sessões foram terminadas.',
			);
		},
		onError: (error) =>
			toast.error(
				apiErrorMessage(error, 'Não foi possível trocar a palavra-passe.'),
			),
	});

	const revoke = useMutation({
		mutationFn: async (token: string) => {
			const { data, error } = await authClient.revokeSession({ token });
			const failure = toAuthRequestError(
				{ data, error },
				'Não foi possível terminar.',
			);
			if (failure) throw failure;
		},
		onSuccess: refresh,
		onError: () => toast.error('Não foi possível terminar essa sessão.'),
	});

	const revokeOthers = useMutation({
		mutationFn: async () => {
			const { data, error } = await authClient.revokeOtherSessions();
			const failure = toAuthRequestError(
				{ data, error },
				'Não foi possível fazer isso.',
			);
			if (failure) throw failure;
		},
		onSuccess: refresh,
		onError: () => toast.error('Não foi possível fazer isso.'),
	});

	const removeAccount = useMutation({
		mutationFn: api.deleteAccount,
		onSuccess: () => signOut.mutate(),
		onError: (error) =>
			toast.error(
				apiErrorMessage(error, 'Não foi possível eliminar a conta.'),
			),
	});

	return (
		<div className="flex max-w-2xl flex-col gap-8">
			<header>
				<Link
					to="/app/perfil"
					className="inline-flex min-h-11 items-center gap-1.5 text-small text-muted hover:text-ink"
				>
					<ArrowLeft size={16} aria-hidden="true" />
					Perfil
				</Link>
				<h1 className="mt-2 text-h2 text-ink">Conta e segurança</h1>
				<p className="mt-2 text-body text-muted">
					As tuas credenciais e as sessões abertas da tua conta.
				</p>
			</header>

			{/* ---------------- Email ---------------- */}
			<Card className="p-6">
				<h2 className="text-h3 text-ink">Email</h2>
				<p className="mt-1.5 text-small text-muted">
					{synthetic
						? 'A conta de telefone não tem email a sério. Junta um para poderes entrar também por link.'
						: emailVerified
							? 'Email confirmado. Podes usá-lo para entrar.'
							: 'Falta confirmar este endereço.'}
				</p>

				<dl className="mt-5 flex items-center justify-between gap-4 border-y border-line py-3">
					<dt className="text-small text-muted">Endereço actual</dt>
					<dd className="truncate text-small text-ink">
						{currentEmail || '—'}
					</dd>
				</dl>

				{synthetic ? null : (
					<div className="mt-4">
						<Button
							variant="secondary"
							onClick={() => resendVerification.mutate()}
							disabled={resendVerification.isPending}
						>
							Reenviar email de confirmação
						</Button>
					</div>
				)}

				<form
					className="mt-6"
					onSubmit={(event) => {
						event.preventDefault();
						const value = newEmail.trim().toLowerCase();
						if (!value.includes('@') || value.endsWith('@boleia.ao')) {
							toast.error('Escreve um endereço de email a sério.');
							return;
						}
						changeEmail.mutate(value);
					}}
				>
					<Field
						label="Novo email"
						type="email"
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
						placeholder="nome@exemplo.ao"
						autoComplete="email"
					/>
					{/*
					 * O aviso não é decorativo. O backend tem
					 * `requireEmailVerification: false`, portanto a troca aplica-se
					 * logo e o endereço fica por confirmar até alguém clicar no
					 * link. Dizer isso é melhor do que deixar a pessoa dias com um
					 * email que ainda não é seu.
					 */}
					<p className="mt-3 text-small text-muted">
						O endereço só fica teu quando carregares no link que
						enviamos. Até lá, continua a valer o antigo.
					</p>
					<div className="mt-4">
						<Button
							type="submit"
							disabled={!newEmail.trim() || changeEmail.isPending}
						>
							{changeEmail.isPending ? 'A trocar…' : 'Trocar email'}
						</Button>
					</div>
				</form>
			</Card>

			{/* ---------------- Google ---------------- */}
			{/*
			 * O botão de Google no ecrã de entrada **cria conta nova**. Ligar o
			 * Google a uma conta de telefone que já existe é outra coisa, e só é
			 * possível com sessão activa — o backend tem
			 * `disableImplicitLinking: true` de propósito, para ninguém
			 * conseguir tomar a conta de outra pessoa.
			 */}
			<Card className="p-6">
				<h2 className="text-h3 text-ink">Conta Google</h2>
				<p className="mt-1.5 text-small text-muted">
					Uma segunda porta de entrada. Podes desligá-la sem perder a
					conta.
				</p>

				<div className="mt-5 flex items-center justify-between gap-4 border-y border-line py-3">
					<span className="text-small text-ink">
						{accountsQuery.isPending
							? 'A ver as tuas contas…'
							: googleLinked
								? 'Ligada a esta conta'
								: 'Não está ligada'}
					</span>

					{googleLinked ? (
						<Button
							variant="secondary"
							onClick={() => {
								if (
									window.confirm(
										'Passas a entrar só com o telefone e a senha. Se te esqueceres da senha, já não há Google para te trazer de volta.',
									)
								) {
									unlink.mutate();
								}
							}}
							disabled={unlink.isPending}
						>
							Desvincular
						</Button>
					) : (
						<Button
							onClick={() =>
								authClient.linkSocial({
									provider: 'google',
									callbackURL: `${window.location.origin}/app/conta`,
								})
							}
						>
							Ligar
						</Button>
					)}
				</div>
			</Card>

			{/* ---------------- Sessões ---------------- */}
			<Card className="p-6">
				<h2 className="text-h3 text-ink">Sessões</h2>
				<p className="mt-1.5 text-small text-muted">
					Onde a tua conta está aberta. Um sítio que não reconheças,
					termina.
				</p>

				{sessionsQuery.isPending ? (
					<p className="mt-5 text-body text-muted">A procurar sessões…</p>
				) : sessions.length === 0 ? (
					<p className="mt-5 text-body text-muted">
						Não foi possível ler as sessões. Tenta mais tarde.
					</p>
				) : (
					<ul className="mt-5 divide-y divide-line border-y border-line">
						{sessions.map((session) => (
							<li
								key={session.token}
								className="flex items-center justify-between gap-4 py-3"
							>
								<span className="min-w-0">
									<span className="block text-small text-ink">
										{describeDevice(session.userAgent) ??
											'Dispositivo desconhecido'}
									</span>
									<span className="block text-small text-muted">
										{[
											session.ipAddress ?? 'IP desconhecido',
											sessionDate(session.createdAt),
										].join(' · ')}
									</span>
								</span>
								<Button
									variant="ghost"
									onClick={() => revoke.mutate(session.token)}
									disabled={revoke.isPending}
								>
									Terminar
								</Button>
							</li>
						))}
					</ul>
				)}

				{sessions.length > 1 ? (
					<div className="mt-4">
						<Button
							variant="secondary"
							onClick={() => revokeOthers.mutate()}
							disabled={revokeOthers.isPending}
						>
							Terminar as outras sessões
						</Button>
					</div>
				) : null}
			</Card>

			{/* ---------------- Palavra-passe ---------------- */}
			<Card className="p-6">
				<h2 className="text-h3 text-ink">Palavra-passe</h2>
				<p className="mt-1.5 text-small text-muted">
					Trocar a palavra-passe termina as outras sessões.
				</p>

				<form
					className="mt-5 flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (newPassword.length < 8) {
							toast.error(
								'A nova palavra-passe precisa de pelo menos 8 caracteres.',
							);
							return;
						}
						changePassword.mutate();
					}}
				>
					<Field
						label="Palavra-passe actual"
						type="password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						autoComplete="current-password"
					/>
					<Field
						label="Nova palavra-passe"
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						autoComplete="new-password"
						hint="Pelo menos 8 caracteres."
					/>
					<div>
						<Button
							type="submit"
							disabled={
								!currentPassword ||
								newPassword.length < 8 ||
								changePassword.isPending
							}
						>
							{changePassword.isPending
								? 'A trocar…'
								: 'Trocar palavra-passe'}
						</Button>
					</div>
				</form>
			</Card>

			{/* ---------------- Sessão e eliminação ---------------- */}
			<Card className="p-6">
				<h2 className="text-h3 text-ink">Sair e eliminar</h2>

				<div className="mt-5 flex flex-wrap items-center gap-3">
					<Button variant="secondary" onClick={() => signOut.mutate()}>
						<LogOut size={16} aria-hidden="true" />
						Terminar sessão
					</Button>

					<Button
						variant="danger"
						disabled={removeAccount.isPending}
						onClick={() => {
							if (
								window.confirm(
									'Perdes as viagens, as reservas e o histórico. Não há como desfazer.',
								)
							) {
								removeAccount.mutate();
							}
						}}
					>
						<Trash2 size={16} aria-hidden="true" />
						Eliminar conta
					</Button>
				</div>
			</Card>
		</div>
	);
}
