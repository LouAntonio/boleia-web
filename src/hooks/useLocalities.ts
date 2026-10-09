import { useQuery } from '@tanstack/react-query';
import { qk } from '../lib/queryClient';
import * as api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';

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
