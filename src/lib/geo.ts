/**
 * As 21 províncias de Angola.
 *
 * Não é uma lista escrita à mão: é a seed do backend
 * (`back/prisma/seed/angola-localities.json`) com a primeira entrada de cada
 * grupo — a sede da província. São os mesmos nomes e as mesmas coordenadas
 * que o backend devolve em `/api/locality/provinces`.
 *
 * Vive aqui, e não a vir da API, por uma razão prática: a landing page é
 * pública e não pode fazer pedidos a um endpoint protegido por sessão. Assim a
 * secção das províncias aparece sempre, mesmo sem servidor em execução, e o
 * site não fica com uma secção em branco à espera de um 401.
 *
 * ## De onde vêm estes nomes
 *
 * A lista saiu da seed do backend quando essa seed ainda estava em mojibake: o
 * texto foi escrito em UTF-8 e lido como CP850 — a codepage da consola do
 * Windows em português —, e "Bié" chegou aqui escrito como "Bi\u251C\u00AE".
 * Esta cópia foi corrigida à mão; a seed e a base de dados foram corrigidas
 * depois, e `GET /api/locality/provinces` devolve hoje os mesmos nomes.
 *
 * Se os nomes mudarem no backend, mudam aqui. O `typecheck` não apanha essa
 * diferença — só uma pessoa a confirmar.
 */
export interface GeoProvince {
	name: string;
	capital: string;
	lat: number;
	lng: number;
}

export const PROVINCES: GeoProvince[] = [
	{ name: 'Luanda', capital: 'Luanda', lat: -8.84, lng: 13.23 },
	{ name: 'Icolo e Bengo', capital: 'Catete', lat: -9.1, lng: 13.7 },
	{ name: 'Bengo', capital: 'Dande', lat: -8.58, lng: 13.66 },
	{ name: 'Benguela', capital: 'Benguela', lat: -12.58, lng: 13.4 },
	{ name: 'Bié', capital: 'Cuito', lat: -12.38, lng: 16.94 },
	{ name: 'Cabinda', capital: 'Cabinda', lat: -5.55, lng: 12.19 },
	{ name: 'Cuando', capital: 'Mavinga', lat: -15.79, lng: 20.36 },
	{ name: 'Cubango', capital: 'Menongue', lat: -14.66, lng: 17.69 },
	{ name: 'Cuanza Norte', capital: 'Cazengo', lat: -9.3, lng: 14.92 },
	{ name: 'Cuanza Sul', capital: 'Sumbe', lat: -11.2, lng: 13.84 },
	{ name: 'Cunene', capital: 'Cuanhama', lat: -17.07, lng: 15.73 },
	{ name: 'Huambo', capital: 'Huambo', lat: -12.77, lng: 15.74 },
	{ name: 'Huíla', capital: 'Lubango', lat: -14.92, lng: 13.49 },
	{ name: 'Lunda Norte', capital: 'Chitato', lat: -7.38, lng: 20.83 },
	{ name: 'Lunda Sul', capital: 'Saurimo', lat: -9.66, lng: 20.39 },
	{ name: 'Malanje', capital: 'Malanje', lat: -9.54, lng: 16.35 },
	{ name: 'Moxico', capital: 'Moxico', lat: -11.79, lng: 19.91 },
	{ name: 'Moxico Oriental', capital: 'Cazombo', lat: -11.9, lng: 22.86 },
	{ name: 'Namibe', capital: 'Moçâmedes', lat: -15.19, lng: 12.15 },
	{ name: 'Uíge', capital: 'Uíge', lat: -7.61, lng: 15.06 },
	{ name: 'Zaire', capital: "M'Banza Kongo", lat: -6.27, lng: 14.24 },
];

/** Opções para um `select` de províncias. */
export const PROVINCE_OPTIONS = PROVINCES.map((province) => ({
	value: province.name,
	label: province.name,
}));
