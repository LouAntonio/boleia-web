import { QueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from './axios';

/**
 * Configuração única do React Query.
 *
 * Fica aqui e não dentro de `<QueryClientProvider>` para que qualquer teste ou
 * stories importem o mesmo. Os valores são os do `adm`, que é o mesmo produto.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			/*
			 * As províncias e as localidades saem da seed do backend e mudam uma
			 * vez por ano, no máximo. Sem isto seriam 21 pedidos cada vez que o
			 * utilizador abre o selector "de onde", e essas respostas não
			 * mudam no prazo de uma sessão.
			 */
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 30,
			retry: 1,

			// Um `401` não melhora à segunda tentativa. A resposta já é a mesma.
			retryOnMount: true,
			refetchOnWindowFocus: false,
		},
		mutations: {
			retry: false,
			onError: (error) => {
				// Rede de segurança: se um `onError` do `useMutation` se esquecer de
				// mostrar o erro, o utilizador carrega num botão e nada acontece.
				// Aqui não há como ficar em silêncio.
				if (error instanceof Error) {
					console.error(apiErrorMessage(error, 'Pedido falhado.'), error);
				}
			},
		},
	},
});

/** Chaves de query. Centralizadas para não haver duas grafias da mesma lista. */
export const qk = {
	session: ['auth', 'session'] as const,
	rides: (query: unknown) => ['rides', 'list', query] as const,
	ride: (id: string) => ['rides', 'detail', id] as const,
	publicRide: (id: string) => ['public', 'rides', 'detail', id] as const,
	publicPerson: (id: string) => ['public', 'people', 'detail', id] as const,
	/** Pesquisa pública da `/boleias`. A chave inclui os filtros aplicados. */
	publicRideSearch: (query: unknown) =>
		['public', 'rides', 'search', query] as const,
	myRides: ['rides', 'mine'] as const,
	myBookings: ['bookings', 'mine'] as const,
	rideBookings: (id: string) => ['bookings', 'ride', id] as const,
	vehicles: ['vehicles', 'mine'] as const,
	kyc: ['kyc', 'me'] as const,
	provinces: ['locality', 'provinces'] as const,
	localities: (provinceId: string) =>
		['locality', 'localities', provinceId] as const,
	notifications: ['notifications', 'list'] as const,
	unreadCount: ['notifications', 'unread'] as const,
	emergencyContact: ['emergency', 'contact'] as const,
	publicRides: (limit: number) => ['public', 'rides', limit] as const,
};
