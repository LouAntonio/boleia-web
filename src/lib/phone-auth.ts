/**
 * Os endpoints de telefone do Boleia.
 *
 * Estes não são rotas stock do better-auth: vêm de um plugin do backend
 * (`back/src/auth/phone-auth.ts`, id `boleia-phone-auth`) e por isso não têm
 * métodos gerados no cliente. É o que justifica este ficheiro existir.
 *
 * **Porque `$fetch` e não um client plugin com `$InferServerPlugin`**, que é o
 * caminho que a documentação do better-auth sugere para endpoints customizados:
 *
 * O proxy do cliente é dinâmico — `client/proxy.mjs:30` reconstrói o path a
 * partir da cadeia de propriedades acedidas (`authClient.phone.signIn()` →
 * `/phone/sign-in`). Ou seja, em runtime nada é preciso do servidor. O
 * `$InferServerPlugin` serviria **apenas para os tipos**, e esses tipos
 * teriam de ser escritos à mão contra o `Endpoint` do `better-call`, nos dois
 * repositórios, duplicando os schemas zod do backend.
 *
 * Uma segunda fonte de verdade para seis formatos de pedido é um mau negócio:
 * se divergir, o TypeScript confirma a nossa suposição e o servidor recebe o
 * corpo errado em silêncio. Aqui os tipos vivem **neste** ficheiro, ao lado dos
 * tipos de entrada que o `lib/api.ts` já tinha, e o `$fetch` fica explícito.
 *
 * Os nomes dos caminhos não são um palpite: `proxy.mjs:30` e
 * `client/path-to-object.d.mts:50` aplicam a mesma regra dos dois lados.
 */
import { authClient, toAuthRequestError } from './auth-client';

export interface PhoneCredentials {
	phone: string;
	password: string;
	rememberMe?: boolean;
}

export interface SignUpPhoneInput {
	phone: string;
	password: string;
	name: string;
	surname?: string;
	email?: string;
	termsAccepted: boolean;
	marketingAccepted?: boolean;
}

export type OtpPurpose = 'signup' | 'reset';

export interface OtpVerified {
	token?: string;
	expiresAt?: string;
}

export interface StatusResponse {
	status: boolean;
	/**
	 * Cópia temporária do OTP, só quando o backend tem
	 * `OTP_PREVIEW_IN_RESPONSE` ligado. Em produção com WAME a funcionar este
	 * campo não vem e a UI mantém a mensagem genérica.
	 */
	otp?: string;
}

export interface SignInResponse {
	user: unknown;
	redirect?: boolean;
	token?: string;
}

/**
 * `POST /api/auth/phone/sign-in`
 *
 * Não devolve o token: devolve a sessão em cookie. O `set-auth-token` continua
 * no header porque o plugin `bearer` do backend o escreve para os clientes sem
 * cookies (a app móvel), mas o site deixou de depender dele — e foi
 * exactamente essa dependência que produzia *"Não foi possível entrar com essa
 * senha"* com a senha certa.
 */
export async function signInPhone(
	input: PhoneCredentials,
): Promise<SignInResponse> {
	const result = await authClient.$fetch('/phone/sign-in', {
		method: 'POST',
		body: input,
	});
	const error = toAuthRequestError(
		result,
		'Não foi possível entrar com essa senha.',
	);
	if (error) throw error;
	return (result.data ?? {}) as SignInResponse;
}

/**
 * `POST /api/auth/phone/sign-up`
 *
 * Regista mas **não abre sessão**: cria a conta com um email sintético e fica à
 * espera do código de 6 dígitos. Por isso o registo manda para `/verificar` e
 * não para dentro do site.
 */
export async function signUpPhone(
	input: SignUpPhoneInput,
): Promise<StatusResponse> {
	const result = await authClient.$fetch('/phone/sign-up', {
		method: 'POST',
		body: input,
	});
	const error = toAuthRequestError(result, 'Não foi possível criar a conta.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}

export async function sendOtp(
	phone: string,
	purpose: OtpPurpose,
): Promise<StatusResponse> {
	const result = await authClient.$fetch('/phone/otp/send', {
		method: 'POST',
		body: { phone, purpose },
	});
	const error = toAuthRequestError(result, 'Não foi possível enviar o código.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}

/**
 * `POST /api/auth/phone/otp/verify`
 *
 * Com `purpose: 'reset'` devolve um `token` de recuperação válido apenas para a
 * chamada seguinte a `/reset-password` — o porquê de o `ResetPassword` o passar
 * pelo `state` da rota em vez de o guardar.
 */
export async function verifyOtp(
	phone: string,
	code: string,
	purpose: OtpPurpose,
): Promise<OtpVerified> {
	const result = await authClient.$fetch('/phone/otp/verify', {
		method: 'POST',
		body: { phone, code, purpose },
	});
	const error = toAuthRequestError(result, 'Código inválido ou expirado.');
	if (error) throw error;
	return (result.data ?? {}) as OtpVerified;
}

export async function forgotPassword(
	phone: string,
	redirectTo?: string,
): Promise<StatusResponse> {
	const result = await authClient.$fetch('/forgot-password', {
		method: 'POST',
		body: { phone, redirectTo },
	});
	const error = toAuthRequestError(result, 'Não foi possível pedir o código.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}

export async function resetPassword(
	token: string,
	newPassword: string,
): Promise<StatusResponse> {
	const result = await authClient.$fetch('/reset-password', {
		method: 'POST',
		body: { token, newPassword },
	});
	const error = toAuthRequestError(result, 'Não foi possível redefinir a senha.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}
