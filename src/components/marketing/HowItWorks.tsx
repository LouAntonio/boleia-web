import { Bike, CalendarCheck, Hand } from 'lucide-react';
import { RoadTrack } from './RoadTrack';
import { SeatGrid } from '../ui/SeatGrid';

/*
 * Os três passos.
 *
 * A numeração 01/02/03 aqui é informação, não enfeite: o conteúdo é mesmo uma
 * sequência, e a ordem importa — não se reserva antes de escolher a rota. Num
 * menu de "funcionalidades", onde os itens não têm ordem entre si, a mesma
 * numeração seria mentira.
 */
const STEPS = [
	{
		number: '01',
		Icon: Bike,
		title: 'Procura a tua boleia',
		body: 'Escolhe de onde para onde e o dia. Vês o preço por lugar e quantos lugares ainda estão vazios, antes de te comprometeres.',
		track: [
			{ name: 'Luanda', time: '06:00' },
			{ name: 'Malanje', time: '10:05' },
			{ name: 'Huambo', time: '13:40' },
		],
		seats: { total: 4, taken: 2 },
	},
	{
		number: '02',
		Icon: Hand,
		title: 'Reserva o lugar',
		body: 'Um lugar, dois, três — o que der. A resposta do motorista aparece na tua conta assim que ele decidir.',
		track: [
			{ name: 'Viana', time: '07:20' },
			{ name: 'Catete', time: '08:05' },
		],
		seats: { total: 3, taken: 1 },
	},
	{
		number: '03',
		Icon: CalendarCheck,
		title: 'Viaja',
		body: 'Pagas na viatura, em dinheiro, e acompanhas a viagem desde a paragem de recolha até à última.',
		track: [
			{ name: 'Huambo', time: '13:40' },
			{ name: 'Benguela', time: '18:10' },
		],
		seats: { total: 8, taken: 6 },
	},
];

export function HowItWorks() {
	return (
		<section id="como-funciona" className="scroll-mt-20 border-b border-line">
			<div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
				<header className="max-w-2xl">
					<h2 className="text-h2 text-ink">Como funciona</h2>
					<p className="mt-3 text-h3 font-normal text-muted">
						Três passos, do primeiro contacto à chegada.
					</p>
				</header>

				<ol className="mt-14 grid gap-6 lg:grid-cols-3">
					{STEPS.map(({ number, Icon, title, body, track, seats }) => (
						<li
							key={number}
							className="flex flex-col rounded-lg border border-line bg-surface p-6"
						>
							<div className="flex items-center gap-3">
								<span
									aria-hidden="true"
									className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-soft text-brand-text"
								>
									<Icon size={18} />
								</span>
								<span className="font-mono text-data text-muted">
									{number}
								</span>
							</div>

							<h3 className="mt-5 text-h3 text-ink">{title}</h3>
							<p className="mt-2 flex-1 text-body text-muted">
								{body}
							</p>

							{/*
							 * O mesmo par de sinais que aparece na app: o trilho e os
							 * lugares. Encher estes cartões com ilustrações bonitas que
							 * não são dados desfaria o argumento do produto — o que
							 * sustenta a Boleia é o lugar estar livre ou não estar.
							 */}
							<div className="mt-6 border-t border-line pt-6">
								<RoadTrack
									stops={track}
									animate={false}
									height={110}
									className="opacity-80"
								/>
								<SeatGrid
									total={seats.total}
									taken={seats.taken}
									className="mt-2"
								/>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
