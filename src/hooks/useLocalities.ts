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
 */
export function useProvinces() {
	return useQuery({
		queryKey: qk.provinces,
		queryFn: api.listProvinces,
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
 */
export function useAllLocalities() {
	const provinces = useProvinces();
	const results = useQueries({
		queries: (provinces.data ?? []).map((province) => ({
			queryKey: qk.localities(province.id),
			queryFn: () => api.listLocalities(province.id),
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 24,
		})),
	});

	return {
		localities: results.flatMap((result) => result.data ?? []),
		isLoading:
			provinces.isPending || results.some((result) => result.isPending),
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
