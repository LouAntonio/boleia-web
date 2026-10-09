import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useSignOut, useUpdateProfile } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { KycBadge } from '../../components/ui/KycBadge';
import { maskPhone, phoneError } from '../../lib/phone';

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
	const [phone, setPhone] = useState(user?.phone ?? '');
	const [error, setError] = useState<string | null>(null);

	const save = useUpdateProfile();

	function submit(event: React.FormEvent) {
		event.preventDefault();

		if (!name.trim()) {
			setError('O nome não pode ficar vazio.');
			return;
		}

		// O telefone é a identidade da conta. O servidor pode recusá-lo — se for
		// o número de outra pessoa, se já estiver em uso — e nesse caso o nome
		// não deve ficar guardado só porque o resto estava bem. Por isso são
		// duas-envios: o telefone muda com as suas próprias consequências.
		const samePhone = phone.trim() === (user?.phone ?? '');
		if (samePhone) {
			save.mutate({
				name: name.trim(),
				surname: surname.trim() || undefined,
			});
			return;
		}

		const problem = phoneError(phone);
		if (problem) {
			setError(problem);
			return;
		}

		setError(null);
		save.mutate({
			name: name.trim(),
			surname: surname.trim() || undefined,
			phone: phone.trim(),
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

				<Field
					label="Número de telefone"
					value={phone}
					onChange={(event) => {
						setPhone(maskPhone(event.target.value));
						setError(null);
					}}
					inputMode="tel"
					autoComplete="tel"
					hint={
						phone.trim() === (user?.phone ?? '')
							? 'O teu número de entrada na conta.'
							: 'Mudar de número exige confirmação por código. Envia-te-mos um.'
					}
				/>

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

	const { data: kyc } = useQuery({ queryKey: qk.kyc, queryFn: api.fetchKycMe });

	const { data: contact } = useQuery({
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
						<Button type="submit" disabled={save.isPending}>
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
