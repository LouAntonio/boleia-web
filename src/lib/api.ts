/**
 * Todos os pedidos ao backend, num sítio só.
 *
 * Um único ficheiro de propósito: emendar o contrato da API é uma tarefa, e
 * espalhar as assinaturas por treze pastas transforma-a em caça ao tesouro.
 * Os componentes nunca chamam o axios — usam estas funções.
 *
 * **Excepto a autenticação, que já não vive aqui.** Login, registo, OTP,
 * recuperação de senha e OAuth vão pelo `authClient` do better-auth
 * (`lib/auth-client.ts`) e, no caso dos endpoints de telefone, pelo
 * `lib/phone-auth.ts`. Ficam fora porque pertencem a outro cliente HTTP, com
 * outra forma de erro: misturá-los neste ficheiro obrigaria cada consumidor de
 * auth a perceber as duas.
 */
import { apiClient } from './axios';
import type {
	Booking,
	EmergencyContact,
	KycMe,
	KycStatus,
	NotificationPage,
	Paged,
	PaymentMethod,
	PublicRide,
	PublicRideDetail,
	Ride,
	RideScope,
	RideStatus,
	SessionUser,
	UploadSignature,
	Vehicle,
} from '../types/api';

/* ---------- Perfil ---------- */

/**
 * Campos que `PATCH /api/account/profile` aceita.
 *
 * Só `name`, `surname` e `bio`. `phone` e `imageId` aqui eram promessa vazia:
 * o endpoint não os aceita, e devolve `Nada para atualizar` se forem os únicos
 * a mudar. A página de perfil prometia ao utilizador que mudar o número
 * disparava um código por WhatsApp — nenhum código era enviado, e a alteração
 * era descartada em silêncio.
 */
export interface ProfileUpdate {
	name?: string;
	surname?: string;
	bio?: string;
}

/**
 * Actualiza o perfil e devolve **apenas os campos alterados**.
 *
 * O endpoint responde com o utilizador em plano, não embrulhado em `{ user }`
 * (`account.service.ts`) — e o `select` do serviço devolve só
 * `{ id, name, surname, bio, phone }`. Não devolve `role`, `email`,
 * `createdAt` nem `image`.
 *
 * A versão anterior tipava isto como `SessionUser` e o `useUpdateProfile`
 * escrevia a resposta no store com `setUser(toSessionUser(user))`. O
 * `toSessionUser` preenche o que falta com omissões seguras (`role: 'USER'`,
 * `email: ''`, `createdAt: ''`), pelo que **guardar o nome despromovia o
 * utilizador a USER e apagava o email do `localStorage`**. O envelope estava
 * certo; a forma de escrever no store é que não era. Por isso o retorno é um
 * parcial e a escrita é um merge.
 */
export async function updateProfile(
	input: ProfileUpdate,
): Promise<Partial<SessionUser>> {
	const { data } = await apiClient.patch<Partial<SessionUser>>(
		'/api/account/profile',
		input,
	);
	return data;
}

/**
 * Elimina a conta do utilizador autenticado.
 *
 * Vai para `POST /api/account/delete`, e não para o `delete-user` do
 * better-auth: o endpoint do backend marca a conta como removida e apaga
 * sessões, notificações e dispositivos de push numa transacção. O
 * `delete-user` apagaria a linha do utilizador e deixaria os dispositivos
 * registados a receber as notificações de cada corrida.
 */
export async function deleteAccount(): Promise<{ status: true }> {
	const { data } = await apiClient.post<{ status: true }>('/api/account/delete');
	return data;
}

/**
 * Desvincula a conta Google.
 *
 * Não usa o `unlink-account` do better-auth porque `allowUnlinkingAll: false`
 * recusa sempre que a linha do Google é a única. A rota do backend aplica a
 * regra certa: só recusa quando **nenhuma** outra credencial fica disponível
 * depois de desvincular.
 */
export async function unlinkGoogle(): Promise<{ status: true }> {
	const { data } = await apiClient.post<{ status: true }>(
		'/api/account/unlink-google',
	);
	return data;
}

/**
 * Uma sessão activa, tal como o `list-sessions` do better-auth a devolve.
 *
 * Chama-se `SessionRow` e **não** `Session` porque já existe um tipo `Session`
 * em `types/api.ts` com outro sentido (a sessão do utilizador autenticado).
 * Interfaces em TypeScript fundem-se em vez de se substituírem, e um segundo
 * `Session` não dava erro — dava uma personagem com os dois conjuntos de campos.
 *
 * `token` é o segredo de que a sessão precisa para ser revogada
 * (`revoke-session` leva-o no corpo). Nunca é mostrado nem registado: só volta
 * ao servidor quando a pessoa decide terminar aquela sessão.
 */
