import { useQueries, useQuery } from '@tanstack/react-query';
import { qk } from '../lib/queryClient';
import * as api from '../lib/api';
import type { Locality, Province } from '../types/api';

/**
 * As 21 províncias de Angola.
 *
 * Rota **pública**, sem guard nenhum (`locality.controller.ts`, `@Get('provinces')`).
 * O comentário anterior dizia o contrário — "só quando há sessão: o backend só
 * as expõe a quem está dentro" — e o `enabled: Boolean(token)` que o acompanhava
 * era consequência disso. A consequence prática era que a landing page, que é
 * pública, não podia usar estes hooks.
 *
 * `enabled` existe para quem só quer a lista a partir do momento em que há
 * interaccionamento — a landing page. Com `false` o React Query guarda a
 * query sem a disparar, e o primeiro render não custa um pedido. O default é
 * `true` para não mudar o comportamento de quem já contava com os dados
 * disponíveis à mão.
 */
export function useProvinces(enabled = true) {
	return useQuery({
		queryKey: qk.provinces,
		queryFn: api.listProvinces,
		enabled,
		// Não mudam durante uma sessão de dois dias.
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
	});
}

export function useLocalities(provinceId: string | null) {
	return useQuery({
		queryKey: qk.localities(provinceId ?? ''),
		queryFn: () => api.listLocalities(provinceId as string),
		enabled: Boolean(provinceId),
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
	});
}

export function useLocalityOptions(provinceId: string | null) {
	const { data, isPending } = useLocalities(provinceId);

	const options = (data ?? []).map((locality) => ({
		value: locality.id,
		label: locality.name,
	}));

	return { options, isPending };
}

/**
 * Todas as localidades, de todas as províncias.
 *
 * A pesquisa interprovincial precisa de filtrar por município em qualquer
 * província, mas o backend só expõe as localidades uma província de cada vez.
 * Pedimos uma por província, em paralelo; o React Query trata do cache e do
 * deduplicar, pelo que abrir o selector outra vez não refaz pedidos. É a mesma
 * estratégia que o telemóvel usa em `useAllLocalities`.
 *
 * A rota de localidades é pública (`OptionalAuthGuard`, que resolve a sessão
 * quando existe e não recusa quando não existe), por isso isto também serve
 * à landing page. O resultado fica em cache um dia — as localidades não mudam.
 *
 * `enabled` propaga para as duas pontas: para o pedido das províncias e para
 * cada uma das 21 peticiones que dele dependem. Sem ele, abrir a landing page
 * dispara 22 pedidos em paralelo antes de alguém ter tocado em seja no que
 * for. Com ele, a lista só é buscada quando o `LocalityFilter` é activado.
 */
export function useAllLocalities(enabled = true) {
	const provinces = useProvinces(enabled);
	const results = useQueries({
		queries: (provinces.data ?? []).map((province) => ({
			queryKey: qk.localities(province.id),
			queryFn: () => api.listLocalities(province.id),
			enabled,
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 24,
		})),
	});

	return {
		localities: results.flatMap((result) => result.data ?? []),
		/*
		 * `isLoading` e não `isPending`. Uma query desactivada está `isPending`
		 * (nunca teve dados) mas não está `isFetching`, e `isLoading` é
		 * precisamente `isPending && isFetching`. Com `enabled: false` isso dá
		 * `false` — que é o que se quer: a lista não está "a carregar", está
		 * "ainda não foi pedida". O `isPending` daria `true` e o modal
		 * mostraria um spinner eterno em cima de uma lista que ninguém pediu.
		 */
		isLoading:
			provinces.isLoading || results.some((result) => result.isLoading),
	};
}

/** Índice por id, para mostrar o nome de uma escolha sem refazer a busca. */
export function indexLocalities(localities: Locality[]): Map<string, Locality> {
	return new Map(localities.map((item) => [item.id, item]));
}

/** Índice por id de província, para mostrar o nome ao lado do município. */
export function indexProvinces(provinces: Province[]): Map<string, string> {
	return new Map(provinces.map((item) => [item.id, item.name]));
}
