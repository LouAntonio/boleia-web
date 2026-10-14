import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageMeta';
import { useSignOut, useUpdateProfile } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { KycBadge } from '../../components/ui/KycBadge';
import { maskPhone } from '../../lib/phone';

type Tab = 'perfil' | 'seguranca' | 'aparencia';

export function ProfilePage() {
	usePageTitle('Perfil');

	const [tab, setTab] = useState<Tab>('perfil');
	const user = useAuthStore((s) => s.user);

	const TABS: { id: Tab; label: string }[] = [
		{ id: 'perfil', label: 'Perfil' },
		{ id: 'seguranca', label: 'Segurança' },
		{ id: 'aparencia', label: 'Aparência' },
	];

	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="text-h2 text-ink">{user?.name ?? 'Perfil'}</h1>
				<p className="mt-2 text-body text-muted">
					{user?.phone ?? user?.email}
				</p>
			</header>

			{/*
			 * Separadores e não um menu lateral: são três ecrãs, não três
			 * secções de um documento. Num ecrã estreito, tab vertical ocupa uma
			 * coluna inteira para dizer três palavras.
			 */}
			<div
				role="tablist"
				aria-label="Perfil"
				className="flex gap-1 border-b border-line"
			>
				{TABS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						onClick={() => setTab(id)}
						className={[
							'-mb-px border-b-2 px-4 py-3 text-label transition-colors',
							tab === id
								? 'border-brand text-brand-text'
								: 'border-transparent text-muted hover:text-ink',
						].join(' ')}
					>
						{label}
					</button>
				))}
			</div>

			{tab === 'perfil' ? <ProfileTab /> : null}
			{tab === 'seguranca' ? <SecurityTab /> : null}
			{tab === 'aparencia' ? <AppearanceTab /> : null}
		</div>
	);
}

function ProfileTab() {
	const user = useAuthStore((s) => s.user);
	const [name, setName] = useState(user?.name ?? '');
	const [surname, setSurname] = useState(user?.surname ?? '');
	const [error, setError] = useState<string | null>(null);

	const save = useUpdateProfile();

	/*
	 * O telefone não é editável.
	 *
	 * O formulário ofereceva-o e o `PATCH /api/account/profile` não o aceita —
	 * o endpoint só trata `name`, `surname` e `bio`. Pior, o texto dizia
	 * "mudar de número exige confirmação por código. Envia-te-mos um": nenhum
	 * código era enviado, e a alteração era descartada em silêncio pelo
	 * servidor, sem erro visível. Ou o número muda por um fluxo de servidor com
	 * verificação por OTP, ou não muda — o que se oferece no ecrã não pode ser
	 * uma promessa que nada cumpre.
	 */
	const phone = user?.phone ?? '';

	function submit(event: React.FormEvent) {
		event.preventDefault();

		if (!name.trim()) {
			setError('O nome não pode ficar vazio.');
			return;
		}

		setError(null);
		save.mutate({
			name: name.trim(),
			surname: surname.trim() || undefined,
		});
	}

	return (
		<Card className="max-w-xl p-6">
			<h2 className="text-h3 text-ink">Os teus dados</h2>
			<p className="mt-1.5 text-small text-muted">
				O nome é o que o passageiro vê ao lado do teu na boleia.
			</p>

			<form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
				<Field
					label="Nome"
					value={name}
					onChange={(event) => setName(event.target.value)}
					autoComplete="given-name"
					error={error}
				/>

				<Field
					label="Apelido"
					value={surname}
					onChange={(event) => setSurname(event.target.value)}
					autoComplete="family-name"
					hint="Opcional."
				/>

				<div className="flex flex-col gap-1.5">
					<span className="text-label text-ink">Número de telefone</span>
					<p className="flex h-11 items-center rounded-md border border-line bg-canvas px-3 text-body text-muted">
						{phone || '—'}
					</p>
					<p className="text-small text-muted">
						O teu número de entrada na conta. Não pode ser alterado
						aqui.
					</p>
				</div>

				<div className="flex items-center justify-end gap-3 pt-2">
					<Button type="submit" disabled={save.isPending}>
						<Save size={16} aria-hidden="true" />
						{save.isPending ? 'A guardar…' : 'Guardar'}
					</Button>
				</div>
			</form>
		</Card>
	);
}

