import { Hero, DriverCallout } from '../components/marketing/Hero';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { ProvincesMap } from '../components/marketing/ProvincesMap';
import { LiveRides } from '../components/marketing/LiveRides';
import { Trust } from '../components/marketing/Trust';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * A página institucional.
 *
 * A ordem das secções é uma ordem de objecções, não uma ordem de beateness:
 *
 * 1. **O que é isto** — a hero e a estrada. Uma pessoa chega aqui de um link
 *    partilhado no WhatsApp e precisa de perceber em três segundos.
 * 2. **Como se usa** — os três passos. Quem já percebeu o que é, agora quer saber
 *    como.
 * 3. **Onde** — as províncias. A pergunta seguinte de qualquer angolano que vai
 *    viajar entre províncias.
 * 4. **Que há agora** — as corridas reais. Substitui a conversa abstracta por
 *    factos concretos, se houver factos.
 * 5. **Confiança** — as quatro garantias. Só depois de haver interesse é que
 *    importa.
 * 6. **Conduzir** — quem não vai viajar, mas tem uma viatura vazia.
 *
 * O que esta página não tem: testemunhos sem fonte, números de utilizadores, e
 * logos de empresas. Cada um deles é uma afirmação que o backend não sustenta e
 * que alguém ia confirmar depois.
 */
export function Landing() {
	usePageTitle('/');

	return (
		<>
			<Hero />
			<HowItWorks />
			<ProvincesMap />
			<LiveRides />
			<Trust />
			<DriverCallout />
		</>
	);
}
