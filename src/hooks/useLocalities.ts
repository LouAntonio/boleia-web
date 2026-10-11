import { useQueries, useQuery } from '@tanstack/react-query';
import { qk } from '../lib/queryClient';
import * as api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';
import type { Locality, Province } from '../types/api';

/**
 * As 21 províncias de Angola.
 *
 * Só quando há sessão: o backend só as expõe a quem está dentro. A landing usa
 * a lista local de `lib/geo.ts`, que vem da mesma seed — assim a secção pública
 * não depende de um endpoint protegido.
 */
export function useProvinces() {
	const token = useAuthStore((s) => s.token);

	return useQuery({
		queryKey: qk.provinces,
		queryFn: api.listProvinces,
		enabled: Boolean(token),
		// Não mudam durante uma sessão de dois dias.
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
	});
}

export function useLocalities(provinceId: string | null) {
	const token = useAuthStore((s) => s.token);

	return useQuery({
		queryKey: qk.localities(provinceId ?? ''),
		queryFn: () => api.listLocalities(provinceId as string),
		enabled: Boolean(token) && Boolean(provinceId),
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
 * Só acontece dentro da app autenticada, e o resultado fica em cache um dia —
 * as localidades não mudam.
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
