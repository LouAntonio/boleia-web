# Boleia — site

A landing institucional e a app web da Boleia:(partilha de viagens em boleias
entre províncias de Angola).

Faz três coisas, e mantém-as separadas de propósito:

- **Institucional** — explica o produto a quem chega de um link no WhatsApp.
  Pública, sem conta, sem inventar números.
- **Conta** — entrada, registo e recuperação por telemóvel, com Google.
- **App web** — procurar boleias, reservar lugares, e o painel de quem conduz.

## Correr

```bash
npm install
cp .env.example .env      # aponta para http://localhost:3000
npm run dev               # http://localhost:5173
```

O backend tem de estar a correr (`cd ../back && npm run start:dev`), senão só a
landing aparece — e a secção "A partir de agora" desaparece em silêncio, que é o
comportamento pretendido em vez de um cartão de erro a meio da leitura.

## Comandos

| Comando                | O que faz                                         |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento na porta 5173         |
| `npm run build`        | `tsc -b` e depois o bundle de produção em `dist/` |
| `npm run preview`      | Serve o `dist/` já construído                     |
| `npm run lint:check`   | ESLint, sem corrigir                              |
| `npm run format:check` | Prettier, sem escrever                            |
| `npm run typecheck`    | `tsc -b`, sem emitir                              |
| `npm run cipipe`       | A cadeia toda, na mesma ordem que a CI            |

## Variáveis de ambiente

Só uma, e é pública:

```env
VITE_API_URL=http://localhost:3000
```

O Vite substitui-a no bundle em tempo de compilação. O `.env` não é versionado;
o `.env.example` é.

### A porta e o CORS

A porta 5173 é a **primeira entrada** do `CORS_ORIGIN` do backend, e o
`vite.config.ts` põe `strictPort: true` para o erro aparecer logo em vez de o
Vite escolher outra e o CORS começar a recusar em silêncio. A 5174 é o painel
`adm`.

Para mudar a porta, muda nos dois sítios ao mesmo tempo — `vite.config.ts` e o
`CORS_ORIGIN` do backend.

## Rotas

| Rota                                                                | Quem entra                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/`                                                                 | Pública — a landing                                           |
| `/entrar`, `/criar-conta`, `/verificar`, `/recuperar`, `/redefinir` | Pública, com redireccionamento para a app se já houver sessão |
| `/app/explorar`                                                     | Sessão                                                        |
| `/app/viagens/:id`                                                  | Sessão                                                        |
| `/app/reservas`                                                     | Sessão                                                        |
| `/app/painel`                                                       | Sessão — o painel do motorista                                |
| `/app/publicar`                                                     | Sessão                                                        |
| `/app/viaturas`, `/app/kyc`, `/app/notificacoes`, `/app/perfil`     | Sessão                                                        |

`*` responde 404 com o caminho de volta — nunca uma página em branco.

## Identidade visual

Os valores de cor **não são uma decisão deste sítio**. Vêm de
`mobile/src/store/colors.ts`, token por token, e estão em `src/index.css` com os
mesmos valores. A correspondência está escrita no topo do ficheiro. Se uma cor
mudar aqui, muda lá.

Duas regras que o projecto impõe e que este sítio cumpre:

- **`text` nunca sobre uma banda.** Sobre `--brand`, `--success` ou `--warn` usa
  sempre o token `--*-ink` correspondente. `--brand` com `--ink` por cima dá
  3.9:1 e falha o WCAG AA.
- **`--warn` (o `laterite` do telemóvel) é só fundo de aviso.** Nunca cor de
  texto, acento ou avatar.

### O elemento de assinatura

`src/components/marketing/RoadTrack.tsx`. Uma estrada que se desenha da origem ao
destino, com a hora em cada paragem. Já existia no splash do telemóvel; aqui foi
promovido a herói da landing e passou a ser o mesmo componente dentro dos cartões
de corrida.

A linha é SVG; os nós e as etiquetas são HTML por cima. Poderia ter sido tudo em
SVG, mas `preserveAspectRatio="none"` — que é o que permite desenhar numa
`viewBox` de 0 a 100 com um `width` em píxeis — distorce os círculos em elipses.

## As rotas públicas do backend

A landing chama duas rotas sem sessão:

- `GET /api/rides/public` — corridas agendadas com lugares livres, sem motorista
  nem viatura.
- `GET /api/locality/provinces` — as 21 províncias, com coordenadas.

A segunda é pública no backend; a primeira vive em `PublicRidesController`, à
parte do `RidesController`, porque aquele tem `@UseGuards(AuthGuard)` na classe.

## O que este sítio **não** mostra

Por decisão, e não por falta de tempo:

- **Números de utilizadores, de corridas, de ganhos.** Não há endpoint, e um
  número inventado numa landing institucional é uma mentira que alguém vai
  confirmar.
- **Testemunhos.** Não há de onde vir, e citações inventadas são a coisa mais
  fácil de apanhar e a mais cara.
- **Avaliações, perfis públicos, SOS.** Não existem no backend. A regra do
  projecto é a mesma que a do telemóvel: sem endpoint, não se inventa a
  interface.

O percurso da hero é o único número ilustrativo, e está rotulado como exemplo
logo abaixo.

## O `RoadTrack` e a lista de províncias

`src/lib/geo.ts` vem da seed do backend (`back/prisma/seed/angola-localities.json`),
**com os nomes corrigidos**. A seed passou pelo CP437, a codepage da consola do
Windows: um nome com acentos foi escrito em UTF-8 e lido como se fossem bytes de
uma tabela de desenho de caixas. `Bié` chegou a `Bi├®` e `Huíla` a `Hu├¡la`.

O ficheiro local já corrige. A seed e a base de dados do backend **não** —
enquanto isso, `/api/locality/provinces` continua a devolver os nomes
corrompidos, e o selector de destinos da app vai herdar o mesmo. O mesmo problema
afecta as 21 províncias e mais localidades nos `name`.

## Google

O botão aparece sempre. O `GOOGLE_CLIENT_ID` e o `GOOGLE_CLIENT_SECRET` estão no
backend, e sem eles o Google devolve um 404 a meio da navegação. Para funcionar
localmente, no Google Cloud Console:

- **URI de redireccionamento autorizado:**
  `http://localhost:5173/api/auth/callback/google`
