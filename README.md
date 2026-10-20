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

**Institucionais.** Todas públicas, todas com `<title>` e meta description
próprias, e todas dentro do `MarketingLayout` — o header, o rodapé e a troca de
tema são os mesmos da landing.

| Rota           | O que é                                                         |
| -------------- | --------------------------------------------------------------- |
| `/`            | A landing                                                       |
| `/sobre`       | O problema, a missão, e o que a Boleia **não** é                |
| `/motoristas`  | Conversão: como se publica, quanto se ganha, quanto se fica     |
| `/seguranca`   | Como se verifica identidade e viaturas, e quem vê o quê         |
| `/perguntas`   | 27 perguntas, agrupadas por quem as tem                         |
| `/contacto`    | Email e formulário `mailto:`, mais os caminhos para dados e APD |
| `/privacidade` | Política de privacidade, segundo a Lei nº 22/11                 |
| `/termos`      | Termos e condições                                              |

**Autenticação.** Públicas, com redireccionamento para a app se já houver
sessão: `/entrar`, `/criar-conta`, `/verificar`, `/recuperar`, `/redefinir`.

**App.** Exigem sessão: `/app/explorar`, `/app/viagens/:id`, `/app/reservas`,
`/app/painel`, `/app/publicar`, `/app/viaturas`, `/app/kyc`,
`/app/notificacoes`, `/app/perfil`.

`*` responde 404 com o caminho de volta — nunca uma página em branco.

## O que falta nos documentos legais

`/privacidade` e `/termos` estão escritas, mas **não fechadas**. O que depende
de decisões que não são do código aparece a amarelo com `[a preencher]` e a
página avisa no topo que é um rascunho. A lista completa:

| Onde       | Falta                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------- |
| Ambos      | Razão social, NIF e morada do responsável pelo tratamento                                     |
| Contacto   | Horas de resposta do suporte                                                                  |
| Motoristas | Dias até rever um KYC                                                                         |
| Perguntas  | Horas de resposta, política de reembolso                                                      |
| Termos     | Foro competente, limite de responsabilidade, prazo de obrigação legal de conservar documentos |

Dois documentos destes precisam de **revisão jurídica** antes de valerem
alguma coisa. A Lei nº 22/11 está ela própria em revisão — há um projecto em
consulta pública desde Março de 2025 —, o que torna o texto volátil.

### O que a política de privacidade diz e pode ser verificado

Quase tudo. A lista de dados saiu do `schema.prisma`, os prazos das variáveis
que o backend lê. E três coisas estão escritas com o mesmo peso do resto, que
são as que convém saberes:

1. **A eliminação de conta não anonimiza nada.** `requestDeletion` marca a
   conta, baneia, revoga as sessões e apaga as notificações. O worker de
   retenção que anonimizaria o resto não existe: `DATA_RETENTION_*` está no
   `.env.example` e não é lido em `src/`.
2. **Não há exportação de dados.** A lei prevê a portabilidade; o sistema não
   a implementa.
3. **Há transferência internacional.** As fotografias vão para o Cloudinary e
   os OTP saem pelo WhatsApp. Nenhum dos dois está em Angola, e isso obriga a
   comunicação à APD.

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

## As províncias e os municípios são locais

`src/lib/locations.ts` é **gerado**, não escrito à mão: `back/scripts/generate-locations.ts`
lê a seed do backend (`back/prisma/seed/angola-localities.json`) e escreve o mesmo
ficheiro aqui e no telemóvel. As 21 províncias e os 306 municípios são constantes
do bloco inicial; não há um pedido para preencher um filtro.

Cada província e cada município tem um **código estável**, e é esse o
identificador que a interface usa:

- província → slug do nome (`luanda`, `cuanza-norte`, `moxico-oriental`);
- município → `provincia.municipio` (`bie.catabola`, `huambo.catabola`).

O prefixo do município não é decoração. Há três nomes repetidos no país —
`Catabola` no Bié e no Huambo, `Canacassala` no Bengo e no Uíge, `Quizenga` no
Cuanza Norte e em Malanje — e um código só com o nome colidiria. A API aceita o
código em todos os parâmetros de localidade (`origin`, `destination`,
`originProvinceId`, `destinationProvinceId`, `stops[].localityId`) e continua a
aceitar o UUID antigo, por isso os links já partilhados não morrem.

A seed tinha passado pelo CP850, a codepage da consola do Windows em português:
um nome com acentos foi escrito em UTF-8 e lido como se fossem bytes de uma
tabela de desenho de caixas — `Bié` chegou a `Bi├®`. Já foi corrigida (o JSON está
em UTF-8 e há um script de reparação em `back/scripts/repair-locality-encoding.ts`),
e o `seed.ts` aborta se voltar a encontrar mojibake.

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
    layout/
      legal/     PageHeader, Prose, LegalDoc (Todo, DocIndex, DraftNotice), FaqList
      AppShell, AuthShell, MarketingHeader/Footer, guards, Lazy, lazyPage
    auth/        GoogleButton, GoogleIcon, ConsentRow, Divider
  hooks/         useAuth, useRides, useKyc, usePageMeta
  lib/           api, axios, auth, format, locations, phone, status, queryClient
  pages/
    institutional/ About, Driver, Security, Faq, Contact, Privacy, Terms
    auth/        SignIn, SignUp, Verify, ForgotPassword, ResetPassword
    app/         Explore, RideDetail, Bookings, DriverBoard, PublishRide,
                 Vehicles, Kyc, Notifications, Profile
  stores/        useAuthStore, useThemeStore
  types/         api.ts — o contrato com o backend
```

## As páginas institucionais são blocos separados

Cada uma é um `lazy` por rota (`components/layout/lazyPage.ts`). Sem isso, as
sete no mesmo ficheiro levavam o bloco inicial a 552 KB e o Vite a avisar que
passava dos 500 KB. Com, o bloco inicial desce para 441 KB e cada página
institucional pesa entre 2 e 5 KB gzip.

O `Suspense` está **acima** do `<Routes>`, e não dentro de cada rota: com ele
dentro, cada navegação apareceria e desapareceria.

O helper vive fora de `Lazy.tsx` porque aquele ficheiro exporta componentes e o
`react-refresh` só funciona quando um ficheiro exporta uma coisa só.

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
