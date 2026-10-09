import { useQuery } from '@tanstack/react-query';
import { qk } from '../lib/queryClient';
import * as api from '../lib/api';

/**
 * O estado do KYC da pessoa, dos dois lados.
 *
 * Uma query só para isto, porque o estado muda em três ecrãs ao mesmo tempo
 * (o detalhe da boleia precisa do passageiro, o painel precisa do motorista, a
 * página de verificação escreve). Separadas, cada uma tinha a sua cópia e uma
 * correção no backend deixava as três desatualizadas ao mesmo tempo.
 */
export function useKycMe() {
	return useQuery({
		queryKey: qk.kyc,
		queryFn: api.fetchKycMe,
		// O estado só muda quando a pessoa submete ou um moderador decide. Por
		// defeito, `null` — nunca submetido — que é diferente de "pendente" e
		// é o caso que a página de verificação mais precisa mostrar.
		staleTime: 1000 * 60 * 10,
	});
}
