import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useProvinces, useLocalityOptions } from '../../hooks/useLocalities';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { RoadTrack } from '../../components/marketing/RoadTrack';
import { SeatGrid } from '../../components/ui/SeatGrid';
import { formatKzInput, parseKzInput, fmtKz, toDateInput } from '../../lib/format';
import type { Vehicle } from '../../types/api';

/*
 * Publicar uma boleia em três passos.
 *
 * Num ecrã largo cabia tudo numa página — é isso que um formulário único faria.
 * Mas aqui a pessoa está a decidir três coisas independentes (para onde,
 * quanto cobra, que viatura) e o custo de uma resposta errada é alto:
 * publicar com a hora errada dá corridas cheias com gente que não consegue
 * apanhar. Separar dá a cada decisão o seu ecrã, e o botão "voltar" não
 * perde o que já foi preenchido — que é o que estraga a experiência de wizard.
 */
export function PublishRidePage() {
	usePageTitle('Publicar boleia');

	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [step, setStep] = useState(0);
	const [busy, setBusy] = useState(false);

	// Rota e dia
	const [originProvince, setOriginProvince] = useState('');
	const [originLocality, setOriginLocality] = useState('');
	const [destProvince, setDestProvince] = useState('');
	const [destLocality, setDestLocality] = useState('');
	const [date, setDate] = useState(toDateInput(new Date().toISOString()));
	const [departTime, setDepartTime] = useState('06:00');
	const [duration, setDuration] = useState('360');

	// Preço e viatura
	const [seatsTotal, setSeatsTotal] = useState('8');
	const [price, setPrice] = useState('');
	const [vehicleId, setVehicleId] = useState('');

	const { data: provinces = [] } = useProvinces();
	const provinceOptions = provinces.map((province) => ({
		value: province.id,
		label: province.name,
	}));

	const origin = useLocalityOptions(originProvince || null);
	const destination = useLocalityOptions(destProvince || null);

	const { data: vehicles = [] } = useQuery({
		queryKey: qk.vehicles,
		queryFn: api.fetchMyVehicles,
	});

	const verifiedVehicles = vehicles.filter((v) => v.status === 'VERIFIED');

	const originName =
		origin.options.find((o) => o.value === originLocality)?.label ?? '';
	const destName =
		destination.options.find((o) => o.value === destLocality)?.label ?? '';
	const vehicle = verifiedVehicles.find((v) => v.id === vehicleId);
	const priceValue = parseKzInput(price);

	function canLeaveStep0(): boolean {
		if (!originLocality || !destLocality) {
			toast.error('Escolhe a origem e o destino.');
			return false;
		}
		if (originLocality === destLocality) {
			toast.error('A origem e o destino não podem ser o mesmo sítio.');
			return false;
		}
		if (!date) {
			toast.error('Escolhe o dia da viagem.');
			return false;
		}
		return true;
	}

	function canLeaveStep1(): boolean {
		if (!vehicleId) {
			toast.error('Escolhe a viatura que faz a viagem.');
			return false;
		}
		if (priceValue <= 0) {
			toast.error('Escreve o preço por lugar.');
			return false;
		}
		if (Number(seatsTotal) < 1) {
			toast.error('A viatura tem de ter pelo menos um lugar.');
			return false;
		}
		return true;
	}

	async function publish() {
		setBusy(true);
		try {
			const departure = new Date(`${date}T${departTime}:00`);
			const arrival = new Date(
				departure.getTime() + Number(duration) * 60000,
			);

			const ride = await api.createRide({
				vehicleId,
				originLocalityId: originLocality,
				destinationLocalityId: destLocality,
				departureAt: departure.toISOString(),
				arrivalAt: arrival.toISOString(),
				pricePerSeat: priceValue,
				seatsTotal: Number(seatsTotal),
			});

			queryClient.invalidateQueries({ queryKey: qk.myRides });
			queryClient.invalidateQueries({ queryKey: ['rides'] });

			toast.success('Boleia publicada. Já aparece para quem procura.');
			navigate(`/app/viagens/${ride.id}`, { replace: true });
		} catch (error) {
			toast.error(
				apiErrorMessage(error, 'Não foi possível publicar a boleia.'),
			);
		} finally {
			setBusy(false);
		}
	}

	const steps = ['Rota e dia', 'Preço e viatura', 'Rever'];

	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="text-h2 text-ink">Publicar uma boleia</h1>

				{/*
				 * Os passos são mostrados como texto com um número, não como uma
				 * barra de progresso com percentagens. Três passos não têm
				 * percentagem que valha a pena calcular, e um número lê-se sem
				 * pensar.
				 */}
				<ol className="mt-4 flex items-center gap-2" aria-label="Passos">
					{steps.map((label, index) => (
						<li key={label} className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => index < step && setStep(index)}
								disabled={index > step}
								className={[
									'flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 transition-colors',
									index === step
										? 'bg-brand text-brand-ink'
										: index < step
											? 'bg-ok-soft text-ok'
											: 'bg-canvas text-muted',
								].join(' ')}
								aria-current={index === step ? 'step' : undefined}
							>
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-small font-medium">
									{index < step ? (
										<Check size={12} aria-hidden="true" />
									) : (
										index + 1
									)}
								</span>
								<span className="text-small font-medium">
									{label}
								</span>
							</button>
							{index < steps.length - 1 ? (
								<span
									aria-hidden="true"
									className="h-px w-4 bg-line"
								/>
							) : null}
						</li>
					))}
				</ol>
			</header>

			{/* Passo 1 — rota e dia. */}
			{step === 0 ? (
				<Card className="flex flex-col gap-6 p-6">
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="flex flex-col gap-4">
							<h2 className="text-h3 text-ink">Saída</h2>
							<Select
								label="Província"
								value={originProvince}
								onChange={(value) => {
									setOriginProvince(value);
									setOriginLocality('');
								}}
								options={provinceOptions}
								placeholder="Escolhe"
							/>
							<Select
								label="Cidade"
								value={originLocality}
								onChange={setOriginLocality}
								options={origin.options}
								placeholder={
									origin.isPending ? 'A carregar…' : 'Escolhe'
								}
								disabled={!originProvince}
							/>
						</div>

						<div className="flex flex-col gap-4">
							<h2 className="text-h3 text-ink">Chegada</h2>
							<Select
								label="Província"
								value={destProvince}
								onChange={(value) => {
									setDestProvince(value);
									setDestLocality('');
								}}
								options={provinceOptions}
								placeholder="Escolhe"
							/>
							<Select
								label="Cidade"
								value={destLocality}
								onChange={setDestLocality}
								options={destination.options}
								placeholder={
									destination.isPending
										? 'A carregar…'
										: 'Escolhe'
								}
								disabled={!destProvince}
							/>
						</div>
					</div>

					<div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
						<Field
							label="Dia"
							type="date"
							value={date}
							onChange={(event) => setDate(event.target.value)}
						/>
						<Field
							label="Hora de saída"
							type="time"
							value={departTime}
							onChange={(event) => setDepartTime(event.target.value)}
						/>
						<div>
							<label
								htmlFor="duracao"
								className="text-label text-ink"
							>
								Duração da viagem
							</label>
							<select
								id="duracao"
								value={duration}
								onChange={(event) =>
									setDuration(event.target.value)
								}
								className="mt-1.5 h-11 w-full rounded-md border border-line bg-surface px-3 text-body text-ink focus:border-brand"
							>
								<option value="120">2 horas</option>
								<option value="240">4 horas</option>
								<option value="360">6 horas</option>
								<option value="480">8 horas</option>
								<option value="600">10 horas</option>
							</select>
						</div>
					</div>

					<StepFooter
						onNext={() => canLeaveStep0() && setStep(1)}
						nextLabel="Preço e viatura"
					/>
				</Card>
			) : null}

			{/* Passo 2 — preço e viatura. */}
			{step === 1 ? (
				<Card className="flex flex-col gap-6 p-6">
					<div className="flex flex-col gap-4">
						<h2 className="text-h3 text-ink">Lugares e preço</h2>

						<div className="grid gap-5 sm:grid-cols-2">
							<div>
								<label
									htmlFor="lugares"
									className="text-label text-ink"
								>
									Lugares disponíveis
								</label>
								<input
									id="lugares"
									type="number"
									min={1}
									max={vehicle?.seats ?? 20}
									value={seatsTotal}
									onChange={(event) =>
										setSeatsTotal(event.target.value)
									}
									className="mt-1.5 h-11 w-full rounded-md border border-line bg-surface px-3 text-body text-ink focus:border-brand"
								/>
								{vehicle ? (
									<p className="mt-1.5 text-small text-muted">
										A {vehicle.make} {vehicle.model} tem{' '}
										{vehicle.seats} lugares.
									</p>
								) : null}
							</div>

							<Field
								label="Preço por lugar (Kz)"
								value={price}
								onChange={(event) =>
									setPrice(formatKzInput(event.target.value))
								}
								inputMode="numeric"
								placeholder="8 500"
							/>
						</div>

						<SeatGrid
							total={Number(seatsTotal) || 0}
							taken={0}
							showLabel={false}
						/>
					</div>

					<div className="flex flex-col gap-4 border-t border-line pt-6">
						<h2 className="text-h3 text-ink">Viatura</h2>

						{verifiedVehicles.length === 0 ? (
							<div className="rounded-md bg-canvas p-4">
								<p className="text-body text-ink">
									Tens {vehicles.length} viatura
									{vehicles.length === 1 ? '' : 's'} registada
									{vehicles.length === 1 ? '' : 's'}, mas nenhuma
									está verificada.
								</p>
								<p className="mt-1.5 text-small text-muted">
									Regista e passa a viatura em{' '}
									<a
										className="text-brand-text underline"
										href="/app/viaturas"
									>
										Viaturas
									</a>{' '}
									para poder publicar.
								</p>
							</div>
						) : (
							<div className="grid gap-3 sm:grid-cols-2">
								{verifiedVehicles.map((v) => (
									<VehicleOption
										key={v.id}
										vehicle={v}
										selected={vehicleId === v.id}
										onSelect={() => {
											setVehicleId(v.id);
											if (Number(seatsTotal) > v.seats) {
												setSeatsTotal(String(v.seats));
											}
										}}
									/>
								))}
							</div>
						)}
					</div>

					<StepFooter
						onBack={() => setStep(0)}
						onNext={() => canLeaveStep1() && setStep(2)}
						nextLabel="Rever"
					/>
				</Card>
			) : null}

			{/* Passo 3 — rever. */}
			{step === 2 ? (
				<Card className="flex flex-col gap-6 p-6">
					<div>
						<h2 className="text-h3 text-ink">Confirmar</h2>
						<p className="mt-1.5 text-body text-muted">
							Confere antes de publicar. Depois de publicares, a
							boleia fica visível para quem procura e os lugares
							começam a ser reservados.
						</p>
					</div>

					<div className="border-y border-line py-6">
						<RoadTrack
							animate={false}
							height={140}
							stops={[
								{ name: originName, time: departTime },
								{ name: destName, time: '—' },
							]}
						/>
					</div>

					<dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
						<SummaryItem
							label="Dia"
							value={
								date
									? new Date(date).toLocaleDateString('pt-PT', {
											day: 'numeric',
											month: 'long',
											year: 'numeric',
										})
									: '—'
							}
						/>
						<SummaryItem label="Saída" value={departTime} />
						<SummaryItem label="Lugares" value={seatsTotal} />
						<SummaryItem
							label="Preço por lugar"
							value={fmtKz(priceValue)}
						/>
						<SummaryItem
							label="Viatura"
							value={
								vehicle
									? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`
									: '—'
							}
						/>
						<SummaryItem
							label="Total se encher"
							value={fmtKz(Number(seatsTotal) * priceValue)}
						/>
					</dl>

					<StepFooter
						onBack={() => setStep(1)}
						onNext={publish}
						nextLabel={busy ? 'A publicar…' : 'Publicar boleia'}
						disabled={busy}
					/>
				</Card>
			) : null}
		</div>
	);
}

function StepFooter({
	onBack,
	onNext,
	nextLabel,
	disabled = false,
}: {
	onBack?: () => void;
	onNext: () => void;
	nextLabel: string;
	disabled?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-t border-line pt-6">
			{onBack ? (
				<Button variant="ghost" onClick={onBack}>
					<ArrowLeft size={16} aria-hidden="true" />
					Voltar
				</Button>
			) : (
				<span />
			)}

			<Button onClick={onNext} disabled={disabled}>
				{nextLabel}
				{nextLabel !== 'A publicar…' ? (
					<ArrowRight size={16} aria-hidden="true" />
				) : null}
			</Button>
		</div>
	);
}

function VehicleOption({
	vehicle,
	selected,
	onSelect,
}: {
	vehicle: Vehicle;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={[
				'rounded-md border p-4 text-left transition-colors',
				selected
					? 'border-brand bg-brand-soft'
					: 'border-line bg-surface hover:bg-canvas',
			].join(' ')}
		>
			<p className="text-body text-ink">
				{vehicle.make} {vehicle.model}
			</p>
			<p className="font-mono text-data text-muted">
				{vehicle.plate} · {vehicle.seats} lugares
			</p>
		</button>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-small text-muted">{label}</dt>
			<dd className="mt-0.5 text-body text-ink">{value}</dd>
		</div>
	);
}