export interface SessionRow {
	token: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	expiresAt: string | Date;
	ipAddress: string | null;
	userAgent: string | null;
}

export async function fetchEmergencyContact(): Promise<EmergencyContact | null> {
	const { data } = await apiClient.get<EmergencyContact | null>(
		'/api/emergency-contact',
	);
	return data;
}

export async function saveEmergencyContact(
	input: Pick<EmergencyContact, 'name' | 'phone'>,
): Promise<EmergencyContact> {
	const { data } = await apiClient.put<EmergencyContact>(
		'/api/emergency-contact',
		input,
	);
	return data;
}

/* ---------- Localidades ---------- */

/* ---------- Corridas ---------- */

/*
 * Os filtros de lugar aceitam o **código** da província ou do município
 * (`huambo.catabola`), e não o UUID. A lista é local (`lib/locations.ts`): os
 * clientes deixaram de pedir `/api/locality/*`. O backend ainda aceita o UUID,
 * para não partir links antigos.
 */
export interface ListRidesQuery {
	/** Código do município de origem. Modo "intermunicipal". */
	origin?: string;
	/** Código do município de destino. Modo "intermunicipal". */
	destination?: string;
	/**
	 * Código da província de origem. Modo "interprovincial".
	 *
	 * O backend trata município e província como predicados **independentes**:
	 * mandar os dois obriga a que a paragem esteja naquela província **e** seja
	 * aquele município. Cada modo manda só o seu.
	 */
	originProvinceId?: string;
	/** Código da província de destino. Modo "interprovincial". */
	destinationProvinceId?: string;
	/**
	 * Restringe ao modo escolhido no separador. Sem isto, a mesma pesquisa
	 * devolvia corridas intermunicipais e interprovinciais ao mesmo tempo.
	 */
	scope?: RideScope;
	/** Dia inteiro, em `AAAA-MM-DD`. */
	date?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
}

/**
 * Corridas com lugares livres, para a listagem pública da landing.
 *
 * Devolve o array puro como `/api/rides`. Se um dia a rota vier a responder com
 * outro formato, esta função é o único sítio a corrigir.
 */
export async function listPublicRides(limit = 6): Promise<PublicRide[]> {
	const { data } = await apiClient.get<PublicRide[]>('/api/rides/public', {
		params: { limit },
	});
	return Array.isArray(data) ? data : [];
}

/**
 * Corridas agendadas, paginadas.
 *
 * O backend devolve o array puro e põe o total em `X-Total-Count`. O CORS
 * expõe esse cabeçalho — se for retirado do backend, o site perde a contagem
 * e passa a mostrar só a primeira página sem o dizer.
 */
export async function listRides(
	query: ListRidesQuery = {},
): Promise<{ rows: Ride[]; total: number }> {
	const response = await apiClient.get<Ride[]>('/api/rides', {
		params: { ...query },
	});

	const total = Number(response.headers['x-total-count'] ?? 0);
	return {
		rows: response.data,
		total: Number.isFinite(total) ? total : response.data.length,
	};
}

export async function fetchRide(id: string): Promise<Ride> {
	const { data } = await apiClient.get<Ride>(`/api/rides/${id}`);
	return data;
}

/**
 * Detalhe público de uma corrida, para o link partilhado.
 *
 * Não usa `fetchRide`: aquele endpoint exige sessão e devolve telefone do
 * motorista e matrícula. Este é a projecção pública, e é a única que a página
 * `/viagens/:id` pode pedir sem sessão.
 */
export async function fetchPublicRide(id: string): Promise<PublicRideDetail> {
	const { data } = await apiClient.get<PublicRideDetail>(
		`/api/rides/public/${id}`,
	);
	return data;
}

export async function fetchMyRides(
	query: { status?: RideStatus; page?: number; limit?: number } = {},
): Promise<Paged<Ride>> {
	const { data } = await apiClient.get<Paged<Ride>>('/api/rides/mine', {
		params: { ...query },
	});
	return data;
}

export interface CreateRideInput {
	vehicleId: string;
	/** Código do município de origem (`luanda.talatona`). */
	originLocalityId: string;
	/** Código do município de destino (`luanda.viana`). */
	destinationLocalityId: string;
	/** Modo declarado pelo motorista. */
	scope: RideScope;
	departureAt: string;
	arrivalAt: string;
	pricePerSeat: number;
	seatsTotal: number;
	stops?: {
		localityId?: string;
		name?: string;
		time?: string;
		distanceKm?: number;
	}[];
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
	const { data } = await apiClient.post<Ride>('/api/rides', input);
	return data;
}

