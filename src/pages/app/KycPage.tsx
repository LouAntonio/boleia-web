import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, IdCard, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useKycMe } from '../../hooks/useKyc';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { StatusStamp } from '../../components/ui/StatusStamp';
import type { KycState } from '../../types/api';

type Side = 'passenger' | 'driver';

export function KycPage() {
	usePageTitle('Verificação de identidade');

	const { data, isPending } = useKycMe();

	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="text-h2 text-ink">Verificação de identidade</h1>
				<p className="mt-2 max-w-2xl text-body text-muted">
					Toda a gente confirma o telefone ao criar a conta. Para reservar
					lugares precisas de verificar a identidade; para vender lugares,
					precisas também de ter uma viatura verificada.
				</p>
			</header>

			{isPending ? (
				<div className="flex flex-col gap-4">
					<Card className="h-64 p-6" />
					<Card className="h-64 p-6" />
				</div>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					<KycForm side="passenger" state={data?.passenger ?? null} />
					<KycForm side="driver" state={data?.driver ?? null} />
				</div>
			)}
		</div>
	);
}

function KycForm({ side, state }: { side: Side; state: KycState | null }) {
	const isPassenger = side === 'passenger';

	/**
	 * A que lado do KYC o ficheiro pertence.
	 *
	 * Não é um detalhe: o backend guarda o ficheiro ligado ao `ownerType` que
	 * recebe, e é por isso que consegue mostrar o BI de um passageiro sem ir
	 * buscar o da carta de condução. Um BI de passageiro carregado como
	 * `DRIVER_KYC` acabaria ligado ao formulário errado — e apareceria do lado
	 * errado, ou não apareceria.
	 */
	const ownerType = isPassenger ? 'PASSENGER_KYC' : 'DRIVER_KYC';
	const status = state?.status ?? 'NOT_SUBMITTED';

	const [fullName, setFullName] = useState('');
	const [biNumber, setBiNumber] = useState('');
	const [licenseNumber, setLicenseNumber] = useState('');
	const [licenseExpiry, setLicenseExpiry] = useState('');

	const [biFront, setBiFront] = useState<string | null>(null);
	const [biBack, setBiBack] = useState<string | null>(null);
	const [selfies, setSelfies] = useState<string[]>([]);
	const [license, setLicense] = useState<string | null>(null);

	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const queryClient = useQueryClient();

	const submit = useMutation({
		mutationFn: async () => {
			const mediaIds = {
				biFront: biFront as string,
				biBack: biBack as string,
				selfies,
				...(isPassenger ? {} : { license: license ?? undefined }),
			};

			return isPassenger
				? api.submitPassengerKyc({
						fullName: fullName.trim(),
						biNumber: biNumber.trim(),
						mediaIds: {
							biFront: mediaIds.biFront,
							biBack: mediaIds.biBack,
							selfies,
						},
					})
				: api.submitDriverKyc({
						fullName: fullName.trim(),
						biNumber: biNumber.trim(),
						licenseNumber: licenseNumber.trim() || undefined,
						licenseExpiry: licenseExpiry || undefined,
						mediaIds,
					});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.kyc });
			toast.success('Enviado. Fica à espera de revisão.');
		},
		onError: (error: unknown) => {
			toast.error(apiErrorMessage(error, 'Não foi possível enviar.'));
		},
	});

	// Verificado ou pendente: o formulário sai da frente e mostra o estado.
	// Deixar o formulário preenchível encourage quem já passou a enviar de novo
	// e a ficar à espera de um resultado que nunca chega.
	const locked = status === 'VERIFIED' || status === 'PENDING';

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const problems: Record<string, string | null> = {
			fullName: fullName.trim() ? null : 'Escreve o nome como está no BI.',
			biNumber: biNumber.trim() ? null : 'Escreve o número do BI.',
			biFront: biFront ? null : 'Carrega a frente do BI.',
			biBack: biBack ? null : 'Carrega o verso do BI.',
			selfies:
				selfies.length >= 2
					? null
					: 'Carrega pelo menos duas fotografias tuas.',
			license:
				!isPassenger && !license ? 'Carrega a carta de condução.' : null,
		};

		setErrors(problems);
		if (Object.values(problems).some(Boolean)) return;

		submit.mutate();
	}

	return (
		<Card className="flex flex-col p-6">
			<header className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-h3 text-ink">
						{isPassenger ? 'Como passageiro' : 'Como motorista'}
					</h2>
					<p className="mt-1.5 text-small text-muted">
						{isPassenger
							? 'Precisas disto para reservar lugares.'
							: 'Precisas disto, e de uma viatura verificada, para vender lugares.'}
					</p>
				</div>

				<StatusStamp status={status} />
			</header>

			{status === 'REJECTED' ? (
				<p className="mt-5 rounded-md bg-alert-soft px-4 py-3 text-small text-alert">
					{state?.rejectionReason
						? `Recusado: ${state.rejectionReason}`
						: 'Recusado. Vê os documentos e tenta de novo.'}
				</p>
			) : null}

			{status === 'VERIFIED' ? (
				<div className="mt-8 flex flex-col items-center gap-3 rounded-md bg-ok-soft px-4 py-8 text-center">
					<Check size={28} className="text-ok" aria-hidden="true" />
					<p className="text-body text-ok">
						Verificado.{' '}
						{isPassenger ? 'Já podes reservar.' : 'Já podes publicar.'}
					</p>
				</div>
			) : null}

			{locked && status === 'PENDING' ? (
				<div className="mt-8 rounded-md bg-caution px-4 py-6 text-center">
					<p className="text-body text-caution-ink">
						Em análise. Avisamos-te assim que houver resposta.
					</p>
				</div>
			) : null}

			{!locked ? (
				<form
					onSubmit={handleSubmit}
					noValidate
					className="mt-6 flex flex-col gap-5"
				>
					<Field
						label="Nome completo"
						value={fullName}
						onChange={(event) => setFullName(event.target.value)}
						autoComplete="name"
						hint="Tal como está no teu BI."
						error={errors.fullName}
					/>

					<Field
						label="Número do BI"
						value={biNumber}
						onChange={(event) =>
							setBiNumber(event.target.value.toUpperCase())
						}
						placeholder="000000000L041"
						className="font-mono"
						error={errors.biNumber}
					/>

					<UploadRow
						label="BI — frente"
						fileId={biFront}
						onUploaded={setBiFront}
						error={errors.biFront}
						ownerType={ownerType}
					/>

					<UploadRow
						label="BI — verso"
						fileId={biBack}
						onUploaded={setBiBack}
						error={errors.biBack}
						ownerType={ownerType}
					/>

					<div>
						<label className="text-label text-ink">
							Fotografias tuas
						</label>
						<p className="mt-1 text-small text-muted">
							Duas: uma de frente, outra de perfil. Com luz boa e o
							rosto descoberto.
						</p>
						<div className="mt-2 flex flex-wrap gap-3">
							{selfies.map((id, index) => (
								<UploadedFile
									key={id}
									onRemove={() =>
										setSelfies((current) =>
											current.filter(
												(_, position) => position !== index,
											),
										)
									}
								/>
							))}

							{selfies.length < 3 ? (
								<UploadButton
									onUploaded={(id) =>
										setSelfies((current) => [...current, id])
									}
									label={`Fotografia ${selfies.length + 1}`}
									ownerType={ownerType}
								/>
							) : null}
						</div>
						{errors.selfies ? (
							<p
								role="alert"
								className="mt-1.5 text-small text-alert"
							>
								{errors.selfies}
							</p>
						) : null}
					</div>

					{!isPassenger ? (
						<>
							<Field
								label="Número da carta"
								value={licenseNumber}
								onChange={(event) =>
									setLicenseNumber(event.target.value)
								}
								placeholder="Opcional"
								className="font-mono"
							/>

							<Field
								label="Validade da carta"
								type="date"
								value={licenseExpiry}
								onChange={(event) =>
									setLicenseExpiry(event.target.value)
								}
							/>

							<UploadRow
								label="Carta de condução"
								fileId={license}
								onUploaded={setLicense}
								error={errors.license}
								ownerType="DRIVER_KYC"
							/>
						</>
					) : null}

					<Button type="submit" full disabled={submit.isPending}>
						{submit.isPending
							? 'A enviar…'
							: status === 'REJECTED'
								? 'Reenviar'
								: 'Enviar para revisão'}
					</Button>
				</form>
			) : null}
		</Card>
	);
}

