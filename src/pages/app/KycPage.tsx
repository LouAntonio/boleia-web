import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, IdCard, ShieldQuestion, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useKycMe } from '../../hooks/useKyc';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageMeta';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusStamp } from '../../components/ui/StatusStamp';
import type { KycState } from '../../types/api';

type Side = 'passenger' | 'driver';

type SingleField = 'biFront' | 'biBack' | 'bodyPhoto' | 'license';

type UploadItem =
	{ field: SingleField; file: File } | { field: 'selfie'; file: File };

export function KycPage() {
	usePageTitle('Verificação de identidade');

	const { data, isPending, isError, refetch } = useKycMe();

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
			) : null}

			{/*
			 * `data?.passenger ?? null` é o estado "ainda não verificaste", e é
			 * isso que uma falha de rede não é. Sem este ramo, uma API em baixo
			 * abria os dois formulários vazios, e recarregar o BI lá dentro
			 * seria trabalho perdido — ou um pedido que o servidor rejeita.
			 */}
			{isError ? (
				<EmptyState
					icon={<ShieldQuestion size={32} />}
					title="Não foi possível carregar a verificação"
					description="O servidor não respondeu. O teu estado de verificação continua o que está."
					action={
						<Button variant="secondary" onClick={() => refetch()}>
							Tentar de novo
						</Button>
					}
				/>
			) : null}

			{!isPending && !isError ? (
				<div className="grid gap-6 lg:grid-cols-2">
					<KycForm side="passenger" state={data?.passenger ?? null} />
					<KycForm side="driver" state={data?.driver ?? null} />
				</div>
			) : null}
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

	const [biFront, setBiFront] = useState<File | null>(null);
	const [biBack, setBiBack] = useState<File | null>(null);
	const [selfies, setSelfies] = useState<File[]>([]);
	const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
	const [license, setLicense] = useState<File | null>(null);
	const [progress, setProgress] = useState<string | null>(null);

	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const queryClient = useQueryClient();

	/**
	 * A submissão é **só** documentos.
	 *
	 * O nome, o número do BI e os dados da carta deixaram de ser pedidos como
	 * texto. Nada os validava contra o documento, e o painel mostrava um número
	 * que ninguém tinha conferido. O revisor vê as fotografias e o nome da
	 * conta — que já existe e não precisa de ser reescrito.
	 *
	 * Os ficheiros ficam no browser até este momento. Carregar no instante em
	 * que são escolhidos deixava documentos no Cloudinary de formulários que
	 * nunca chegaram a ser enviados, e dava ao botão "Escolher imagem" a
	 * responsabilidade de uma operação de rede que pode falhar.
	 */
	const submit = useMutation({
		mutationFn: async () => {
			if (!biFront || !biBack) {
				throw new Error('Carrega a frente e o verso do BI.');
			}

			const queue: UploadItem[] = [
				{ field: 'biFront', file: biFront },
				{ field: 'biBack', file: biBack },
				...selfies.map((file): UploadItem => ({ field: 'selfie', file })),
			];

			if (isPassenger) {
				if (!bodyPhoto) {
					throw new Error('Carrega a foto de corpo inteiro.');
				}
				queue.push({ field: 'bodyPhoto', file: bodyPhoto });
			} else {
				if (!license) {
					throw new Error('Carrega a carta de condução.');
				}
				queue.push({ field: 'license', file: license });
			}

			const single: Partial<Record<SingleField, string>> = {};
			const selfieIds: string[] = [];
			let sent = 0;

			for (const item of queue) {
				setProgress(`A enviar ${sent + 1}/${queue.length}…`);
				const { mediaId } = await api.uploadImage(item.file, ownerType);
				sent += 1;
				if (item.field === 'selfie') selfieIds.push(mediaId);
				else single[item.field] = mediaId;
			}

			const mediaIds = {
				biFront: single.biFront as string,
				biBack: single.biBack as string,
				selfies: selfieIds,
				...(isPassenger
					? { bodyPhoto: single.bodyPhoto as string }
					: { license: single.license }),
			};

			return isPassenger
				? api.submitPassengerKyc({ mediaIds })
				: api.submitDriverKyc({ mediaIds });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.kyc });
			toast.success('Enviado. Fica à espera de revisão.');
		},
		onError: (error: unknown) => {
			toast.error(apiErrorMessage(error, 'Não foi possível enviar.'));
		},
		onSettled: () => setProgress(null),
	});

	// Verificado ou pendente: o formulário sai da frente e mostra o estado.
	// Deixar o formulário preenchível encourage quem já passou a enviar de novo
	// e a ficar à espera de um resultado que nunca chega.
	const locked = status === 'VERIFIED' || status === 'PENDING';

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const problems: Record<string, string | null> = {
			biFront: biFront ? null : 'Carrega a frente do BI.',
			biBack: biBack ? null : 'Carrega o verso do BI.',
			selfies:
				selfies.length >= 2
					? null
					: 'Carrega pelo menos duas fotografias tuas.',
			bodyPhoto:
				isPassenger && !bodyPhoto
					? 'Carrega a foto de corpo inteiro.'
					: null,
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
					<UploadRow
						label="BI — frente"
						file={biFront}
						onChange={setBiFront}
						error={errors.biFront}
					/>

					<UploadRow
						label="BI — verso"
						file={biBack}
						onChange={setBiBack}
						error={errors.biBack}
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
							{selfies.map((file, index) => (
								<SelectedFile
									key={`${file.name}-${file.lastModified}-${index}`}
									file={file}
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
									onSelect={(file) =>
										setSelfies((current) => [...current, file])
									}
									label={`Fotografia ${selfies.length + 1}`}
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

					{isPassenger ? (
						<UploadRow
							label="Foto de corpo inteiro"
							file={bodyPhoto}
							onChange={setBodyPhoto}
							error={errors.bodyPhoto}
							hint="De corpo inteiro, da cabeça aos pés, para se ver que és tu."
						/>
					) : null}

					{!isPassenger ? (
						<UploadRow
							label="Carta de condução"
							file={license}
							onChange={setLicense}
							error={errors.license}
						/>
					) : null}

					<Button type="submit" full disabled={submit.isPending}>
						{submit.isPending
							? (progress ?? 'A enviar…')
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
	file,
	onChange,
	error,
	hint,
}: {
	label: string;
	file: File | null;
	onChange: (file: File | null) => void;
	error?: string | null;
	hint?: string;
}) {
	return (
		<div>
			<label className="text-label text-ink">{label}</label>

			{hint ? <p className="mt-1 text-small text-muted">{hint}</p> : null}

			<div className="mt-2">
				{file ? (
					<SelectedFile file={file} onRemove={() => onChange(null)} />
				) : (
					<UploadButton onSelect={onChange} label={label} />
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

/**
 * Escolhe um ficheiro do disco — e **só isso**.
 *
 * Não faz rede: o upload acontece no submit do formulário, com todos os
 * documentos de uma vez. Antes disto, escolher a frente do BI já a mandava para
 * o Cloudinary, e quem desistisse a meio deixava ficheiros pendurados.
 */
function UploadButton({
	onSelect,
	label,
}: {
	onSelect: (file: File) => void;
	label: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

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
				onChange={(event) => {
					const file = event.target.files?.[0];
					// Limpar o valor permite escolher o mesmo ficheiro outra vez
					// depois de o trocar — sem isto, o `change` não dispara.
					event.target.value = '';
					if (file) onSelect(file);
				}}
			/>

			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				// O `label` entra aqui como nome acessível. O texto do botão é
				// "Escolher imagem", que por si só não diz *que* imagem.
				aria-label={`Escolher imagem: ${label}`}
				className="inline-flex h-11 items-center gap-2 rounded-md border border-dashed border-line px-4 text-body text-muted transition-colors hover:border-brand hover:text-brand-text"
			>
				<Upload size={16} aria-hidden="true" />
				Escolher imagem
			</button>
		</>
	);
}

/** Ficheiro escolhido mas **ainda não enviado**, com miniatura local. */
function SelectedFile({ file, onRemove }: { file: File; onRemove: () => void }) {
	const preview = useObjectUrl(file);

	return (
		<span className="inline-flex h-11 max-w-full items-center gap-2 rounded-md border border-line bg-canvas px-3 text-small text-ink">
			{preview ? (
				<img
					src={preview}
					alt=""
					className="h-7 w-7 shrink-0 rounded object-cover"
				/>
			) : (
				<IdCard size={16} aria-hidden="true" className="shrink-0" />
			)}
			<span className="max-w-40 truncate" title={file.name}>
				{file.name}
			</span>
			<button
				type="button"
				onClick={onRemove}
				aria-label={`Remover ${file.name}`}
				className="shrink-0 rounded-sm p-0.5 text-muted transition-colors hover:text-alert"
			>
				<X size={14} aria-hidden="true" />
			</button>
		</span>
	);
}