export async function updateRide(
	id: string,
	input: Partial<
		Pick<
			CreateRideInput,
			'departureAt' | 'arrivalAt' | 'pricePerSeat' | 'seatsTotal'
		>
	>,
): Promise<Ride> {
	const { data } = await apiClient.patch<Ride>(`/api/rides/${id}`, input);
	return data;
}

export async function cancelRide(id: string, reason?: string): Promise<Ride> {
	const { data } = await apiClient.post<Ride>(`/api/rides/${id}/cancel`, {
		reason,
	});
	return data;
}

export async function startRide(id: string): Promise<Ride> {
	const { data } = await apiClient.post<Ride>(`/api/rides/${id}/start`);
	return data;
}

export async function finishRide(id: string): Promise<Ride> {
	const { data } = await apiClient.post<Ride>(`/api/rides/${id}/finish`);
	return data;
}

/* ---------- Reservas ---------- */

export interface CreateBookingInput {
	seats: number;
	paymentMethod: PaymentMethod;
	pickStopIndex?: number;
	dropStopIndex?: number;
}

export async function bookRide(
	rideId: string,
	input: CreateBookingInput,
): Promise<Booking> {
	const { data } = await apiClient.post<Booking>(
		`/api/rides/${rideId}/bookings`,
		input,
	);
	return data;
}

export async function fetchMyBookings(): Promise<Booking[]> {
	const { data } = await apiClient.get<Booking[]>('/api/rides/bookings/mine');
	return data;
}

export async function fetchRideBookings(rideId: string): Promise<Booking[]> {
	const { data } = await apiClient.get<Booking[]>(
		`/api/rides/${rideId}/bookings`,
	);
	return data;
}

/** O motorista aceita ou recusa um pedido. A recusa exige motivo. */
export async function decideBooking(
	bookingId: string,
	decision: 'CONFIRMED' | 'REJECTED',
	reason?: string,
): Promise<Booking> {
	const { data } = await apiClient.patch<Booking>(`/api/bookings/${bookingId}`, {
		decision,
		reason,
	});
	return data;
}

export async function cancelBooking(
	bookingId: string,
	reason?: string,
): Promise<Booking> {
	const { data } = await apiClient.post<Booking>(
		`/api/bookings/${bookingId}/cancel`,
		{ reason },
	);
	return data;
}

/* ---------- Viaturas ---------- */

export async function fetchMyVehicles(): Promise<Vehicle[]> {
	const { data } = await apiClient.get<Vehicle[]>('/api/vehicles/mine');
	return data;
}

export interface CreateVehicleInput {
	make: string;
	model: string;
	color: string;
	plate: string;
	seats: number;
	photoIds: string[];
}

export async function createVehicle(
	input: CreateVehicleInput,
): Promise<{ id: string; status: KycStatus }> {
	const { data } = await apiClient.post<{ id: string; status: KycStatus }>(
		'/api/vehicles',
		input,
	);
	return data;
}

export async function deleteVehicle(id: string): Promise<void> {
	await apiClient.delete(`/api/vehicles/${id}`);
}

/* ---------- KYC ---------- */

export async function fetchKycMe(): Promise<KycMe> {
	const { data } = await apiClient.get<KycMe>('/api/kyc/me');
	return data;
}

/**
 * Os dois formulários partilham o mesmo tipo de media.
 *
 * Ficavam dois idênticos e divergentes — o do passageiro tinha menos um campo,
 * e esse campo a menos era exactamente o `bodyPhoto` que o servidor exige
 * (`kyc.service.ts`, `assertPassengerMedia`). Com o tipo único, faltou um campo
 * num sítio e o compilador diz.
 */
interface KycMediaIdsInput {
	biFront: string;
	biBack: string;
	selfies: string[];
	license?: string;
	bodyPhoto?: string;
}

export interface SubmitDriverKycInput {
	mediaIds: KycMediaIdsInput;
}

export interface SubmitPassengerKycInput {
	/** `bodyPhoto` é obrigatório no servidor, como no telemóvel. */
	mediaIds: KycMediaIdsInput;
}

export async function submitDriverKyc(
	input: SubmitDriverKycInput,
): Promise<{ id: string; status: KycStatus }> {
	const { data } = await apiClient.put<{ id: string; status: KycStatus }>(
		'/api/kyc/driver',
		input,
	);
	return data;
}

