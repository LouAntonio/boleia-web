/**
 * Contrato com a API do Boleia.
 *
 * Estes tipos espelham exactamente o que o backend devolve — não uma versão
 * "arrumada" para a interface. A tradução para um vocabulário de domínio é
 * trabalho do componente que consome, não do tipo, porque um mapeador só se
 * justifica quando há regra a aplicar (ver `lib/format.ts`). O backend também
 * é a fonte da verdade: os nomes dos campos são os do Prisma, porque é isso
 * é isso que se vê em `/docs` quando se depanha um erro.
 */

/* ---------- Sessão ---------- */

/** O utilizador como o better-auth o devolve em `get-session`. */
export interface SessionUser {
	id: string;
	name: string;
	surname?: string | null;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	phone?: string | null;
	role: AppRole;
	banned?: boolean | null;
	createdAt: string;
}

/**
 * Papéis do better-auth.
 *
 * O backend distingue `DRIVER` do `USER`; o `admin` do better-auth acrescenta
 * `MODERATOR`, `SUPPORT` e `ADMIN`. Nenhum destes dois últimos diz respeito ao
 * site — quem os tem entra pelo painel `adm`, não aqui.
 */
export type AppRole = 'USER' | 'DRIVER' | 'MODERATOR' | 'SUPPORT' | 'ADMIN';

/* ---------- KYC ---------- */

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Estado de um dos lados do KYC. `null` = nunca submetido. */
export interface KycState {
	status: KycStatus;
	rejectionReason: string | null;
}

/** `GET /api/kyc/me` — o que a pessoa já submeteu de cada lado. */
export interface KycMe {
	driver: KycState | null;
	passenger: KycState | null;
}

/**
 * Ficheiros de uma submissão KYC.
 *
 * São `mediaId`s, não URLs: o upload ao Cloudinary é um passo à parte que devolve
 * um id (`POST /api/cloudinary/signature` → upload → `POST /api/cloudinary/confirm`),
 * e é esse id que o KYC guarda. Ficheiros que o backend não confirme ficam
 * órfãos e são limpos pelo cron de media.
 */
export interface KycMediaIds {
	biFront: string;
	biBack: string;
	selfies: string[];
	license?: string;
	bodyPhoto?: string;
}

/* ---------- Viaturas ---------- */

export interface Vehicle {
	id: string;
	make: string;
	model: string;
	color: string;
	plate: string;
	seats: number;
	status: KycStatus;
	verifiedAt: string | null;
}

/* ---------- Corridas ---------- */

export type RideStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Distância administrativa declarada pelo motorista e gravada na corrida.
 * Não se deriva das paragens no cliente: a base de dados é a fonte de verdade.
 */
export type RideScope = 'INTERMUNICIPAL' | 'INTERPROVINCIAL';

/** Papel de uma paragem no percurso. */
export type RideStopKind = 'ORIGIN' | 'INTERMEDIATE' | 'DESTINATION';

export interface RideStop {
	sequence: number;
	kind: RideStopKind;
	localityId: string | null;
	name: string;
	/**
	 * Hora de paragem, já em WAT pelo backend, no formato `HH:MM`.
	 *
	 * Não recalcular nem converter: o servidor interpretou a hora de saída e
	 * aplicou o fuso. Um `Date` aqui daria um dia diferente a quem tem o
	 * telemóvel noutro fuso, e o passageiro apareceria a viajar no dia errado.
	 */
	timeLabel: string;
}

export interface Ride {
	id: string;
	driverId: string;
	vehicleId: string | null;
	routeName: string;
	scope: RideScope;
	departureAt: string;
	arrivalAt: string;
	seatsTotal: number;
	seatsTaken: number;
	/** Em Kwanzas. `pricePerSeat` — o que cada lugar custa, não o total. */
	pricePerSeat: number;
	status: RideStatus;
	/** Paragem em que a corrida está. Usado no acompanhamento ao vivo. */
	progressIndex: number;
	stops?: RideStop[];
	driver?: { id: string; name: string; surname?: string | null };
	vehicle?: {
		id: string;
		make: string;
		model: string;
		color: string;
		plate: string;
	} | null;
	/**
	 * Só em `GET /api/rides/:id` — "Quem vai". Pessoas confirmadas já, com
	 * reservas pendentes de lado: REQUESTED não é presença.
	 */
	passengers?: RidePassenger[];
}

/** Pessoas confirmadas numa corrida, como o backend as projecta. */
export interface RidePassenger {
	id: string;
	name: string;
	surname: string | null;
	/** Lugares que a mesma reserva ocupa — 1 por pessoa, quase sempre. */
	seats: number;
}

/**
 * Corrida na listagem pública da landing.
 *
 * Não é uma `Ride` com campos a menos: é outro endpoint, com outro propósito.
 * Sem `driverId` nem dados do motorista, porque quem vê a landing ainda não
 * entrou e não tem por que saber quem vai conduzir.
 */
export interface PublicRide {
	id: string;
	routeName: string;
	scope: RideScope;
	departureAt: string;
	arrivalAt: string;
	seatsTotal: number;
	seatsTaken: number;
	pricePerSeat: number;
	/*
	 * A rota chega numa string só, "Luanda → Benguela" — o backend não manda
	 * `originName` nem `destinationName`, e declará-los aqui punha `undefined`
	 * no ecrã e no `aria-label` do `RoadTrack`. As duas pontas derivam-se em
	 * `routeEndpoints` (`lib/format.ts`).
	 */
}

