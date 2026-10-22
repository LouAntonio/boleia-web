import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Rola a janela para o topo sempre que a rota muda.
 *
 * O `react-router-dom` preserva a posição de scroll entre navegações: abrir
 * `/app/notificacoes`, descer até ao fim e carregar "/app/perfil" deixa a
 * página nova no rodapé. Cada ecrã tem a sua altura — a lista de reservas é
 * comprida, a de perfil é curta — e herdar a rolagem faz parecer que a página
 * nova não carregou.
 *
 * Vai ao topo e não a um elemento por id: âncoras internas (`#como-funciona`,
 * por exemplo) dependem do hash e o browser já cuida delas. Aqui é só o
 * lado-efecto de mudar de endereço.
 *
 * Montado uma vez, no `App`, fora de qualquer layout: o scroll pertence ao
 * browser, não a nenhum grupo de rotas — mudar de grupo também muda muito
 * bem de página.
 */
export function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);

	return null;
}
