import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BusFront, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageMeta';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { PhotoPicker } from '../../components/rides/PhotoPicker';

const EMPTY = { make: '', model: '', color: '', plate: '', seats: '' };

export function VehiclesPage() {
	usePageTitle('Viaturas');

	const {
		data: vehicles,
		isPending,
		isError,
		refetch,
	} = useQuery({
		queryKey: qk.vehicles,
		queryFn: api.fetchMyVehicles,
	});

	const [adding, setAdding] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);

	const list = vehicles ?? [];

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-h2 text-ink">As minhas viaturas</h1>
					<p className="mt-2 text-body text-muted">
						Só uma viatura verificada pode fazer uma boleia.
					</p>
				</div>

				<Button onClick={() => setAdding(true)}>
					<Plus size={16} aria-hidden="true" />
					Registar viatura
				</Button>
			</header>

			{isPending ? (
				<div className="flex flex-col gap-4">
					<SkeletonLine className="h-28 w-full" />
					<SkeletonLine className="h-28 w-full" />
				</div>
			) : null}

			{/*
			 * Falha e "não tens viaturas" são coisas diferentes: a segunda
			 * manda a pessoa criar uma viatura que já existe. Sem este ramo,
			 * uma API em baixo mostrava o estado vazio e nada mais.
			 */}
			{isError ? (
				<EmptyState
					icon={<BusFront size={32} />}
					title="Não foi possível carregar as viaturas"
					description="O servidor não respondeu. As tuas viaturas continuam registadas."
					action={
						<Button variant="secondary" onClick={() => refetch()}>
							Tentar de novo
						</Button>
					}
				/>
			) : null}

			{!isPending && !isError && list.length === 0 ? (
				<EmptyState
					icon={<BusFront size={32} />}
					title="Sem viaturas registadas"
					description="Regista marca, modelo e matrícula. Depois de passar em revisão, podes vender lugares nela."
					action={
						<Button onClick={() => setAdding(true)}>
							Registar a primeira
						</Button>
					}
				/>
			) : null}

			{!isPending && !isError && list.length > 0 ? (
				<ul className="grid gap-4 sm:grid-cols-2">
					{list.map((vehicle) => (
						<li key={vehicle.id}>
							<Card className="flex h-full flex-col p-5">
								<div className="flex items-start justify-between gap-3">
									<div>
										<h2 className="text-h3 text-ink">
											{vehicle.make} {vehicle.model}
										</h2>
										<p className="mt-1 font-mono text-data text-muted">
											{vehicle.plate}
										</p>
									</div>
									<StatusStamp status={vehicle.status} />
								</div>

								<dl className="mt-4 flex gap-6 text-small">
									<div>
										<dt className="text-muted">Cor</dt>
										<dd className="mt-0.5 text-ink">
											{vehicle.color}
										</dd>
									</div>
									<div>
										<dt className="text-muted">Lugares</dt>
										<dd className="mt-0.5 text-ink">
											{vehicle.seats}
										</dd>
									</div>
								</dl>

								{vehicle.status === 'PENDING' ? (
									<p className="mt-4 rounded-md bg-canvas px-3 py-2 text-small text-muted">
										Em revisão. Assim que passar, podes publicar
										boleias nela.
									</p>
								) : null}

								{vehicle.status === 'REJECTED' ? (
									<p className="mt-4 rounded-md bg-alert-soft px-3 py-2 text-small text-alert">
										Recusada. Apaga-a e volta a registar com os
										dados correctos.
									</p>
								) : null}

								<div className="mt-auto pt-5">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setDeleting(vehicle.id)}
									>
										<Trash2 size={15} aria-hidden="true" />
										Apagar
									</Button>
								</div>
							</Card>
						</li>
					))}
				</ul>
			) : null}

			{adding ? <AddVehicleDialog onClose={() => setAdding(false)} /> : null}

			{deleting ? (
				<DeleteVehicleDialog
					id={deleting}
					onClose={() => setDeleting(null)}
				/>
			) : null}
		</div>
	);
}