/**
 * Uma linha de upload.
 *
 * O upload tem três passos (assinatura, envio ao Cloudinary, confirmação) e
 * por isso é assíncrono e pode falhar a meio. A linha mostra o ficheiro que já
 * está carregado e só deixa avançar quando todos estão lá — em vez de um botão
 * "Enviar" que falha no servidor por falta de meio documento.
 */
function UploadRow({
	label,
	fileId,
	onUploaded,
	error,
	ownerType,
}: {
	label: string;
	fileId: string | null;
	onUploaded: (id: string) => void;
	error?: string | null;
	ownerType: 'DRIVER_KYC' | 'PASSENGER_KYC';
}) {
	return (
		<div>
			<label className="text-label text-ink">{label}</label>

			<div className="mt-2">
				{fileId ? (
					<UploadedFile onRemove={() => onUploaded('')} />
				) : (
					<UploadButton
						onUploaded={onUploaded}
						label={label}
						ownerType={ownerType}
					/>
				)}
			</div>

			{error ? (
				<p role="alert" className="mt-1.5 text-small text-alert">
					{error}
				</p>
			) : null}
		</div>
	);
}

function UploadButton({
	onUploaded,
	label,
	ownerType,
}: {
	onUploaded: (id: string) => void;
	label: string;
	ownerType: 'DRIVER_KYC' | 'PASSENGER_KYC';
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);

	async function handleFile(file: File) {
		setBusy(true);
		try {
			const mediaId = await api.uploadImage(file, ownerType);
			onUploaded(mediaId);
		} catch (error) {
			toast.error(
				apiErrorMessage(error, 'Não foi possível carregar a imagem.'),
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			{/*
			 * O input fica escondido e o botão é um `<label>` que o dispara.
			 * Um botão com `onClick` a chamar `input.click()` funciona, mas o
			 * teclado não chega lá: sem input no fluxo, o `Tab` passa ao
			 * instrução seguinte e o ficheiro nunca abre.
			 */}
			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				className="sr-only"
				disabled={busy}
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) void handleFile(file);
					// Limpar o valor permite escolher o mesmo ficheiro outra vez
					// depois de o trocar — sem isto, o `change` não dispara.
					event.target.value = '';
				}}
			/>

			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				disabled={busy}
				// O `label` entra aqui como nome acessível. O texto do botão é
				// "Escolher imagem", que por si só não diz *que* imagem.
				aria-label={`Escolher imagem: ${label}`}
				className="inline-flex h-11 items-center gap-2 rounded-md border border-dashed border-line px-4 text-body text-muted transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50"
			>
				<Upload size={16} aria-hidden="true" />
				{busy ? 'A carregar…' : 'Escolher imagem'}
			</button>
		</>
	);
}

function UploadedFile({ onRemove }: { onRemove: () => void }) {
	return (
		<span className="inline-flex h-11 items-center gap-2 rounded-md bg-ok-soft px-4 text-small text-ok">
			<IdCard size={16} aria-hidden="true" />
			Carregada
			<button
				type="button"
				onClick={onRemove}
				aria-label="Trocar imagem"
				className="rounded-sm p-0.5 transition-colors hover:text-alert"
			>
				<X size={14} aria-hidden="true" />
			</button>
		</span>
	);
}
