import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { RoadTrack } from './RoadTrack';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useAllLocalities } from '../../hooks/useLocalities';
import { indexProvinces } from '../../hooks/useLocalities';

/**
 * O percurso de exemplo.
 *
 * Estes números são uma ilustração da promessa do produto, não o resultado de
 * um pedido à API: são cinco localidades com horas plausíveis para um dia longo
 * Luanda–Benguela. A landing diz-o logo abaixo ("Um percurso de exemplo"), e
 * a secção "Boleias a partir agora" ao lado é que vai buscar as corridas
 * verdadeiras ao servidor. A distinção é deliberada — uma hero com números
 * inventados e depois uma lista com números reais é como se descobre que a
 * primeira era mentira.
 */
const SAMPLE_ROUTE = [
	{ name: 'Luanda', time: '06:00' },
	{ name: 'Viana', time: '07:20' },
	{ name: 'Malanje', time: '10:05' },
	{ name: 'Huambo', time: '13:40' },
	{ name: 'Benguela', time: '18:10' },
];

export function Hero() {
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');

	/*
	 * Localidades, não províncias.
	 *
	 * O `GET /api/rides` filtra por `ride_stop.localityId` e valida o valor
	 * como UUID. A hero oferecia as 21 províncias e mandava o **nome** pelo
	 * `?de=`, pelo que não havia forma de a escolha chegar ao filtro — e
	 * ainda por cima o nome vinha da seed com o defecto do CP437
	 * ("Bié" como `Bi\u251C\u00AE`).
	 *
	 * `GET /api/locality/provinces` e `.../localities` são rotas públicas
	 * (`OptionalAuthGuard`), por isso a landing pode usá-las sem sessão. As
	 * localities chegam por província, com o nome da província em cada linha,
	 * porque "Caxito, Bengo" é muito mais útil do que "Caxito" repetido 30
	 * vezes na lista.
	 */
	const { localities, isLoading } = useAllLocalities();
	const provinceNames = indexProvinces(
		localities.flatMap((l) => l.province ?? []),
	);

	const localOptions = localities.map((locality) => ({
		value: locality.id,
		label: provinceNames.get(locality.province?.id ?? '')
			? `${locality.name} — ${provinceNames.get(locality.province?.id ?? '')}`
			: locality.name,
	}));

	const ready = Boolean(origin && destination);

	return (
		<section className="relative overflow-hidden border-b border-line bg-surface">
			{/*
			 * Um único degradê, do azul de marca a 6% de opacidade, a descer para
			 * nada. É o suficiente para separar a hero do resto sem inventar um
			 * halo colorido por trás do título — que é o efeito que faz as
			 * landing pages parecerem todas iguais.
			 */}
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-gradient-to-b from-brand/6 to-transparent"
			/>

			<div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
				<div className="max-w-3xl">
					<h1 className="text-display text-ink">
						Boleias que partem a horas
						<br className="hidden sm:block" /> de Luanda, para todo o
						país.
					</h1>

					<p className="mt-6 max-w-xl text-h3 font-normal leading-relaxed text-muted">
						Procura a rota, vê os lugares que sobram e reserva. Pagas na
						viatura, com um motorista verificado ao volante.
					</p>
				</div>

				{/*
				 * A pesquisa vai em formulário de verdade, não em dois
				 * `select` avulsos: quem chega do teclado tem de conseguir
				 * chegar ao botão sem passar pelo rato, e um `form` dá essa
				 * ordem de tabulação de graça.
				 */}
				<form
					className="mt-10 max-w-2xl"
					onSubmit={(event) => {
						event.preventDefault();
						// A pesquisa a sério é da app autenticada: sem sessão, o
						// backend recusa `/api/rides`. Aqui leva a pessoa a entrar
						// já com o destino escolhido.
						const params = new URLSearchParams();
						if (origin) params.set('de', origin);
						if (destination) params.set('para', destination);
						window.location.href = `/criar-conta${
							params.toString() ? `?${params}` : ''
						}`;
					}}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<Select
							label="De onde"
							value={origin}
							onChange={setOrigin}
							options={localOptions}
							placeholder={
								isLoading
									? 'A carregar…'
									: 'Escolhe o ponto de partida'
							}
							className="bg-surface"
						/>
						<Select
							label="Para onde"
							value={destination}
							onChange={setDestination}
							options={localOptions}
							placeholder={
								isLoading ? 'A carregar…' : 'Escolhe o destino'
							}
							className="bg-surface"
						/>
					</div>

					<div className="mt-4 flex flex-wrap items-center gap-4">
						<Button type="submit" size="lg" disabled={!ready}>
							<Search size={18} aria-hidden="true" />
							Encontrar boleia
						</Button>

						{!ready ? (
							<p className="text-small text-muted">
								Escolhe a origem e o destino para procurar.
							</p>
						) : null}
					</div>
				</form>

				{/* O elemento de assinatura. Abaixo da dobra, em cima de tudo. */}
				<div className="mt-20 max-w-4xl">
					<RoadTrack stops={SAMPLE_ROUTE} height={168} />

					<p className="mt-6 text-small text-muted">
						Um percurso de exemplo. As boleias a seguir são reais e
						mudam de minuto a minuto.
					</p>
				</div>
			</div>
		</section>
	);
}

/** A secção de quem quer conduzir. */
export function DriverCallout() {
	return (
		<section className="border-b border-line">
			<div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
				<div className="flex flex-col items-start gap-8 rounded-lg border border-line bg-surface p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
					<div className="max-w-xl">
						<h2 className="text-h2 text-ink">
							Tens uma viatura e lugares vazios?
						</h2>
						<p className="mt-3 text-body text-muted">
							Publicas a rota, escolhes os lugares e o preço, e
							decides quem sobe. Quem reserva vê os teus dados
							verificados antes de pagar.
						</p>
					</div>

					<Link to="/criar-conta" className="shrink-0">
						<Button size="lg">
							Publicar uma boleia
							<ArrowRight size={18} aria-hidden="true" />
						</Button>
					</Link>
				</div>

				{/*
				 * O botão de cima vai directamente para a conta. Este vai para a
				 * página que explica o processo e o preço: quem já tem conta não
				 * precisa de um resumo, e quem não tem precisa de saber quanto
				 * fica antes de se registar.
				 */}
				<p className="mt-6 text-small text-muted">
					Queres saber como funciona e quanto se fica com cada lugar?{' '}
					<Link
						to="/motoristas"
						className="rounded-sm text-brand-text underline-offset-4 hover:underline"
					>
						Lê a página para motoristas
					</Link>
					.
				</p>
			</div>
		</section>
	);
}