export async function submitPassengerKyc(
	input: SubmitPassengerKycInput,
): Promise<{ id: string; status: KycStatus }> {
	const { data } = await apiClient.put<{ id: string; status: KycStatus }>(
		'/api/kyc/passenger',
		input,
	);
	return data;
}

/* ---------- Notificações ---------- */

export async function fetchNotifications(
	query: { page?: number; limit?: number } = {},
): Promise<NotificationPage> {
	const { data } = await apiClient.get<NotificationPage>('/api/notifications', {
		params: { ...query },
	});
	return data;
}

export async function fetchUnreadCount(): Promise<number> {
	const { data } = await apiClient.get<{ unread: number }>(
		'/api/notifications/unread-count',
	);
	return data.unread;
}

export async function markNotificationRead(id: string): Promise<void> {
	await apiClient.patch(`/api/notifications/${id}`, { read: true });
}

export async function markAllNotificationsRead(): Promise<void> {
	await apiClient.patch('/api/notifications/read-all');
}

/* ---------- Upload ---------- */

/**
 * Assinatura de upload para o Cloudinary.
 *
 * O fluxo tem três passos e vale a pena entender porquê: pedir a assinatura
 * (que cria o registo `media`), mandar o ficheiro directamente para o Cloudinary
 * com essa assinatura, e confirmar. O passo do meio vai de browser para o
 * Cloudinary e não passa pelo backend — por isso não é `apiClient` — para não
 * ocupar a API com bytes de imagem.
 */
export type UploadOwnerType = 'USER' | 'VEHICLE' | 'DRIVER_KYC' | 'PASSENGER_KYC';

export async function requestUploadSignature(input: {
	ownerType: UploadOwnerType;
}): Promise<UploadSignature> {
	const { data } = await apiClient.post<UploadSignature>(
		'/api/cloudinary/signature',
		input,
	);
	return data;
}

export async function confirmUpload(publicId: string): Promise<void> {
	await apiClient.post('/api/cloudinary/confirm', { publicId });
}

/**
 * Os campos que o Cloudinary assina, e que têm de viajar no pedido.
 *
 * O backend assina seis parâmetros (`cloudinary.service.ts`, `toSign`):
 * `timestamp`, `public_id`, `transformation`, `eager`, `allowed_formats` e,
 * nos documentos de KYC, `type` (`private`). O Cloudinary recalcula a
 * assinatura **sobre o que recebe**; um parâmetro assinado que não vai no
 * pedido faz a assinatura não bater e o upload ser recusado com um 400 sem
 * explicação.
 *
 * O `allowed_formats` faltava aqui e o `eager` faltava na app móvel — em
 * conjunto, KYC e registo de viaturas não funcionavam em lado nenhum.
 */
const SIGNED_UPLOAD_FIELDS = [
	'timestamp',
	'public_id',
	'transformation',
	'eager',
	'allowed_formats',
	'type',
] as const;

function formatMegabytes(bytes: number): string {
	return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',');
}

/**
 * Extensões que o Cloudinary aceita por tipo MIME.
 *
 * O `CLOUDINARY_ALLOWED_FORMATS` é configurável, por isso a comparação é em
 * extensões (o que o Cloudinary valida), não em MIME. O `image/jpeg` cobre
 * `jpg` e `jpeg`, que são o mesmo formato escrito de duas maneiras.
 */
const FORMATS_BY_MIME: Record<string, string[]> = {
	'image/jpeg': ['jpg', 'jpeg'],
	'image/png': ['png'],
	'image/webp': ['webp'],
	'image/avif': ['avif'],
	'image/heic': ['heic', 'heif'],
};

/**
 * Recusa localmente o que o Cloudinary recusaria — com uma frase útil.
 *
 * A assinatura já traz `maxBytes` e `allowedFormats`, e nada os lia: um ficheiro
 * de 30 MB ou um HEIC de iPhone só descobria o problema depois de subir. Aqui a
 * pessoa sabe logo o que se passa e não gasta dados.
 */
function assertUploadable(file: File, signature: UploadSignature): void {
	if (file.size > signature.maxBytes) {
		throw new Error(
			`A imagem tem ${formatMegabytes(file.size)} MB e o máximo é ` +
				`${formatMegabytes(signature.maxBytes)} MB.`,
		);
	}

	const allowed = signature.allowedFormats
		.split(',')
		.map((format) => format.trim().toLowerCase())
		.filter(Boolean);
	if (allowed.length === 0) return;

	const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
	const candidates = FORMATS_BY_MIME[file.type] ?? (extension ? [extension] : []);
	if (!candidates.some((format) => allowed.includes(format))) {
		throw new Error(
			`Formato não aceite${extension ? ` (${extension})` : ''}. ` +
				`Usa ${allowed.join(', ')}.`,
		);
	}
}

