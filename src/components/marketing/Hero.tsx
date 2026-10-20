import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { RoadTrack } from './RoadTrack';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { SegmentedControl } from '../ui/SegmentedControl';
import { LocalityFilter } from '../rides/LocalityFilter';
import { ProvinceFilter } from '../rides/ProvinceFilter';
import { useProvinces } from '../../hooks/useLocalities';

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

const MODES = [
	{ value: 'interprovincial' as const, label: 'Interprovincial' },
	{ value: 'intermunicipal' as const, label: 'Intermunicipal' },
];

export function Hero() {
	const [mode, setMode] = useState<'interprovincial' | 'intermunicipal'>(
		'interprovincial',
	);
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	const [provinceId, setProvinceId] = useState('');
	/**
	 * As províncias de origem e de destino, em estado à parte dos municípios.
	 *
	 * Um id de província e um id de município vivem em espaços diferentes, e
	 * partilhar o campo obrigaria a lembrar a cada linha qual dos dois está lá.
	 */
	const [fromProvince, setFromProvince] = useState('');
	const [toProvince, setToProvince] = useState('');

	/*
	 * As 21 províncias só se pedem no modo intermunicipal, onde há um selector
	 * de província a mostrar. No interprovincial quem pede a lista é o
	 * `ProvinceFilter`, e só quando alguém o abre.
	 *
	 * `useProvinces` aceita um `enabled`: fora desse modo o `Select` não está
	 * no ecrã, e pedir a lista seria pagar 21 respostas para desenhar nada.
	 */
	const municipal = mode === 'intermunicipal';
	const provinces = useProvinces(municipal);

	/*
	 * O `GET /api/rides` filtra por `ride_stop.localityId` e valida o valor
	 * como UUID, por isso o que viaja no `?de=` é sempre um id. A versão
	 * anterior da hero oferecia as 21 províncias e mandava o **nome** pelo
	 * `?de=` — duas coisas erradas ao mesmo tempo: um nome não é um UUID, e uma
	 * província não é uma localidade.
	 *
	 * **A pesquisa a sério é da app autenticada**: sem sessão, o backend recusa
	 * `/api/rides`. Por isso o hero não mostra resultados — leva a pessoa a
	 * entrar já com o destino escolhido. O botão existe para isso, e para não
	 * haver nenhum pedido disparado enquanto ela ainda não escolheu.
	 */
	/*
	 * O botão só acende com o que este modo pede: duas províncias no
	 * interprovincial, dois municípios no intermunicipal. Um único predicado
	 * para os dois, senão o botão fica cinzento por um campo que nem existe no
	 * ecrã à frente da pessoa.
	 */
	const ready = municipal
		? Boolean(provinceId && origin && destination)
		: Boolean(fromProvince && toProvince);

	/*
	 * Trocar de modo limpa as quatro escolhas, e escolher uma província limpa
	 * as localidades que ficaram fora dela.
	 *
	 * Sem isto o filtro activo era invisível: estar em "intermunicipal" com uma
	 * origem em Benguela porque a província vinha do modo anterior, e a pesquisa
	 * devolveria resultados que o rótulo não promete.
	 */
	function changeMode(next: 'interprovincial' | 'intermunicipal') {
		if (next === mode) return;
		setMode(next);
		setProvinceId('');
		setOrigin('');
		setDestination('');
		setFromProvince('');
		setToProvince('');
	}

	function changeProvince(next: string) {
		setProvinceId(next);
		setOrigin('');
		setDestination('');
	}

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
						/*
						 * Os parâmetros não são os mesmos nos dois modos, e
						 * têm nomes diferentes de propósito: `de`/`para`
						 * levam sempre municípios, `deProvincia`/`paraProvincia`
						 * levam sempre províncias. Reutilizar os mesmos nomes
						 * obrigaria o `SignUpPage` a adivinhar, pelo `modo`,
						 * em que espaço de ids está cada valor — e a
						 * adivinhação erra no dia em que os dois modos
						 * coexistirem num link.
						 */
						const params = new URLSearchParams();
						params.set('modo', mode);
						if (municipal) {
							if (provinceId) params.set('provincia', provinceId);
							if (origin) params.set('de', origin);
							if (destination) params.set('para', destination);
						} else {
							if (fromProvince)
								params.set('deProvincia', fromProvince);
							if (toProvince) params.set('paraProvincia', toProvince);
						}
						window.location.href = `/criar-conta?${params.toString()}`;
					}}
				>
					{/*
					 * Interprovincial ou intermunicipal, exactamente como na app.
					 *
					 * A diferença real não são duas pesquisas: `GET /api/rides`
					 * filtra por localidade nos dois casos. O que muda é o universo
					 * de escolha — no intermunicipal a origem e o destino têm de
					 * cair dentro da mesma província. É isso que a província aqui
					 * impõe aos dois `LocalityFilter` abaixo.
					 */}
					<SegmentedControl
						label="Tipo de viagem"
						options={MODES}
						value={mode}
						onChange={changeMode}
						className="max-w-md"
					/>

					{municipal ? (
						<div className="mt-4">
							<Select
								label="Província"
								value={provinceId}
								onChange={changeProvince}
								options={(provinces.data ?? []).map((province) => ({
									value: province.id,
									label: province.name,
								}))}
								placeholder="Escolhe a província"
								hint="A origem e o destino têm de ser dentro desta província."
							/>
						</div>
					) : null}

					{/*
					 * Cada modo tem os seus dois filtros, e são de coisas
					 * diferentes.
					 *
					 * **Interprovincial**: província → província. É o que a
					 * pessoa escolhe quando quer ir de Luanda a Benguela, e é
					 * o que o `originProvinceId`/`destinationProvinceId` do
					 * `GET /api/rides` filtra.
					 *
					 * **Intermunicipal**: município → município, com a
					 * província acima a restringir o universo de escolha.
					 *
					 * Os dois pares não se misturam: trocar de modo limpa-os
					 * (ver `changeMode`), e um id de província nunca é
					 * enviado como se fosse um município.
					 */}
					{municipal ? (
						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							<LocalityFilter
								label="De onde"
								value={origin}
								onChange={setOrigin}
								exclude={destination}
								placeholder="Escolhe o ponto de partida"
								restrictToProvinceId={provinceId || null}
								lazy
							/>
							<LocalityFilter
								label="Para onde"
								value={destination}
								onChange={setDestination}
								exclude={origin}
								placeholder="Escolhe o destino"
								restrictToProvinceId={provinceId || null}
								lazy
							/>
						</div>
					) : (
						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							<ProvinceFilter
								label="De onde"
								value={fromProvince}
								onChange={setFromProvince}
								exclude={toProvince}
								placeholder="Escolhe a província de partida"
							/>
							<ProvinceFilter
								label="Para onde"
								value={toProvince}
								onChange={setToProvince}
								exclude={fromProvince}
								placeholder="Escolhe a província de destino"
							/>
						</div>
					)}

					<div className="mt-4 flex flex-wrap items-center gap-4">
						<Button type="submit" size="lg" disabled={!ready}>
							<Search size={18} aria-hidden="true" />
							{municipal
								? 'Encontrar boleia na província'
								: 'Encontrar boleia'}
						</Button>

						{/*
						 * O aviso diz o que falta **neste modo**. Um
						 * "escolhe a origem e o destino" genérico, no
						 * interprovincial, não nomeia os campos que estão à
						 * vista — e no intermunicipal esconde que ainda falta
						 * a província.
						 */}
						{!ready ? (
							<p className="text-small text-muted">
								{municipal
									? !provinceId
										? 'Escolhe a província, a origem e o destino.'
										: 'Escolhe a origem e o destino dentro da província.'
									: 'Escolhe a província de partida e a de destino.'}
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
