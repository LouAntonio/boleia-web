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
	Locality,
	NotificationPage,
	Paged,
	PaymentMethod,
	Province,
	PublicRide,
	Ride,
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

/**
 * As 21 províncias.
 *
 * Routeiro público no backend: não tem dados pessoais e é a única coisa de que a
 * landing page precisa do lado geográfico. Convém para a sério — a seed do
 * backend é executada uma vez e estas 306 localidades não mudam.
 */
export async function listProvinces(): Promise<Province[]> {
	const { data } = await apiClient.get<Province[]>('/api/locality/provinces');
	return data;
}

export async function listLocalities(provinceId: string): Promise<Locality[]> {
	const { data } = await apiClient.get<Locality[]>(
		`/api/locality/provinces/${provinceId}/localities`,
	);
	return data;
}

/* ---------- Corridas ---------- */

export interface ListRidesQuery {
	/** Id da localidade de origem. Modo "intermunicipal". */
	origin?: string;
	/** Id da localidade de destino. Modo "intermunicipal". */
	destination?: string;
	/**
	 * Id da província de origem. Modo "interprovincial".
	 *
	 * O backend trata município e província como predicados **independentes**:
	 * mandar os dois obriga a que a paragem esteja naquela província **e** seja
	 * aquele município. Cada modo manda só o seu.
	 */
	originProvinceId?: string;
	/** Id da província de destino. Modo "interprovincial". */
	destinationProvinceId?: string;
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
	originLocalityId: string;
	destinationLocalityId: string;
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
	fullName: string;
	biNumber: string;
	licenseNumber?: string;
	licenseExpiry?: string;
	mediaIds: KycMediaIdsInput;
}

export interface SubmitPassengerKycInput {
	fullName: string;
	biNumber: string;
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
export async function requestUploadSignature(input: {
	ownerType: 'USER' | 'VEHICLE' | 'DRIVER_KYC' | 'PASSENGER_KYC';
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
 * O backend assina cinco parâmetros (`cloudinary.service.ts`, `toSign`):
 * `timestamp`, `public_id`, `transformation`, `eager` e `allowed_formats`. O
 * Cloudinary recalcula a assinatura **sobre o que recebe**; um parâmetro
 * assinado que não vai no pedido faz a assinatura não bater e o upload ser
 * recusado com um 400 sem explicação.
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
] as const;

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
	ownerType: 'USER' | 'VEHICLE' | 'DRIVER_KYC' | 'PASSENGER_KYC',
): Promise<UploadedAsset> {
	const signature = await requestUploadSignature({ ownerType });

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
		throw new Error('Não foi possível carregar a imagem. Tenta de novo.');
	}

	await confirmUpload(signature.publicId);
	return { mediaId: signature.mediaId, publicId: signature.publicId };
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
