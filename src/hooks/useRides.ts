import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { qk } from '../lib/queryClient';
import { apiErrorMessage } from '../lib/axios';
import * as api from '../lib/api';
import type { ListRidesQuery } from '../lib/api';

/** Corridas a agendar, com lugares. A página principal do passageiro. */
export function useRides(query: ListRidesQuery) {
	return useQuery({
		queryKey: qk.rides(query),
		queryFn: () => api.listRides(query),
		// Uma rota muda de lugares enquanto se olha para ela. Um minuto em cache
		// chega para não recarregar a cada alternância de filtro, e é curto o
		// suficiente para o número de lugares não estar velho quando se carrega
		// em reservar.
		staleTime: 60_000,
		refetchOnWindowFocus: true,
	});
}

export function useRide(id: string) {
	return useQuery({
		queryKey: qk.ride(id),
		queryFn: () => api.fetchRide(id),
		staleTime: 30_000,
		enabled: Boolean(id),
	});
}

/** Detalhe público, para quem abre um link partilhado sem sessão. */
export function usePublicRide(id: string) {
	return useQuery({
		queryKey: qk.publicRide(id),
		queryFn: () => api.fetchPublicRide(id),
		staleTime: 30_000,
		enabled: Boolean(id),
	});
}

/**
 * Perfil público de quem vai numa boleia.
 *
 * `enabled: Boolean(id)` evita pedir `/api/people/` com o id vazio a meio do
 * carregamento da rota: um pedido desses falha de forma estranha, e a página
 * já tem o seu próprio estado de "não encontrada".
 */
export function usePublicPerson(id: string) {
	return useQuery({
		queryKey: qk.publicPerson(id),
		queryFn: () => api.fetchPublicPerson(id),
		staleTime: 60_000,
		enabled: Boolean(id),
	});
}

/**
 * Pesquisa pública, paginada para "carregar mais".
 *
 * `useInfiniteQuery` e não uma página com estado: quem clica "carregar mais"
 * duas vezes seguidas não pode perder a primeira página, e uma lista em
 * `useState` ia refetchar do zero a cada filtro. O `getNextPageParam` decide
 * pela soma das linhas contra o total do cabeçalho — não há páginas vazias a
 * meio da lista, porque o backend não devolve página nenhuma sem ids.
 */
export function usePublicRideSearch(query: ListRidesQuery, enabled: boolean) {
	return useInfiniteQuery({
		queryKey: qk.publicRideSearch(query),
		queryFn: ({ pageParam }) =>
			api.searchPublicRides({ ...query, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			const fetched = allPages.reduce(
				(sum, page) => sum + page.rows.length,
				0,
			);
			return fetched < lastPage.total ? allPages.length + 1 : undefined;
		},
		staleTime: 60_000,
		enabled,
	});
}

/** Corridas publicadas por quem está a ver. O painel do motorista. */
export function useMyRides(status?: string) {
	return useQuery({
		queryKey: [...qk.myRides, status ?? 'todos'],
		queryFn: () => api.fetchMyRides(status ? { status: status as never } : {}),
		staleTime: 60_000,
	});
}

export function useMyBookings() {
	return useQuery({
		queryKey: qk.myBookings,
		queryFn: api.fetchMyBookings,
		staleTime: 30_000,
	});
}

/**
 * Os pedidos de lugar de uma corrida. Só o motorista da corrida consegue ver.
 *
 * Recarrega a cada 20 segundos: a decisão de aceitar ou recusar é a única
 * coisa nesta aplicação que alguém está à espera em tempo quase real, e sem
 * WebSocket no site um `refetchInterval` discreto é a diferença entre o
 * painel mostrar o pedido enquanto a pessoa espera, ou trinta segundos depois.
 */
export function useRideBookings(rideId: string, enabled = true) {
	return useQuery({
		queryKey: qk.rideBookings(rideId),
		queryFn: () => api.fetchRideBookings(rideId),
		enabled: enabled && Boolean(rideId),
		refetchInterval: 20_000,
	});
}

/* ---------- Mutations ---------- */

/**
 * Reserva um lugar.
 *
 * Ao terminar invalida três listas de uma vez: os lugares da corrida, as
 * reservas da pessoa e a lista de corridas. A primeira porque o contador mudou,
 * as outras porque a reserva passou a existir. Esquecer a última dava a
 * sensação de que a reserva tinha falhado.
 */
export function useBookRide() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			rideId,
			...input
		}: api.CreateBookingInput & { rideId: string }) =>
			api.bookRide(rideId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rides'] });
			queryClient.invalidateQueries({ queryKey: qk.myBookings });
			toast.success('Pedido enviado. O motorista responde a seguir.');
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível reservar o lugar.'),
			);
		},
	});
}

export function useCancelBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			bookingId,
			reason,
		}: {
			bookingId: string;
			reason?: string;
		}) => api.cancelBooking(bookingId, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.myBookings });
			queryClient.invalidateQueries({ queryKey: ['rides'] });
			toast.success('Reserva cancelada');
		},
		onError: (error: unknown) => {
			toast.error(apiErrorMessage(error, 'Não foi possível cancelar.'));
		},
	});
}

/**
 * O motorista aceita ou recusa.
 *
 * A recusa exige motivo no backend. O `onError` do `reason` é o mesmo para as
 * duas decisões porque o servidor manda a razão pela mesma via.
 */
export function useDecideBooking(rideId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: {
			bookingId: string;
			decision: 'CONFIRMED' | 'REJECTED';
			reason?: string;
		}) => api.decideBooking(input.bookingId, input.decision, input.reason),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: qk.rideBookings(rideId) });
			queryClient.invalidateQueries({ queryKey: qk.ride(rideId) });
			queryClient.invalidateQueries({ queryKey: ['rides'] });
			queryClient.invalidateQueries({ queryKey: qk.myRides });

			toast.success(
				variables.decision === 'CONFIRMED'
					? 'Pedido aceite.'
					: 'Pedido recusado.',
			);
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível decidir o pedido.'),
			);
		},
	});
}

export function useRideActions(rideId: string) {
	const queryClient = useQueryClient();

	function done(message: string) {
		queryClient.invalidateQueries({ queryKey: qk.ride(rideId) });
		queryClient.invalidateQueries({ queryKey: ['rides'] });
		queryClient.invalidateQueries({ queryKey: qk.myRides });
		toast.success(message);
	}

	function failed(error: unknown, fallback: string) {
		toast.error(apiErrorMessage(error, fallback));
	}

	const cancel = useMutation({
		mutationFn: (reason?: string) => api.cancelRide(rideId, reason),
		onSuccess: () => done('Boleia cancelada'),
		onError: (error: unknown) =>
			failed(error, 'Não foi possível cancelar a boleia.'),
	});

	const start = useMutation({
		mutationFn: () => api.startRide(rideId),
		onSuccess: () => done('Boleia iniciada. Os passageiros já estão a bordo.'),
		onError: (error: unknown) =>
			failed(error, 'Não foi possível iniciar a boleia.'),
	});

	const finish = useMutation({
		mutationFn: () => api.finishRide(rideId),
		onSuccess: () => done('Boleia concluída'),
		onError: (error: unknown) =>
			failed(error, 'Não foi possível concluir a boleia.'),
	});

	return { cancel, start, finish };
}
