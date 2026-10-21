import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const MONTHS_PT = [
	'Janeiro',
	'Fevereiro',
	'Março',
	'Abril',
	'Maio',
	'Junho',
	'Julho',
	'Agosto',
	'Setembro',
	'Outubro',
	'Novembro',
	'Dezembro',
];

/** A grelha começa à segunda-feira, como o calendário do telemóvel. */
const WEEKDAY_PT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function dateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayKey(): string {
	const now = new Date();
	return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function keyToDate(key: string): Date | null {
	const [year, month, day] = key.split('-').map(Number);
	if (!year || !month || !day) return null;
	const date = new Date(year, month - 1, day);
	return Number.isNaN(date.getTime()) ? null : date;
}

function monthCells(year: number, month: number): number[] {
	const offset = (new Date(year, month, 1).getDay() + 6) % 7;
	const total = new Date(year, month + 1, 0).getDate();
	const cells = Array<number>(offset).fill(0);
	for (let day = 1; day <= total; day += 1) cells.push(day);
	while (cells.length % 7 !== 0) cells.push(0);
	return cells;
}

function fmtDay(key: string): string {
	const date = keyToDate(key);
	if (!date) return '';
	return `${date.getDate()} ${MONTHS_PT[date.getMonth()]
		.slice(0, 3)
		.toLowerCase()}`;
}

function fmtRange(from: string, to: string): string {
	if (!from) return 'Qualquer dia';
	if (!to || from === to) return fmtDay(from);
	return `${fmtDay(from)} → ${fmtDay(to)}`;
}

/**
 * Escolha de um intervalo de dias.
 *
 * É o equivalente web do `DateRangePicker` do telemóvel: um campo "Quando"
 * que abre um calendário, deixa escolher a partida e a chegada, e fecha com
 * `Limpar`/`Aplicar`. Substituiu os atalhos "Hoje/Amanhã/7 dias", que não
 * diziam o dia exacto e não deixavam pedir uma semana concreta.
 *
 * Os dias passados ficam desactivados, porque não há boleias para trás. O
 * intervalo é inclusivo: `dateFrom` e `dateTo` são os dois dias escolhidos.
 */
export function DateRangeFilter({
	label = 'Quando',
	valueFrom,
	valueTo,
	onChange,
}: {
	label?: string;
	valueFrom: string;
	valueTo: string;
	onChange: (from: string, to: string) => void;
}) {
	const now = new Date();
	const [open, setOpen] = useState(false);
	const [draftFrom, setDraftFrom] = useState('');
	const [draftTo, setDraftTo] = useState('');
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth());

	const today = todayKey();
	const cells = monthCells(year, month);
	const canPrev =
		year > now.getFullYear() ||
		(year === now.getFullYear() && month > now.getMonth());
	const hasRange = Boolean(valueFrom || valueTo);

	function show() {
		const selected = keyToDate(valueFrom);
		setYear(selected?.getFullYear() ?? now.getFullYear());
		setMonth(selected?.getMonth() ?? now.getMonth());
		setDraftFrom(valueFrom);
		setDraftTo(valueTo);
		setOpen(true);
	}

	function moveMonth(delta: number) {
		const next = new Date(year, month + delta, 1);
		setYear(next.getFullYear());
		setMonth(next.getMonth());
	}

	function tapDay(day: number) {
		const key = dateKey(year, month, day);
		if (key < today) return;

		if (!draftFrom || (draftFrom && draftTo)) {
			setDraftFrom(key);
			setDraftTo('');
			return;
		}
		if (key < draftFrom) {
			setDraftFrom(key);
			setDraftTo('');
			return;
		}
		setDraftTo(key);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-label text-ink">{label}</span>

			<button
				type="button"
				onClick={show}
				aria-label={`${label}: ${fmtRange(valueFrom, valueTo)}`}
				className={[
					'flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left transition-colors',
					hasRange ? 'border-brand text-ink' : 'border-line text-muted',
				].join(' ')}
			>
				<span className="flex min-w-0 items-center gap-2">
					<CalendarDays
						size={16}
						aria-hidden="true"
						className="shrink-0 text-muted"
					/>
					<span className="truncate text-body">
						{fmtRange(valueFrom, valueTo)}
					</span>
				</span>
				<ChevronDown
					size={16}
					aria-hidden="true"
					className="shrink-0 text-muted"
				/>
			</button>

			{open ? (
				<Modal
					title="Escolhe o intervalo"
					description="O primeiro dia é a partida; o segundo, a chegada. Podes escolher um dia só."
					onClose={() => setOpen(false)}
				>
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={() => moveMonth(-1)}
							disabled={!canPrev}
							aria-label="Mês anterior"
							className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-35"
						>
							<ChevronLeft size={18} aria-hidden="true" />
						</button>

						<p className="text-label text-ink">
							{MONTHS_PT[month]} {year}
						</p>

						<button
							type="button"
							onClick={() => moveMonth(1)}
							aria-label="Mês seguinte"
							className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
						>
							<ChevronRight size={18} aria-hidden="true" />
						</button>
					</div>

					<div className="mt-4 grid grid-cols-7 gap-1">
						{WEEKDAY_PT.map((weekday, index) => (
							<span
								key={`${weekday}-${index}`}
								className="pb-1 text-center text-small text-muted"
							>
								{weekday}
							</span>
						))}

						{cells.map((day, index) => {
							if (day === 0) {
								return (
									<span
										key={`empty-${index}`}
										aria-hidden="true"
									/>
								);
							}

							const key = dateKey(year, month, day);
							const disabled = key < today;
							const isStart = key === draftFrom;
							const isEnd = key === draftTo;
							const inRange =
								Boolean(draftFrom && draftTo) &&
								key > draftFrom &&
								key < draftTo;

							return (
								<button
									key={key}
									type="button"
									disabled={disabled}
									onClick={() => tapDay(day)}
									aria-pressed={
										isStart || isEnd ? true : undefined
									}
									aria-label={fmtDay(key)}
									className={[
										'flex h-10 items-center justify-center rounded-full text-body transition-colors',
										disabled
											? 'cursor-not-allowed text-line'
											: isStart
												? 'bg-ink text-surface'
												: isEnd
													? 'bg-brand text-brand-ink'
													: inRange
														? 'bg-canvas font-medium text-ink'
														: 'text-ink hover:bg-canvas',
									].join(' ')}
								>
									{day}
								</button>
							);
						})}
					</div>

					<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
						<div className="min-w-0 flex-1">
							<p className="text-small text-muted">Intervalo</p>
							<p
								className={
									draftFrom
										? 'mt-0.5 truncate text-label text-ink'
										: 'mt-0.5 truncate text-body text-muted'
								}
							>
								{fmtRange(draftFrom, draftTo)}
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="secondary"
								onClick={() => {
									setDraftFrom('');
									setDraftTo('');
								}}
							>
								Limpar
							</Button>
							<Button
								onClick={() => {
									onChange(draftFrom, draftTo);
									setOpen(false);
								}}
							>
								Aplicar
							</Button>
						</div>
					</div>
				</Modal>
			) : null}
		</div>
	);
}
