import { GoogleIcon } from './GoogleIcon';
import { Button } from '../ui/Button';
import { authClient } from '../../lib/auth-client';

/**
 * Entrar com Google.
 *
 * Sai do sítio: o better-auth redirecciona para o Google e traz a pessoa de
 * volta a `/entrar/social/callback`, que é onde a sessão — gravada **em
 * cookie** pelo servidor — é lida. Por isso isto é um `<button>` que dispara
 * uma navegação, e não uma `mutate` de axios: não há nada a esperar.
 *
 * Antes a URL era montada à mão, com `provider` e `callbackURL` concatenados e
 * `encodeURIComponent` por fora. O `signIn.social` faz isso, valida o
 * `callbackURL` contra as origens de confiança e trata do caso de o servidor
 * não ter o Google configurado.
 *
 * Sem `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` o servidor recusa, e a pessoa
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
			onClick={() => {
				void authClient.signIn.social({
					provider: 'google',
					callbackURL: `${window.location.origin}/entrar/social/callback`,
				});
			}}
		>
			<GoogleIcon />
			{label}
		</Button>
	);
}
