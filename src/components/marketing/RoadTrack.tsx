import type { CSSProperties } from 'react';

export interface TrackStop {
	/** Localidade. Na origem e no destino é o nome da cidade. */
	name: string;
	/** Hora em `HH:MM`, já em WAT pelo backend. Não recalcular. */
	time: string;
}

interface RoadTrackProps {
	stops: TrackStop[];
	/** A linha desenha-se ao aparecer. Desligado, aparece já completa. */
	animate?: boolean;
	/** Altura da faixa em píxeis. O texto é HTML, portanto mede-se em px. */
	height?: number;
	className?: string;
}

/*
 * A curva, em coordenadas de `viewBox` (0 a 100 nos dois eixos).
 *
 * Uma `Q` chega: dá o arqueio de uma estrada sem desenhar um perfil de estrada
 * verdadeiro, que se perderia mal pior. Os nós são calculados sobre esta mesma
 * curva abaixo, para cada paragem cair mesmo em cima da linha — com
 * coordenadas próprias, ninguém perceberia que a estrada e as paragens eram a
 * mesma coisa.
 */
const START = { x: 0, y: 26 };
const CONTROL = { x: 52, y: 32 };
const END = { x: 100, y: 74 };

function curveAt(t: number): { x: number; y: number } {
	const inv = 1 - t;
	return {
		x: inv * inv * START.x + 2 * inv * t * CONTROL.x + t * t * END.x,
		y: inv * inv * START.y + 2 * inv * t * CONTROL.y + t * t * END.y,
	};
}

const PATH = `M ${START.x} ${START.y} Q ${CONTROL.x} ${CONTROL.y} ${END.x} ${END.y}`;

/**
 * Onde a etiqueta se põe, em cada um dos três casos.
 *
 * Todas as etiquetas estão centradas no ponto da curva e depois empurradas para
 * dentro. A alternativa — alinhar a etiqueta ao canto do contentor — parece mais
 * simples e não é: com uma ponta em `x = 0` e outra em `x = 100`, qualquer
 * alinhamento que não seja para dentro põe metade do texto fora do cartão, e o
 * texto é a única coisa que diz a hora.
 *
 * `origin` e `end` só diferem no sentido do empurrão, por isso não há uma
 * classe montada com template string: o Tailwind varre o código-fonte à procura
 * de nomes de classe completos, e `text-${align}` não existe à frente da
 * compilação.
 */
/**
 * O desvio horizontal de cada etiqueta, a partir do ponto da curva.
 *
 * Todas as etiquetas começam centradas no ponto (`left-1/2 -translate-x-1/2`) e
 * depois saem daqui. As das pontas empurram-se para dentro — o que as mantém
 * dentro do cartão mesmo com o ponto em `x = 0` ou `x = 100` — e as do meio
 * ficam onde estão.
 *
 * O mapa é escrito à mão, e não como `text-${align}` ou `translate-x-${dir}`:
 * o Tailwind varre o código-fonte à procura de nomes de classe completos, e
 * uma classe montada com template string não existe à frente da compilação. O
 * resultado seria uma etiqueta ao centro numa ponta e transbordada na outra,
 * sem que nada aparecesse no ecrã.
 */
const LABEL_SHIFT = {
	/** `left-1/2` só: o texto cresce para a direita a partir do ponto. */
	origin: '',
	/** `left-1/2 -translate-x-1/2`: o texto cresce para a esquerda. */
	end: '-translate-x-1/2',
	/** `left-1/2 -translate-x-1/2`: centrado. */
	middle: '-translate-x-1/2',
} as const;

/** E o sentido do texto dentro da etiqueta. */
const LABEL_ALIGN = {
	origin: 'text-left',
	end: 'text-right',
	middle: 'text-center',
} as const;

