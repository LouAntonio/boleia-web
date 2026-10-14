import { PROVINCES } from '../../lib/geo';

/**
 * As 21 províncias, na forma de uma constelação.
 *
 * Um mapa de Angola desenhado à mão seria bonito e mentira: o contorno errado
 * estraga mais a confiança do que um esquema ajuda. O que há aqui são pontos
 * reais, nas coordenadas que o backend tem na base de dados, ligados pela
 * distância — a mesma lógica da `RoadTrack`, aplicada ao país inteiro.
 *
 * A projeção é linear sobre a caixa delimitadora. Para um país inteiro e um
 * esquema decorativo, distorcer pouco não importa. A `RoadTrack` é que depende
 * de a forma estar certa, e por isso tem a curva explicitamente desenhada.
 */
function project(lat: number, lng: number): { x: number; y: number } {
	const lats = PROVINCES.map((p) => p.lat);
	const lngs = PROVINCES.map((p) => p.lng);

	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);

	const x = 6 + ((lng - minLng) / (maxLng - minLng)) * 88;
	// A latitude cresce para norte, o eixo `y` para baixo: invertido.
	const y = 8 + ((maxLat - lat) / (maxLat - minLat)) * 84;

	return { x, y };
}

/** Ligações entre as províncias cujas sedes estão mais perto uma da outra. */
const CORRIDAS = [
	['Luanda', 'Bengo'],
	['Luanda', 'Benguela'],
	['Benguela', 'Huíla'],
	['Huambo', 'Bié'],
	['Huambo', 'Huíla'],
	['Luanda', 'Malanje'],
	['Cabinda', 'Zaire'],
	['Uíge', 'Bengo'],
	['Cuanza Sul', 'Benguela'],
	['Cuanza Norte', 'Luanda'],
	['Lunda Norte', 'Lunda Sul'],
	['Moxico', 'Moxico Oriental'],
	['Cunene', 'Cuando'],
	['Namibe', 'Huíla'],
	['Cubango', 'Cuando'],
];

export function ProvincesMap() {
	const positions = new Map(
		PROVINCES.map((province) => [
			province.name,
			project(province.lat, province.lng),
		]),
	);

	return (
		<section id="rotas" className="scroll-mt-20 border-b border-line">
			<div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
				<div className="grid gap-14 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
					<div>
						<h2 className="text-h2 text-ink">Onde a Boleia vai</h2>
						<p className="mt-4 text-body text-muted">
							As 21 províncias de Angola. Cada ponto é uma sede real,
							com as coordenadas que o servidor guarda — não um
							desenho de mapa.
						</p>
						<p className="mt-4 text-body text-muted">
							{/*
							 * Este parágrafo afirmava que Luanda, Benguela, Huambo,
							 * Malanje, Lubango e Viana "concentram o maior número
							 * de deslocações semanais". Não há nenhum dado de
							 * deslocações no sistema — nem no esquema, nem num
							 * ficheiro, nem numa fonte. Era uma afirmação inventada
							 * sobre o país, numa página institucional cuja
							 * credibilidade é o activo inteiro.
							 *
							 * A ordem das rotas a abrir é uma decisão operacional,
							 * e toma-se com dados reais quando os houver.
							 */}
							As rotas abrem à medida que houver motoristas com
							viatura verificada a querer partir. Uma província só tem
							rotas quando alguém as publica — e quando um destino não
							tem nenhuma boleia agendada, o site diz que não tem.
						</p>
					</div>

					<div className="rounded-lg border border-line bg-surface p-6">
						<svg
							viewBox="0 0 100 100"
							className="w-full"
							style={{ maxHeight: 460 }}
							role="img"
							aria-label={`As ${PROVINCES.length} províncias de Angola, ligadas pelas rotas entre sedes vizinhas.`}
						>
							{/* Ligações primeiro: os pontos têm de ficar por cima. */}
							<g aria-hidden="true">
								{CORRIDAS.map(([from, to]) => {
									const a = positions.get(from);
									const b = positions.get(to);
									if (!a || !b) return null;
									return (
										<line
											key={`${from}-${to}`}
											x1={a.x}
											y1={a.y}
											x2={b.x}
											y2={b.y}
											stroke="currentColor"
											strokeWidth="0.25"
											strokeLinecap="round"
											className="text-line"
											vectorEffect="non-scaling-stroke"
										/>
									);
								})}
							</g>

							{PROVINCES.map((province) => {
								const point = positions.get(province.name);
								if (!point) return null;
								return (
									<g key={province.name}>
										<circle
											cx={point.x}
											cy={point.y}
											r="0.75"
											className="fill-brand"
										/>
										<text
											x={point.x + 1.8}
											y={point.y + 0.6}
											style={{ fill: 'var(--muted)' }}
											className="text-[2.4px]"
										>
											{province.capital}
										</text>
									</g>
								);
							})}
						</svg>

						<p className="mt-4 text-small text-muted">
							As linhas ligam sedes vizinhas entre si. Não são rotas
							ativas — as que estão ativas aparecem na secção abaixo.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
