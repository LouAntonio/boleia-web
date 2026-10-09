import { seatsLeft } from '../../lib/format';

interface SeatGridProps {
	total: number;
	taken: number;
	/** Lugar reservado por esta pessoa, se for o caso. */
	mine?: boolean;
	/** Mostra a legenda "N de M lugares" por baixo. */
	showLabel?: boolean;
	className?: string;
}

/**
 * A viatura vista de cima: um quadrado por lugar, cheio onde já vai alguém.
 *
 * Este é o número que decide se vale a pena carregar em "reservar", e a
 * plataforma mostrava-o como `3 lugares disponíveis` — uma frase. Um quadrado
 * por lugar diz a mesma coisa em metade do espaço e sem ambiguidade: nove
 * quadrados vazios e um cheio são lidos antes de a frase acabar de ser lida.
 *
 * A grelha tem `aria-hidden` e o texto por baixo é o que o leitor de ecrã
 * anuncia. Descrever nove quadrados um a um seria ruído.
 */
export function SeatGrid({
	total,
	taken,
	mine = false,
	showLabel = true,
	className = '',
}: SeatGridProps) {
	// Uma viatura com 15 lugares não cabe em duas linhas. Acima de 12 mostramos a
	// grelha como uma barra proporcional, que continua a dizer a verdade.
	const asGrid = total > 0 && total <= 12;
	const free = seatsLeft(total, taken);
	const percent = total > 0 ? Math.round((taken / total) * 100) : 0;

	if (!asGrid) {
		return (
			<div className={className}>
				<div
					role="img"
					aria-label={`${free} de ${total} lugares livres`}
					className="h-2 w-full overflow-hidden rounded-full bg-line"
				>
					<div
						className={`h-full rounded-full ${free === 0 ? 'bg-alert' : 'bg-brand'}`}
						style={{ width: `${percent}%` }}
					/>
				</div>
				{showLabel ? (
					<p className="mt-1.5 text-small text-muted">
						{free === 0
							? 'Esgotada'
							: `${free} de ${total} lugares livres`}
					</p>
				) : null}
			</div>
		);
	}

	return (
		<div className={className}>
			<div aria-hidden="true" className="flex flex-wrap gap-1">
				{Array.from({ length: total }, (_, index) => {
					const occupied = index < taken;
					return (
						<span
							key={index}
							className={[
								'h-4 w-4 rounded-sm border',
								occupied
									? 'border-transparent bg-line'
									: 'border-brand',
								mine && occupied ? 'bg-brand/60' : '',
							]
								.filter(Boolean)
								.join(' ')}
						/>
					);
				})}
			</div>

			{showLabel ? (
				<p className="mt-2 text-small text-muted">
					{free === 0
						? 'Esgotada'
						: free === 1
							? 'Último lugar'
							: `${free} de ${total} lugares livres`}
				</p>
			) : null}
		</div>
	);
}