function AddVehicleDialog({ onClose }: { onClose: () => void }) {
	const queryClient = useQueryClient();
	const [form, setForm] = useState(EMPTY);
	const [photos, setPhotos] = useState<File[]>([]);
	const [progress, setProgress] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const create = useMutation({
		/*
		 * O upload acontece aqui, e não no `PhotoPicker`.
		 *
		 * `isPending` passa a cobrir upload + `POST /api/vehicles`: o modal não
		 * fecha a meio, o botão diz em que foto vai, e uma falha de rede não
		 * deixa fotos de uma viatura que ninguém chegou a registar.
		 */
		mutationFn: async ({
			files,
			...input
		}: Omit<api.CreateVehicleInput, 'photoIds'> & { files: File[] }) => {
			const photoIds = await api.uploadImages(
				files,
				'VEHICLE',
				(done, total) => setProgress(`A enviar foto ${done}/${total}…`),
			);
			return api.createVehicle({ ...input, photoIds });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.vehicles });
			toast.success('Viatura registada. Fica à espera de revisão.');
			onClose();
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível registar a viatura.'),
			);
		},
		onSettled: () => setProgress(null),
	});

	function submit(event: React.FormEvent) {
		event.preventDefault();

		/*
		 * Os limites espelham `vehicles.service.ts`: `cleanSeats` aceita 2 a
		 * 30 e `cleanPlate` exige 6 caracteres. A versão anterior validava
		 * `seats >= 1` e matrícula não vazia, pelo que a pessoa preenchia tudo,
		 * carregava em "Registar" e recebia um erro do servidor. A validação
		 * do lado do servidor não se mexe — esta é só para não haver ida e
		 * volta.
		 */
		const seats = Number(form.seats);
		const problems: Record<string, string | null> = {
			make: form.make.trim() ? null : 'Escreve a marca.',
			model: form.model.trim() ? null : 'Escreve o modelo.',
			color: form.color.trim() ? null : 'Escreve a cor.',
			plate:
				form.plate.trim().length >= 6
					? null
					: 'A matrícula tem pelo menos 6 caracteres.',
			seats:
				Number.isInteger(seats) && seats >= 2 && seats <= 30
					? null
					: 'A lotação tem de estar entre 2 e 30.',
			photos:
				photos.length >= 3
					? null
					: 'Carrega pelo menos 3 fotografias da viatura.',
		};

		setErrors(problems);
		if (Object.values(problems).some(Boolean)) return;

		create.mutate({
			make: form.make.trim(),
			model: form.model.trim(),
			color: form.color.trim(),
			plate: form.plate.trim().toUpperCase(),
			seats,
			files: photos,
		});
	}

	return (
		<Modal
			title="Registar uma viatura"
			description="Fica à espera de revisão antes de poder vender lugares."
			onClose={create.isPending ? undefined : onClose}
		>
			<form onSubmit={submit} noValidate className="flex flex-col gap-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						label="Marca"
						value={form.make}
						onChange={(e) => setForm({ ...form, make: e.target.value })}
						placeholder="Toyota"
						error={errors.make}
					/>
					<Field
						label="Modelo"
						value={form.model}
						onChange={(e) =>
							setForm({ ...form, model: e.target.value })
						}
						placeholder="Hiace"
						error={errors.model}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						label="Cor"
						value={form.color}
						onChange={(e) =>
							setForm({ ...form, color: e.target.value })
						}
						placeholder="Branco"
						error={errors.color}
					/>
					<Field
						label="Matrícula"
						value={form.plate}
						onChange={(e) =>
							setForm({
								...form,
								plate: e.target.value.toUpperCase(),
							})
						}
						placeholder="LD-00-00-LD"
						className="font-mono"
						error={errors.plate}
					/>
				</div>

				<Field
					label="Lugares"
					type="number"
					min={2}
					max={30}
					value={form.seats}
					onChange={(e) => setForm({ ...form, seats: e.target.value })}
					error={errors.seats}
				/>

				<PhotoPicker
					min={3}
					max={6}
					files={photos}
					onChange={setPhotos}
					label="Fotografias da viatura"
					hint="Frente, lateral e interior. São elas que a revisão avalia."
				/>

				{errors.photos ? (
					<p className="text-small text-alert">{errors.photos}</p>
				) : null}

				<div className="flex gap-3">
					<Button
						variant="secondary"
						onClick={onClose}
						disabled={create.isPending}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={create.isPending}>
						{create.isPending
							? (progress ?? 'A registar…')
							: 'Registar viatura'}
					</Button>
				</div>
			</form>
		</Modal>
	);
}

function DeleteVehicleDialog({ id, onClose }: { id: string; onClose: () => void }) {
	const queryClient = useQueryClient();

	const remove = useMutation({
		mutationFn: api.deleteVehicle,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.vehicles });
			toast.success('Viatura apagada');
			onClose();
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível apagar a viatura.'),
			);
		},
	});

	return (
		<Modal
			title="Apagar esta viatura?"
			description="Se a viatura estiver ligada a boleias já publicadas, estas mantêm-se — só a viatura desaparece."
			onClose={remove.isPending ? undefined : onClose}
		>
			<div className="flex gap-3">
				<Button
					variant="secondary"
					onClick={onClose}
					disabled={remove.isPending}
				>
					Manter
				</Button>
				<Button
					variant="danger"
					onClick={() => remove.mutate(id, { onSuccess: onClose })}
					disabled={remove.isPending}
				>
					{remove.isPending ? 'A apagar…' : 'Apagar viatura'}
				</Button>
			</div>
		</Modal>
	);
}