/**
 * A estrada — o elemento de assinatura deste sítio.
 *
 * A linha é SVG; os nós e as etiquetas são HTML por cima dela. Poderia ter sido
 * tudo em SVG, mas `preserveAspectRatio="none"` — que é o que permite desenhar
 * numa `viewBox` de 0 a 100 com um `width` em píxeis — distorce os círculos em
 * elipses e o texto com eles. Com HTML, a etiqueta é texto a sério: escala com a
 * fonte, roda com o zoom do browser e o leitor de ecrã lê-a sem ajuda.
 *
 * A linha desenha-se com `stroke-dashoffset` e cada nó entra um bocado depois
 * de a linha chegar a ele. É isso que dá a sensação de percurso em vez de
 * desenho.
 */
export function RoadTrack({
	stops,
	animate = true,
	height = 148,
	className = '',
}: RoadTrackProps) {
	if (stops.length < 2) return null;

	// Duas paragens chegam, e nesse caso não há grande animação a fazer — o
	// traço é uma linha e os dois nós aparecem de uma vez.
	const canAnimate = animate && stops.length > 2;

	return (
		<div className={`relative w-full ${className}`} style={{ height }}>
			<svg
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
				aria-hidden="true"
				className="absolute inset-0 h-full w-full overflow-visible"
			>
				{/* A estrada por fazer: pontilhada, para se ver o caminho. */}
				<path
					d={PATH}
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					vectorEffect="non-scaling-stroke"
					strokeLinecap="round"
					className="text-line"
					strokeDasharray="3 6"
				/>

				{/*
				 * A estrada percorrida. `pathLength="100"` normaliza o
				 * comprimento para 100, o que faz o `stroke-dashoffset` contar de
				 * 0 a 100 sem ir medir a curva em píxeis.
				 */}
				<path
					d={PATH}
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					vectorEffect="non-scaling-stroke"
					strokeLinecap="round"
					pathLength={100}
					strokeDasharray="100"
					className={`text-brand-text ${canAnimate ? 'road-draw' : ''}`}
				/>
			</svg>

			{stops.map((stop, index) => {
				const point = curveAt(index / (stops.length - 1));
				const position =
					index === 0
						? 'origin'
						: index === stops.length - 1
							? 'end'
							: 'middle';
				const isCorner = position !== 'middle';

				return (
					/*
					 * Duas camadas: a de fora posiciona, a de dentro anima. Com
					 * uma só, o `transform` de posição cancelava o `scale` da
					 * animação — e a estrada desenhava-se sem paragens nenhuma.
					 */
					<div
						key={`${stop.name}-${index}`}
						className="absolute"
						style={{ left: `${point.x}%`, top: `${point.y}%` }}
					>
						<div
							className={canAnimate ? 'road-node' : undefined}
							style={{ '--node-index': index } as CSSProperties}
						>
							{/* O ponto. Fica escondida dos leitores de ecrã. */}
							<span
								aria-hidden="true"
								className={[
									'absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2',
									'rounded-full border-2 border-brand bg-surface',
									isCorner ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5',
								].join(' ')}
							/>

							{/* A hora, por cima do ponto. */}
							<span
								className={[
									'absolute bottom-[calc(100%+6px)] left-1/2',
									'font-mono text-small font-medium whitespace-nowrap',
									'text-brand-text',
									LABEL_SHIFT[position],
									LABEL_ALIGN[position],
								].join(' ')}
							>
								{stop.time}
							</span>

							{/* A localidade, por baixo. */}
							<span
								className={[
									'absolute top-[calc(100%+10px)] left-1/2',
									'block max-w-28 text-small text-ink',
									LABEL_SHIFT[position],
									LABEL_ALIGN[position],
								].join(' ')}
							>
								{stop.name}
							</span>
						</div>
					</div>
				);
			})}

			{/*
			 * A descrição que o `svg` `aria-hidden` não dá. Uma pessoa com
			 * leitor de ecrã recebe a estrada inteira numa frase, na ordem em
			 * que a viagem acontece.
			 */}
			<p className="sr-only">
				Percurso de {stops.length} paragens:{' '}
				{stops.map((stop) => `${stop.name} às ${stop.time}`).join(', ')}.
			</p>
		</div>
	);
}