/**
 * Paragem de uma corrida no detalhe público.
 *
 * Ao contrário da listagem, o detalhe traz as paragens. A província vem junto
 * para que a página consiga dizer se a viagem é intermunicipal ou
 * interprovincial sem comparar nomes de localidades.
 */
export interface PublicRideStop extends RideStop {
	distanceKm: number;
	locality: {
		provinceId: string | null;
		province: { name: string } | null;
	} | null;
}

/** `GET /api/rides/public/:id` — link partilhado, sem sessão. */
export interface PublicRideDetail {
	id: string;
	routeName: string;
	scope: RideScope;
	departureAt: string;
	arrivalAt: string;
	seatsTotal: number;
	seatsTaken: number;
	pricePerSeat: number;
	status: RideStatus;
	progressIndex: number;
	stops: PublicRideStop[];
	/**
	 * O nome completo e o id, para ligar ao perfil público (`/pessoas/:id`).
	 * Sem telefone nem email — ver `getPublicRide` no backend.
	 */
	driver: {
		id: string;
		name: string;
		surname: string | null;
	} | null;
	/** Sem matrícula: o carro reconhece-se pela marca, modelo e cor. */
	vehicle: { make: string; model: string; color: string } | null;
	/** Pessoas já confirmadas, as mesmas que a app autenticada mostra. */
	passengers: RidePassenger[];
}

/**
 * `GET /api/people/:id` — perfil público de quem vai numa boleia.
 *
 * A projecção vem toda do backend: o cliente não esconde nada por si. Se o
 * backend um dia largar um campo, este tipo morre no `typecheck` antes de o
 * ecrã mostrar `undefined`.
 */
export interface PublicPerson {
	id: string;
	name: string;
	surname: string | null;
	bio: string | null;
	/** `createdAt` do utilizador, para "membro desde …". */
	joinedAt: string;
}

/* ---------- Reservas ---------- */

export type BookingStatus =
	| 'REQUESTED'
	| 'CONFIRMED'
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'REJECTED'
	| 'CANCELLED'
	| 'EXPIRED';

/**
 * Métodos de pagamento que o esquema aceita.
 *
 * A v1 só usa `CASH`. `WALLET` e `MULTICAIXA` existem na base de dados mas não
 * têm carteira nem integração, e oferecê-los na interface levaria alguém a um
 * pagamento que não termina. O valor aceito para o envio está em
 * `SUPPORTED_PAYMENT_METHODS`.
 */
export type PaymentMethod = 'WALLET' | 'CASH' | 'MULTICAIXA';

export const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = ['CASH'];

export interface Booking {
	id: string;
	rideId: string;
	passengerId: string;
	seats: number;
	/** Total a pagar na viatura: `seats × preço do lugar`. */
	amount: number;
	paymentMethod: PaymentMethod;
	pickStopIndex: number | null;
	dropStopIndex: number | null;
	status: BookingStatus;
	/** Motivo de recusa ou de cancelamento. */
	reason: string | null;
	createdAt: string;
	ride?: {
		id: string;
		routeName: string;
		scope: RideScope;
		departureAt: string;
		arrivalAt: string;
		status: RideStatus;
	};
	/**
	 * Só vem em `GET /api/rides/:id/bookings`, que é a lista do motorista.
	 * Sem o nome, a decisão de aceitar ou recusar um lugar é às cegas.
	 */
	passenger?: {
		id: string;
		name: string;
		/** Só no painel do motorista: é o número para combinar o embarque. */
		phone?: string | null;
	};
}

/* ---------- Notificações ---------- */

export type NotificationType =
	'RIDE' | 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';

export interface AppNotification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	data: Record<string, unknown> | null;
	read: boolean;
	readAt: string | null;
	createdAt: string;
}

/* ---------- Envelopes de listagem ---------- */

/**
 * Paginação dos controllers Nest: `{ rows, total, page, limit }`.
 *
 * Serve para `/api/rides/mine`, `/api/notifications` e `/api/admin/*`.
 */
export interface Paged<T> {
	rows: T[];
	total: number;
	page: number;
	limit: number;
}

/**
 * Listagem de notificações, que acrescenta o contador de não lidas.
 *
 * `unread` não está em `Paged` porque só o backend de notificações o devolve e
 * porque o total pode ser maior que as não lidas — são coisas diferentes e
 * misturá-las dava um badge com o número errado.
 */
export interface NotificationPage extends Paged<AppNotification> {
	unread: number;
}

/* ---------- Contacto de emergência ---------- */

export interface EmergencyContact {
	id: string;
	name: string;
	phone: string;
}

/* ---------- Upload de ficheiros ---------- */

export interface UploadSignature {
	uploadUrl: string;
	cloudName: string;
	apiKey: string;
	timestamp: number;
	signature: string;
	publicId: string;
	resourceType: string;
	/**
	 * `private`/`authenticated` quando o asset não é público. Vai **assinado**
	 * no formulário — o Cloudinary recusa um `type` que não esteja na
	 * assinatura. Ausente no upload público (é o valor por omissão).
	 */
	type?: 'upload' | 'private' | 'authenticated';
	transformation: string;
	eager: string;
	allowedFormats: string;
	maxBytes: number;
	/** Id do registo `media` que o backend criou e que o KYC vai referenciar. */
	mediaId: string;
}

/* ---------- Formatos de erro ---------- */

/**
 * Erro do backend, no formato por defeito do Nest.
 *
 * `{ statusCode, message, error }` e **nada mais**: não há erros por campo, o
 * `message` é sempre uma frase. Isto obriga a validar no cliente antes de
 * enviar, porque depois de enviar há uma única coisa para mostrar.
 */
export interface ApiErrorBody {
	statusCode: number;
	message: string;
	error?: string;
}
