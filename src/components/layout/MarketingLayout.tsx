import { Outlet } from 'react-router-dom';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

/**
 * O invólucro das páginas públicas.
 *
 * Cabeçalho e rodapé saem de `<Outlet />` para que a 404, que tem o seu
 * próprio rodapé preto e a sua própria cabeçeira, não fique com o cabeçalho
 * branco da landing em cima do fundo escuro.
 */
export function MarketingLayout() {
	return (
		<div className="flex min-h-screen flex-col">
			<MarketingHeader />
			<main className="flex-1">
				<Outlet />
			</main>
			<MarketingFooter />
		</div>
	);
}
