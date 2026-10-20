import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageMeta';
import { PROVINCES, municipalitiesOf } from '../../lib/locations';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Field } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { RoadTrack } from '../../components/marketing/RoadTrack';
import { SeatGrid } from '../../components/ui/SeatGrid';
import {
	formatKzInput,
	parseKzInput,
	fmtKz,
	fmtDuration,
	toDateInput,
} from '../../lib/format';
import type { Vehicle } from '../../types/api';

type TripMode = 'intermunicipal' | 'interprovincial';

const MODE_OPTIONS: { value: string; label: string }[] = [
	{ value: 'intermunicipal', label: 'Intermunicipal' },
	{ value: 'interprovincial', label: 'Interprovincial' },
];

const MINUTE_OPTIONS = [
	{ value: '0', label: '00' },
	{ value: '30', label: '30' },
];

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

	/*
	 * O modo é uma escolha explícita e sem valor por omissão. A rota não
	 * aparece enquanto não houver modo: em vez de adivinhar pelas províncias,
	 * o formulário diz o que vai pedir e pede a decisão primeiro.
	 */
	const [mode, setMode] = useState<TripMode | null>(null);

	// Intermunicipal: uma província para os dois lados.
	const [municipalProvince, setMunicipalProvince] = useState('');
	const [municipalOrigin, setMunicipalOrigin] = useState('');
	const [municipalDestination, setMunicipalDestination] = useState('');

	// Interprovincial: uma província e um município de cada lado.
	const [provincialOriginProvince, setProvincialOriginProvince] = useState('');
	const [provincialOrigin, setProvincialOrigin] = useState('');
	const [provincialDestinationProvince, setProvincialDestinationProvince] =
		useState('');
	const [provincialDestination, setProvincialDestination] = useState('');

	const [date, setDate] = useState(toDateInput(new Date().toISOString()));
	const [departTime, setDepartTime] = useState('06:00');
	const [durationHours, setDurationHours] = useState('6');
	const [durationMinutes, setDurationMinutes] = useState('0');

	// Preço e viatura
	const [seatsTotal, setSeatsTotal] = useState('8');
	const [price, setPrice] = useState('');
	const [vehicleId, setVehicleId] = useState('');

	const provinceOptions = PROVINCES.map((province) => ({
		value: province.code,
		label: province.name,
	}));

	const fromProvince =
		mode === 'intermunicipal'
			? municipalProvince
			: mode === 'interprovincial'
				? provincialOriginProvince
				: '';
	const toProvince =
		mode === 'intermunicipal'
			? municipalProvince
			: mode === 'interprovincial'
				? provincialDestinationProvince
				: '';
	const fromLocality =
		mode === 'intermunicipal'
			? municipalOrigin
			: mode === 'interprovincial'
				? provincialOrigin
				: '';
	const toLocality =
		mode === 'intermunicipal'
			? municipalDestination
			: mode === 'interprovincial'
				? provincialDestination
				: '';

	const fromOptions = municipalitiesOf(fromProvince).map((municipality) => ({
		value: municipality.code,
		label: municipality.name,
	}));
	const toOptions = municipalitiesOf(toProvince).map((municipality) => ({
		value: municipality.code,
		label: municipality.name,
	}));

	const { data: vehicles = [] } = useQuery({
		queryKey: qk.vehicles,
		queryFn: api.fetchMyVehicles,
	});

	const verifiedVehicles = vehicles.filter((v) => v.status === 'VERIFIED');

	const originName =
		fromOptions.find((o) => o.value === fromLocality)?.label ?? '';
	const destName = toOptions.find((o) => o.value === toLocality)?.label ?? '';
	const originProvinceName =
		PROVINCES.find((p) => p.code === fromProvince)?.name ?? '';
	const destinationProvinceName =
		PROVINCES.find((p) => p.code === toProvince)?.name ?? '';
	const vehicle = verifiedVehicles.find((v) => v.id === vehicleId);
	const priceValue = parseKzInput(price);

	const durationTotal =
		(Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
	const durationValid = durationTotal >= 30 && durationTotal <= 24 * 60;

	const departureDate =
		date && departTime ? new Date(`${date}T${departTime}:00`) : null;
	const arrivalDate =
		departureDate && durationValid
			? new Date(departureDate.getTime() + durationTotal * 60000)
			: null;

	const sameProvince =
		mode === 'interprovincial' &&
		!!fromProvince &&
		!!toProvince &&
		fromProvince === toProvince;

	const routeSummary =
		mode && originName && destName
			? mode === 'intermunicipal'
				? `Intermunicipal · ${originProvinceName}: ${originName} → ${destName}`
				: `Interprovincial · ${originProvinceName} (${originName}) → ${destinationProvinceName} (${destName})`
			: null;

	function changeMode(next: TripMode) {
		if (next === mode) return;
		setMode(next);
		// As escolhas de um modo não valem no outro: um código de município e
		// uma província vivem em espaços diferentes.
		setMunicipalProvince('');
		setMunicipalOrigin('');
		setMunicipalDestination('');
		setProvincialOriginProvince('');
		setProvincialOrigin('');
		setProvincialDestinationProvince('');
		setProvincialDestination('');
	}

	function canLeaveStep0(): boolean {
		if (!mode) {
			toast.error('Escolhe se a viagem é intermunicipal ou interprovincial.');
			return false;
		}
		if (!fromLocality || !toLocality) {
			toast.error('Escolhe a origem e o destino.');
			return false;
		}
		if (fromLocality === toLocality) {
			toast.error('A origem e o destino não podem ser o mesmo sítio.');
			return false;
		}
		if (sameProvince) {
			toast.error(
				'Numa viagem interprovincial, as províncias têm de ser diferentes. Para a mesma província, escolhe Intermunicipal.',
			);
			return false;
		}
		if (!date) {
			toast.error('Escolhe o dia da viagem.');
			return false;
		}
		if (!durationValid) {
			toast.error('A duração tem de ficar entre 30 minutos e 24 horas.');
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
		if (!fromLocality || !toLocality || !departureDate || !arrivalDate) {
			toast.error('Falta a rota ou o horário da viagem.');
			return;
		}

		setBusy(true);
		try {
			const ride = await api.createRide({
				vehicleId,
				originLocalityId: fromLocality,
				destinationLocalityId: toLocality,
				departureAt: departureDate.toISOString(),
				arrivalAt: arrivalDate.toISOString(),
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
					<div className="flex flex-col gap-3">
						<h2 className="text-h3 text-ink">Tipo de viagem</h2>
						<SegmentedControl<string>
							options={MODE_OPTIONS}
							value={mode ?? ''}
							onChange={(next) => changeMode(next as TripMode)}
							label="Tipo de viagem"
						/>
						<p className="text-small text-muted">
							{mode === 'intermunicipal'
								? 'A saída e a chegada ficam na mesma província. Escolhes a província e dois municípios.'
								: mode === 'interprovincial'
									? 'A saída e a chegada ficam em províncias diferentes. Escolhes as duas províncias e os municípios.'
									: 'Escolhe primeiro o tipo de viagem. É isso que decide que campos aparecem a seguir.'}
						</p>
					</div>

					{mode === 'intermunicipal' ? (
						<div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
							<Select
								label="Província"
								value={municipalProvince}
								onChange={(value) => {
									setMunicipalProvince(value);
									setMunicipalOrigin('');
									setMunicipalDestination('');
								}}
								options={provinceOptions}
								placeholder="Escolhe"
							/>
							<Select
								label="Município de saída"
								value={municipalOrigin}
								onChange={setMunicipalOrigin}
								options={fromOptions}
								placeholder="Escolhe"
								disabled={!municipalProvince}
							/>
							<Select
								label="Município de chegada"
								value={municipalDestination}
								onChange={setMunicipalDestination}
								options={toOptions}
								placeholder="Escolhe"
								disabled={!municipalProvince}
							/>
						</div>
					) : null}

					{mode === 'interprovincial' ? (
						<>
							<div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
								<div className="flex flex-col gap-4">
									<h2 className="text-h3 text-ink">Saída</h2>
									<Select
										label="Província"
										value={provincialOriginProvince}
										onChange={(value) => {
											setProvincialOriginProvince(value);
											setProvincialOrigin('');
										}}
										options={provinceOptions}
										placeholder="Escolhe"
									/>
									<Select
										label="Município"
										value={provincialOrigin}
										onChange={setProvincialOrigin}
										options={fromOptions}
										placeholder="Escolhe"
										disabled={!provincialOriginProvince}
									/>
								</div>

								<div className="flex flex-col gap-4">
									<h2 className="text-h3 text-ink">Chegada</h2>
									<Select
										label="Província"
										value={provincialDestinationProvince}
										onChange={(value) => {
											setProvincialDestinationProvince(value);
											setProvincialDestination('');
										}}
										options={provinceOptions}
										placeholder="Escolhe"
									/>
									<Select
										label="Município"
										value={provincialDestination}
										onChange={setProvincialDestination}
										options={toOptions}
										placeholder="Escolhe"
										disabled={!provincialDestinationProvince}
									/>
								</div>
							</div>

							{sameProvince ? (
								<p className="text-small text-alert">
									As duas províncias são iguais. Para uma viagem
									dentro da mesma província, escolhe{' '}
									<span className="font-medium">
										Intermunicipal
									</span>
									.
								</p>
							) : null}
						</>
					) : null}

					{routeSummary ? (
						<p className="rounded-md bg-brand-soft px-4 py-3 text-small text-brand-text">
							{routeSummary}
						</p>
					) : null}

					<div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-4">
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
						<Field
							label="Duração (horas)"
							type="number"
							min={0}
							max={24}
							value={durationHours}
							onChange={(event) =>
								setDurationHours(event.target.value)
							}
						/>
						<Select
							label="Minutos"
							value={durationMinutes}
							onChange={setDurationMinutes}
							options={MINUTE_OPTIONS}
						/>
					</div>

					<p className="-mt-3 text-small text-muted">
						{arrivalDate && !Number.isNaN(arrivalDate.getTime())
							? `Chegada prevista: ${fmtArrival(arrivalDate)} · ${fmtDuration(durationTotal)}.`
							: 'Define uma duração entre 30 minutos e 24 horas.'}
					</p>

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
								{
									name: destName,
									time: arrivalDate ? fmtTime(arrivalDate) : '—',
								},
							]}
						/>
					</div>

					<dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
						<SummaryItem
							label="Tipo de viagem"
							value={
								mode === 'intermunicipal'
									? 'Intermunicipal'
									: mode === 'interprovincial'
										? 'Interprovincial'
										: '—'
							}
						/>
						<SummaryItem
							label="Origem"
							value={
								originName
									? `${originName} · ${originProvinceName}`
									: '—'
							}
						/>
						<SummaryItem
							label="Destino"
							value={
								destName
									? `${destName} · ${destinationProvinceName}`
									: '—'
							}
						/>
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
						<SummaryItem
							label="Chegada"
							value={arrivalDate ? fmtArrival(arrivalDate) : '—'}
						/>
						<SummaryItem
							label="Duração"
							value={durationValid ? fmtDuration(durationTotal) : '—'}
						/>
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

function fmtTime(value: Date): string {
	return value.toLocaleTimeString('pt-PT', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function fmtArrival(value: Date): string {
	return `${value.toLocaleDateString('pt-PT', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	})} · ${fmtTime(value)}`;
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