- O domínio tem de estar em `CORS_ORIGIN` do backend.

## CI

`.github/workflows/ci.yml`: `npm ci` → `lint:check` → `format:check` →
`typecheck` → `build`, em Node 22, em cada `push` e `pull_request` para a `main`.
Sem testes — como o painel `adm`. O backend tem 302.

`npm run cipipe` é a mesma cadeia, localmente.

## Estrutura

```
src/
  components/
    ui/          Button, Card, Field, Select, Modal, SeatGrid, StatusStamp...
    marketing/   RoadTrack, Hero, HowItWorks, ProvincesMap, LiveRides, Trust
    rides/       RideCard
    layout/      AppShell, AuthShell, MarketingHeader/Footer, guards
    auth/        GoogleButton, GoogleIcon, ConsentRow, Divider
  hooks/         useAuth, useRides, useKyc, useLocalities, usePageTitle
  lib/           api, axios, auth, format, phone, geo, status, queryClient
  pages/
    auth/        SignIn, SignUp, Verify, ForgotPassword, ResetPassword
    app/         Explore, RideDetail, Bookings, DriverBoard, PublishRide,
                 Vehicles, Kyc, Notifications, Profile
  stores/        useAuthStore, useThemeStore
  types/         api.ts — o contrato com o backend
```

## Convenções

- **Tabs, 4 espaços, aspas simples, vírgula final** — o mesmo Prettier do
  `adm` e do `mobile`.
- **Comentários em português de Angola**, e justificam _porquê_, não _o quê_. Um
  comentário que repete o código é ruído.
- **Componentes exportados por nome** (`export function Button`), excepto em
  `pages/`, onde `export function XPage`.
- **Nunca `text-ink` sobre `--brand`.** Nem `--ink`, nem branco à mão.

## Acessibilidade

Foco visível em todo o elemento focável. Estados nunca só pela cor — o
`StatusStamp` tem sempre ponto **e** texto. `prefers-reduced-motion` respeitado: a
estrada aparece já desenhada. Modais fecham com `Escape` e com o clique no
fundo. Os campos de upload têm `label` e `aria-label`, e o botão que dispara o
`<input type="file">` é alcançável pelo teclado.
