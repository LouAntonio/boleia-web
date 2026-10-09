import { GoogleIcon } from './GoogleIcon';
import { Button } from '../ui/Button';
import { startGoogleSignIn } from '../../lib/api';

/**
 * Entrar com Google.
 *
 * Sai do sítio: o better-auth redirecciona para o Google e traz a pessoa de
 * volta a `/entrar/social/callback`, que é onde `SignInPage` troca o código
 * pela sessão. Por isso isto é um `<button>` que chama uma função de
 * navegação, e não uma `mutate` de axios — não há nada a esperar.
 *
 * Só aparece quando o backend tem `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
 * definidos. Sem eles o Google devolve um 404 a meio da navegação e a pessoa
 * fica numa página em branco sem explicação. O `GET /` devolve um 200 normal
 * quando está tudo bem, que é a forma mais barata de confirmar que o servidor
 * responde — mas não confirma que o Google existe, por isso o botão fica sempre
 * visível e o servidor é quem recusa.
 */
export function GoogleButton({ label }: { label: string }) {
	return (
		<Button
			type="button"
			variant="secondary"
			size="lg"
			full
			onClick={() => startGoogleSignIn('/entrar/social/callback')}
		>
			<GoogleIcon />
			{label}
		</Button>
	);
}