function SecurityTab() {
	const signOut = useSignOut();
	const queryClient = useQueryClient();

	const {
		data: kyc,
		isPending: kycPending,
		isError: kycError,
		refetch: refetchKyc,
	} = useQuery({ queryKey: qk.kyc, queryFn: api.fetchKycMe });

	const {
		data: contact,
		isError: contactError,
		refetch: refetchContact,
	} = useQuery({
		queryKey: qk.emergencyContact,
		queryFn: api.fetchEmergencyContact,
	});

	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [loaded, setLoaded] = useState(false);

	// Preenche os campos a partir do servidor uma vez — e só uma, para não
	// apagar o que a pessoa está a escrever quando a query volta a responder.
	useEffect(() => {
		if (contact && !loaded) {
			setName(contact.name);
			setPhone(contact.phone);
			setLoaded(true);
		}
	}, [contact, loaded]);

	const save = useMutation({
		mutationFn: api.saveEmergencyContact,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.emergencyContact });
			toast.success('Contacto de emergência guardado');
		},
		onError: (error: unknown) => {
			toast.error(apiErrorMessage(error, 'Não foi possível guardar.'));
		},
	});

	return (
		<div className="flex max-w-xl flex-col gap-6">
			<Card className="p-6">
				<h2 className="text-h3 text-ink">Verificação</h2>

				{/*
				 * `kyc?.passenger ?? null` diz "não enviaste ainda", e isso é uma
				 * afirmação sobre a pessoa. Uma falha de rede não a autoriza: com
				 * a API em baixo, o ecrã diria que ninguém verificou a identidade
				 * e mostraria o selo `NOT_SUBMITTED` — e é o facto que decide se
				 * pode reservar ou vender lugares.
				 */}
				{kycPending ? (
					<p className="mt-4 text-small text-muted">A carregar…</p>
				) : null}

				{kycError ? (
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<p className="text-small text-muted">
							Não foi possível carregar o estado da verificação.
						</p>
						<Button variant="secondary" onClick={() => refetchKyc()}>
							Tentar de novo
						</Button>
					</div>
				) : null}

				{!kycPending && !kycError ? (
					<div className="mt-4 flex flex-col gap-3">
						<div className="flex items-center justify-between gap-4">
							<KycBadge
								state={kyc?.passenger ?? null}
								what="identidade de passageiro"
							/>
							<StatusStamp
								status={kyc?.passenger?.status ?? 'NOT_SUBMITTED'}
							/>
						</div>
						<div className="flex items-center justify-between gap-4">
							<KycBadge
								state={kyc?.driver ?? null}
								what="identidade de motorista"
							/>
							<StatusStamp
								status={kyc?.driver?.status ?? 'NOT_SUBMITTED'}
							/>
						</div>
					</div>
				) : null}
			</Card>

			<Card className="p-6">
				<h2 className="text-h3 text-ink">Contacto de emergência</h2>
				<p className="mt-1.5 text-small text-muted">
					Uma pessoa a quem avisar se precisares de ajuda durante uma
					viagem. Não é partilhado com o motorista nem com o passageiro.
				</p>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						save.mutate({ name: name.trim(), phone: phone.trim() });
					}}
					noValidate
					className="mt-5 flex flex-col gap-4"
				>
					{/*
					 * O formulário nasce vazio e preenche-se quando a query
					 * responde. Numa falha, os campos vazios parecem "não tens
					 * contacto guardado" — e guardar assim apagava o contacto de
					 * emergência que já existia. Aqui só se escreve depois de
					 * uma resposta, boa ou má.
					 */}
					{contactError ? (
						<div className="flex flex-wrap items-center gap-3">
							<p className="text-small text-muted">
								Não foi possível carregar o contacto guardado. Não
								vais apagar nada: carrega outra vez para ver o que
								está lá.
							</p>
							<Button
								variant="secondary"
								onClick={() => refetchContact()}
							>
								Tentar de novo
							</Button>
						</div>
					) : null}
					<Field
						label="Nome"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
					/>
					<Field
						label="Número"
						value={phone}
						onChange={(event) =>
							setPhone(maskPhone(event.target.value))
						}
						inputMode="tel"
						required
					/>
					<div className="flex justify-end pt-2">
						<Button
							type="submit"
							// Sem resposta do servidor não se sabe o que está
							// guardado, e guardar por cima pode apagá-lo.
							disabled={save.isPending || contactError}
						>
							{save.isPending ? 'A guardar…' : 'Guardar contacto'}
						</Button>
					</div>
				</form>
			</Card>

			<Card className="p-6">
				<h2 className="text-h3 text-ink">Sessão</h2>
				<p className="mt-1.5 text-small text-muted">
					Sair termina a sessão neste dispositivo.
				</p>
				<div className="mt-5">
					<Button variant="danger" onClick={() => signOut.mutate()}>
						<LogOut size={16} aria-hidden="true" />
						Terminar sessão
					</Button>
				</div>
			</Card>
		</div>
	);
}

function AppearanceTab() {
	const theme = useThemeStore((s) => s.theme);

	return (
		<Card className="max-w-xl p-6">
			<h2 className="text-h3 text-ink">Como se vê</h2>
			<p className="mt-1.5 text-small text-muted">
				O tema segue o teu aparelho quando escolhes "do sistema".
			</p>

			<div className="mt-6">
				<ThemeToggle />
			</div>

			<p className="mt-6 text-small text-muted">
				Escolhido agora: <strong className="text-ink">{theme}</strong>.
			</p>
		</Card>
	);
}
