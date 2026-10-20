import { Link } from 'react-router-dom';
import { Car, Plus } from 'lucide-react';
import { useMyRides } from '../../hooks/useRides';
import { useKycMe } from '../../hooks/useKyc';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusStamp } from '../../components/ui/StatusStamp';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { usePageTitle } from '../../hooks/usePageMeta';
import {
	durationBetween,
	fmtKz,
	fmtLongDate,
	hhmm,
	seatsLeft,
} from '../../lib/format';
import type { Ride } from '../../types/api';

/**
 * Lista das boleias do motorista.
 *
 * A lista escolhe a boleia; a gestão — iniciar, terminar, cancelar e decidir
 * pedidos — vive na página de detalhe. Antes cada cartão trazia os pedidos e
 * três botões, o que fazia do painel uma parede de acções e obrigava a carregar
 * as reservas de todas as viagens ao mesmo tempo.
 */
export function DriverBoardPage() {
	usePageTitle('Painel do motorista');

	const { data, isPending, isError, refetch } = useMyRides();
	const { data: kyc } = useKycMe();

	const rides = data?.rows ?? [];
	const active = rides.filter((ride) =>
		['SCHEDULED', 'IN_PROGRESS'].includes(ride.status),
	);
	const closed = rides.filter(
		(ride) => !['SCHEDULED', 'IN_PROGRESS'].includes(ride.status),
	);

	// Um motorista verificado mas sem viatura verificada não pode vender lugares.
	// Dizer qual dos dois falta é mais útil do que um "não podes publicar".
	const driverReady = kyc?.driver?.status === 'VERIFIED';

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-h2 text-ink">As minhas boleias</h1>
					<p className="mt-2 text-body text-muted">
						{active.length > 0
							? `${active.length} ${active.length === 1 ? 'boleia ativa' : 'boleias ativas'}.`
							: 'Nenhuma boleia ativa.'}
					</p>
				</div>

				<Link to="/app/publicar">
					<Button>
						<Plus size={16} aria-hidden="true" />
						Publicar boleia
					</Button>
				</Link>
			</header>

			{!driverReady ? (
				<Card className="border-caution p-5">
					<p className="text-body text-caution-ink">
						{kyc?.driver?.status === 'PENDING'
							? 'A tua identidade de motorista está em análise. Podes publicar assim que for aprovada.'
							: 'Para publicar boleias precisas de ter a identidade de motorista verificada.'}
					</p>
					<Link to="/app/kyc" className="mt-4 inline-block">
						<Button variant="secondary" size="sm">
							Verificar identidade
						</Button>
					</Link>
				</Card>
			) : null}

			{isPending ? <SkeletonLine className="h-40 w-full" /> : null}

			{/*
			 * Falha e "não publicaste nada" são coisas diferentes. Sem este
			 * ramo, uma API em baixo mostrava o estado vazio e levava o
			 * motorista a publicar uma boleia que já tinha.
			 */}
			{isError ? (
				<EmptyState
					icon={<Car size={32} />}
					title="Não foi possível carregar as boleias"
					description="O servidor não respondeu. As tuas boleias continuam publicadas."
					action={
						<Button variant="secondary" onClick={() => refetch()}>
							Tentar de novo
						</Button>
					}
				/>
			) : null}

			{!isPending && !isError && rides.length === 0 ? (
				<EmptyState
					icon={<Car size={32} />}
					title="Ainda não publicaste nenhuma boleia"
					description="Publicas a rota, escolhes os lugares e o preço. Os passageiros veem isso assim que fica agendado."
					action={
						<Link to="/app/publicar">
							<Button>Publicar a primeira</Button>
						</Link>
					}
				/>
			) : null}

			{!isError && active.length > 0 ? (
				<ul className="flex flex-col gap-3">
					{active.map((ride) => (
						<li key={ride.id}>
							<RideRow ride={ride} />
						</li>
					))}
				</ul>
			) : null}

			{!isError && closed.length > 0 ? (
				<section>
					<h2 className="text-h3 text-ink">Terminadas</h2>
					<ul className="mt-4 flex flex-col gap-3">
						{closed.map((ride) => (
							<li key={ride.id}>
								<RideRow ride={ride} />
							</li>
						))}
					</ul>
				</section>
			) : null}
		</div>
	);
}

function RideRow({ ride }: { ride: Ride }) {
	const free = seatsLeft(ride.seatsTotal, ride.seatsTaken);
	const managed = ride.status === 'SCHEDULED' || ride.status === 'IN_PROGRESS';

	return (
		<Card className="flex flex-wrap items-center justify-between gap-4 p-5">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-3">
					<p className="text-body text-ink">{ride.routeName}</p>
					<StatusStamp status={ride.status} />
				</div>
				<p className="mt-1 text-small text-muted">
					{fmtLongDate(ride.departureAt)}, {hhmm(ride.departureAt)} →{' '}
					{hhmm(ride.arrivalAt)} ·{' '}
					{durationBetween(ride.departureAt, ride.arrivalAt)}
				</p>
				<p className="mt-1 text-small text-muted">
					{ride.seatsTaken} de {ride.seatsTotal} lugares ·{' '}
					{free === 0 ? 'Lotada' : `${free} livres`} ·{' '}
					{fmtKz(ride.pricePerSeat)} por lugar
				</p>
			</div>

			<Link to={`/app/painel/viagens/${ride.id}`}>
				<Button variant={managed ? 'primary' : 'secondary'} size="sm">
					{managed ? 'Gerir boleia' : 'Ver boleia'}
				</Button>
			</Link>
		</Card>
	);
}