/**
 * A mensagem do Cloudinary, quando o upload é recusado.
 *
 * Um 401 por credenciais erradas chegava ao ecrã como "Não foi possível
 * carregar a imagem." — verdadeiro, mas inútil: a causa ("Unknown API key")
 * estava no corpo da resposta e era deitada fora.
 */
async function uploadErrorMessage(response: Response): Promise<string> {
	const fallback = 'Não foi possível carregar a imagem. Tenta de novo.';
	try {
		const body = (await response.json()) as {
			error?: { message?: string };
		};
		const detail = body.error?.message?.trim();
		if (detail) {
			return `A imagem não foi aceite: ${detail}.`;
		}
	} catch {
		// Corpo não-JSON (proxy, página de erro): fica a mensagem genérica.
	}
	return fallback;
}

function appendSignedParams(form: FormData, signature: UploadSignature): void {
	// `public_id` e `allowed_formats` têm sublinhado no protocolo do Cloudinary;
	// o objecto da API usa camelCase.
	for (const field of SIGNED_UPLOAD_FIELDS) {
		const value =
			field === 'public_id'
				? signature.publicId
				: field === 'allowed_formats'
					? signature.allowedFormats
					: signature[field];
		if (value !== undefined && value !== null && value !== '') {
			form.append(field, String(value));
		}
	}
}

/** O que um upload bem-sucedido deixa na mão do cliente. */
export interface UploadedAsset {
	/** `Media.id` — UUID da nossa base. É o que o KYC e as viaturas guardam. */
	mediaId: string;
	/** `Media.publicId` — o que `fetchMediaUrl` procura. */
	publicId: string;
}

/**
 * Assinatura → Cloudinary → confirmar.
 *
 * Devolve os dois identificadores porque os dois são necessários e nenhum
 * se obtém do outro: o `mediaId` vai no corpo do pedido de KYC ou de
 * viatura, e o `publicId` só existe na assinatura — é o que o endpoint de
 * URL procura para mostrar o ficheiro mais tarde.
 */
export async function uploadImage(
	file: File,
	ownerType: UploadOwnerType,
): Promise<UploadedAsset> {
	const signature = await requestUploadSignature({ ownerType });
	assertUploadable(file, signature);

	const form = new FormData();
	form.append('file', file);
	form.append('api_key', signature.apiKey);
	form.append('signature', signature.signature);
	appendSignedParams(form, signature);

	const response = await fetch(signature.uploadUrl, {
		method: 'POST',
		body: form,
	});
	if (!response.ok) {
		throw new Error(await uploadErrorMessage(response));
	}

	await confirmUpload(signature.publicId);
	return { mediaId: signature.mediaId, publicId: signature.publicId };
}

/**
 * Envia uma lista de ficheiros **pela ordem dada**, um de cada vez.
 *
 * É o que os formulários usam no submit: o KYC e a viatura remontam os ids por
 * posição, por isso a ordem não pode depender de `Promise.all`. O callback de
 * progresso permite dizer "A enviar 2/5…" em vez de um botão parado.
 */
export async function uploadImages(
	files: File[],
	ownerType: UploadOwnerType,
	onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
	const mediaIds: string[] = [];
	for (const file of files) {
		onProgress?.(mediaIds.length + 1, files.length);
		const asset = await uploadImage(file, ownerType);
		mediaIds.push(asset.mediaId);
	}
	return mediaIds;
}

/**
 * URL de entrega de um ficheiro, para mostrar uma foto já guardada.
 *
 * O `publicId` (não o `mediaId`) é o que o endpoint procura: `MediaService`
 * faz `findUnique({ where: { publicId } })`. Passar o `mediaId` — que é um UUID
 * da nossa base — nunca casa, e a resposta é um 404. `uploadImage` devolve o
 * `mediaId` porque é isso que o KYC e as viaturas guardam, mas para *mostrar*
 * um ficheiro já guardado é preciso o `publicId` da assinatura.
 */
export async function fetchMediaUrl(publicId: string): Promise<string | null> {
	const { data } = await apiClient.get<{ url: string | null }>(
		'/api/cloudinary/url',
		{ params: { publicId } },
	);
	return data.url;
}
