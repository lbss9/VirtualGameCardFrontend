# Especificação da API do backend

> Contrato entre o **VirtualGameCardFrontend** e o backend **VirtualGameCard**.

Este documento é a fonte de verdade para as rotas, DTOs, validações e erros esperados pelo frontend. Ele diferencia o que a aplicação **já consome**, o que ainda está **mockado** e o que é **necessário para produção**.

## 1. Resumo de implementação

### Obrigatórias — o frontend já consome

| Status | Método | Rota | Autenticação | Função |
|---|---|---|---|---|
| ✅ | `POST` | `/api/auth/register` | Não | Criar conta |
| ✅ | `POST` | `/api/auth/login` | Não | Entrar |
| ✅ | `POST` | `/api/auth/forgot-password` | Não | Solicitar recuperação |
| ✅ | `POST` | `/api/auth/reset-password` | Não | Redefinir senha por token |
| ✅ | `GET` | `/api/me` | Sim | Obter perfil autenticado |
| ✅ | `POST` | `/api/me/password` | Sim | Alterar senha autenticado |
| ✅ | `POST` | `/api/me/email-verification` | Sim | Reenviar confirmação de e-mail |
| ✅ | `POST` | `/api/cards/purchase` | Sim | Criar pedido de gift card |
| ✅ | `GET` | `/api/purchases` | Sim | Listar compras paginadas |
| ✅ | `GET` | `/api/purchases/{id}` | Sim | Obter pedido e código quando aprovado |
| ✅ | `POST` | `/api/support/tickets` | Sim | Abrir chamado |

### Necessárias para substituir funcionalidades locais

| Status | Método | Rota | Autenticação | Função |
|---|---|---|---|---|
| ✅ | `GET` | `/api/notifications` | Sim | Listar notificações |
| ✅ | `PATCH` | `/api/notifications/{id}/read` | Sim | Marcar uma como lida |
| ✅ | `POST` | `/api/notifications/read-all` | Sim | Marcar todas como lidas |

### Necessárias para completar autenticação em produção

Estas rotas exigirão uma pequena integração posterior no frontend.

| Status | Método | Rota | Autenticação | Função |
|---|---|---|---|---|
| ✅ | `POST` | `/api/auth/verify-email` | Não | Confirmar e-mail por token |
| ✅ | `POST` | `/api/auth/refresh` | Cookie/refresh token | Renovar sessão |
| ✅ | `POST` | `/api/auth/logout` | Sim | Invalidar sessão atual |
| ✅ | `POST` | `/api/payments/webhooks` | HMAC | Confirmar pagamento pelo provedor |

---

## 2. Convenções globais

### URL base

```text
Desenvolvimento: http://localhost:8090
Prefixo:         /api
```

Configurada no frontend por:

```env
VITE_API_URL=http://localhost:8090
VITE_USE_MOCKS=false
```

### Formato

- Request e response: `application/json; charset=utf-8`.
- Datas: ISO 8601 em UTC, terminadas em `Z`.
- IDs: UUID em string.
- Valores monetários: número inteiro em reais neste produto (`5`, `10`, `250`).
- Enumerações: strings minúsculas conforme os unions deste documento.
- Campos desconhecidos podem ser ignorados pelo frontend.
- Campos obrigatórios não podem ser omitidos nem retornar `null`, salvo quando indicado.

### Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <access-token>
```

O header `Authorization` é exigido somente nas rotas marcadas como autenticadas.

### CORS em desenvolvimento

Permitir ao menos:

```text
http://localhost:5174
http://127.0.0.1:5174
```

Métodos: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`.

Headers: `Authorization`, `Content-Type`, `Accept`.

### Envelope obrigatório

Toda resposta JSON, em sucesso ou erro, usa o mesmo envelope:

```ts
interface ApiResponse<T> {
  message: string;
  code: string;
  path: string;
  statusCode: number;
  data: T | null;
}
```

Sucesso:

```json
{
  "message": "Login realizado com sucesso.",
  "code": "LOGIN_SUCCESS",
  "path": "/api/auth/login",
  "statusCode": 200,
  "data": {
    "token": "jwt",
    "userId": "8eb248ef-083e-4d85-9f48-7fa65b267d81"
  }
}
```

Erro:

```json
{
  "message": "A senha atual está incorreta.",
  "code": "CURRENT_PASSWORD_INVALID",
  "path": "/api/me/password",
  "statusCode": 400,
  "data": null
}
```

Os exemplos de response nas seções seguintes representam o conteúdo de `data`.

Nunca retornar stack trace, SQL, nomes internos de classes ou detalhes do gateway ao usuário.

### Status HTTP

| Status | Uso |
|---|---|
| `200` | Consulta ou operação concluída |
| `201` | Recurso criado |
| `204` | Operação concluída sem body |
| `400` | Payload ou regra de negócio inválida |
| `401` | Ausente, inválido ou expirado |
| `403` | Usuário autenticado sem permissão |
| `404` | Recurso inexistente ou pertencente a outro usuário |
| `409` | Conflito de estado ou duplicidade |
| `422` | Validação semântica, caso adotado pelo backend |
| `429` | Limite de requisições atingido |
| `500` | Falha interna genérica |

Ao receber `401` em rota protegida, o frontend limpa a sessão e redireciona para `/`.

---

## 3. Interfaces compartilhadas

Estas são as interfaces que as respostas do backend precisam satisfazer.

```ts
type PlatformId =
  | "steam"
  | "playstation"
  | "xbox"
  | "nintendo"
  | "google-play"
  | "roblox";

type PaymentMethod = "pix" | "card";
type SupportCategory = "code" | "payment" | "account" | "other";
type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
type NotificationKind = "purchase" | "security" | "news" | "support";

interface MessageResponse {
  message: string;
}

interface AuthResponse {
  token: string;
  userId: string;
}

interface ForgotPasswordResponse {
  message: string;
  resetToken: string | null;
  expiresAt: string | null;
}

interface MeResponse {
  userId: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Purchase {
  id: string;
  amount: number;
  platform: PlatformId;
  paymentMethod: PaymentMethod;
  status: "pending" | "approved" | "failed" | "canceled";
  createdAt: string;
}

interface PurchaseDetail extends Purchase {
  code: string | null;
  paymentReference: string;
}

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SupportTicketResponse {
  id: string;
  status: SupportTicketStatus;
  createdAt: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
}
```

---

## 4. Autenticação

### Regras de senha

A mesma política deve ser aplicada em cadastro, redefinição e alteração:

- mínimo de 8 caracteres;
- ao menos uma letra maiúscula;
- ao menos uma letra minúscula;
- ao menos um número;
- ao menos um caractere especial;
- limite máximo recomendado: 128 caracteres;
- a nova senha não pode ser igual à atual.

O backend deve armazenar apenas hash forte com salt usando uma implementação adequada, como Argon2id, scrypt ou configuração segura do Identity/PBKDF2.

### `POST /api/auth/register`

Cria uma conta e envia a confirmação de e-mail.

Request:

```ts
interface RegisterRequest {
  email: string;
  password: string;
}
```

```json
{
  "email": "jogador@email.com",
  "password": "Senha@123"
}
```

Response `201`:

```json
{
  "token": "jwt",
  "userId": "8eb248ef-083e-4d85-9f48-7fa65b267d81"
}
```

Erros:

- `400 VALIDATION_ERROR`
- `409 EMAIL_ALREADY_REGISTERED`
- `429 REGISTER_RATE_LIMITED`

Normalizar o e-mail antes de verificar duplicidade. A mensagem pública pode evitar confirmar a existência da conta quando necessário.

### `POST /api/auth/login`

Request:

```ts
interface LoginRequest {
  email: string;
  password: string;
}
```

Response `200`: `AuthResponse`.

O access token atual precisa conter `sub`, `email`, `iat` e `exp`. A claim exibida no frontend não substitui uma consulta segura ao usuário no backend.

Erros:

- `401 INVALID_CREDENTIALS`
- `403 ACCOUNT_DISABLED`
- `429 LOGIN_RATE_LIMITED`

Use a mesma mensagem para e-mail inexistente e senha incorreta.

### `POST /api/auth/forgot-password`

Request:

```ts
interface ForgotPasswordRequest {
  email: string;
}
```

Response `200` sempre, exista ou não a conta:

```json
{
  "message": "Se o e-mail existir, enviamos instruções para redefinir a senha.",
  "resetToken": null,
  "expiresAt": null
}
```

Somente em ambiente de desenvolvimento, `resetToken` e `expiresAt` podem ser retornados para permitir testes sem provedor de e-mail.

Erros:

- `429 PASSWORD_RESET_RATE_LIMITED`

### `POST /api/auth/reset-password`

Request:

```ts
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

Response `200`:

```json
{ "message": "Senha redefinida com sucesso. Você já pode entrar." }
```

O token deve ser de uso único, armazenado como hash e possuir expiração curta.

Erros:

- `400 RESET_TOKEN_INVALID`
- `400 RESET_TOKEN_EXPIRED`
- `400 PASSWORD_POLICY_FAILED`
- `400 PASSWORD_REUSE`

Após sucesso, invalidar outras sessões e tokens de recuperação pendentes.

### `POST /api/auth/verify-email` — integração seguinte

Request:

```ts
interface VerifyEmailRequest {
  token: string;
}
```

Response `200`:

```json
{ "message": "E-mail confirmado com sucesso." }
```

Erros: `400 VERIFICATION_TOKEN_INVALID`, `400 VERIFICATION_TOKEN_EXPIRED`, `409 EMAIL_ALREADY_VERIFIED`.

### `POST /api/auth/refresh` — produção

Renova o access token usando refresh token rotativo, preferencialmente em cookie `HttpOnly; Secure; SameSite`.

Response `200`: `AuthResponse`, ou somente o novo access token conforme a estratégia final.

Erros: `401 REFRESH_TOKEN_INVALID`, `401 REFRESH_TOKEN_EXPIRED`, `401 SESSION_REVOKED`.

### `POST /api/auth/logout` — produção

Invalida a sessão/refresh token atual e limpa o cookie no backend.

Response `204`, sem body.

---

## 5. Perfil

### `GET /api/me`

Response `200`:

```json
{
  "userId": "8eb248ef-083e-4d85-9f48-7fa65b267d81",
  "email": "jogador@email.com",
  "emailVerified": true,
  "createdAt": "2026-01-12T14:30:00Z"
}
```

Erros: `401 UNAUTHORIZED`, `404 USER_NOT_FOUND`.

### `POST /api/me/password`

Request:

```ts
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

Response `200`:

```json
{ "message": "Senha alterada com sucesso." }
```

Erros:

- `400 CURRENT_PASSWORD_INVALID`
- `400 PASSWORD_POLICY_FAILED`
- `400 PASSWORD_REUSE`
- `429 PASSWORD_CHANGE_RATE_LIMITED`

Após sucesso, invalidar as outras sessões ativas. O produto pode optar por manter a sessão atual.

### `POST /api/me/email-verification`

Sem body. Envia um novo link somente quando `emailVerified` for `false`.

Response `200`:

```json
{ "message": "Enviamos um novo link de confirmação para o seu e-mail." }
```

Erros:

- `409 EMAIL_ALREADY_VERIFIED`
- `429 VERIFICATION_RATE_LIMITED`

---

## 6. Plataformas e valores

### Plataformas aceitas

| ID estável | Nome exibido |
|---|---|
| `steam` | Steam |
| `playstation` | PlayStation Store |
| `xbox` | Xbox |
| `nintendo` | Nintendo eShop |
| `google-play` | Google Play |
| `roblox` | Roblox |

### Regras do valor

- mínimo: `5`;
- máximo: `250`;
- incremento: `5`;
- deve ser inteiro;
- o backend deve validar o valor independentemente do frontend.

---

## 7. Compra de gift card

### `POST /api/cards/purchase`

Header obrigatório e reutilizável somente para a mesma intenção:

```http
Idempotency-Key: <UUID ou chave única de até 100 caracteres>
```

Request:

```ts
interface PurchaseCardRequest {
  amount: number;
  platform: PlatformId;
  paymentMethod: PaymentMethod;
}
```

```json
{
  "amount": 50,
  "platform": "steam",
  "paymentMethod": "pix"
}
```

Response `201`: pedido pendente. O backend ainda não emite o código.

```json
{
  "id": "10000000-0000-4000-8000-000000000001",
  "amount": 50,
  "platform": "steam",
  "paymentMethod": "pix",
  "status": "pending",
  "code": null,
  "paymentReference": "pay_7G4Q20P9",
  "createdAt": "2026-07-06T13:30:00Z"
}
```

Erros:

- `400 INVALID_AMOUNT`
- `400 INVALID_PLATFORM`
- `400 INVALID_PAYMENT_METHOD`
- `402 PAYMENT_FAILED`
- `409 PURCHASE_ALREADY_PROCESSED`
- `409 IDEMPOTENCY_KEY_REUSED`
- `422 CARD_STOCK_UNAVAILABLE`
- `429 PURCHASE_RATE_LIMITED`

Regras críticas:

1. Nunca confiar em preço ou aprovação enviados pelo navegador.
2. Criar o código somente após webhook de pagamento aprovado e assinado.
3. Garantir unicidade do código.
4. Vincular a compra ao `sub` do usuário autenticado.
5. Não registrar código completo, dados do cartão ou payload PIX em logs.
6. Usar idempotência no processamento real para impedir compras duplicadas.

O checkout cria um pedido pendente. O provedor confirma de forma assíncrona pelo webhook HMAC; somente então a transação muda para `approved`, recebe código e gera notificação.

### `POST /api/payments/webhooks`

Rota exclusiva do provedor. A assinatura hexadecimal é um HMAC-SHA256 de
`eventId.paymentReference.status` usando um segredo disponível somente no ambiente do servidor.

```http
X-Payment-Signature: <hmac hexadecimal>
```

```json
{
  "eventId": "evt_123",
  "paymentReference": "pay_7G4Q20P9",
  "status": "approved"
}
```

Eventos são idempotentes; a transição de `pending` acontece no máximo uma vez.

---

## 8. Histórico de compras

### `GET /api/purchases?page=1&pageSize=20`

Query:

```ts
interface PurchasesQuery {
  page: number;                 // mínimo 1
  pageSize: 20 | 50 | 100;
}
```

Response `200`: `PagedResult<Purchase>`.

```json
{
  "items": [
    {
      "id": "10000000-0000-4000-8000-000000000001",
      "amount": 50,
      "platform": "steam",
      "paymentMethod": "pix",
      "createdAt": "2026-07-06T13:30:00Z"
    }
  ],
  "total": 43,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

Regras:

- ordenar por `createdAt DESC`;
- nunca retornar `code` na listagem;
- retornar somente compras do usuário autenticado;
- `items` deve ser `[]` quando não houver dados;
- `totalPages` deve ser no mínimo `1`, conforme a expectativa atual do frontend.

Erros: `400 INVALID_PAGE`, `400 INVALID_PAGE_SIZE`, `401 UNAUTHORIZED`.

### `GET /api/purchases/{id}`

Response `200`: `PurchaseDetail`.

Retorna o código somente porque o usuário abriu explicitamente o detalhe.

Erros:

- `400 INVALID_PURCHASE_ID`
- `404 PURCHASE_NOT_FOUND`

Uma compra de outro usuário também deve retornar `404`, evitando enumerar recursos existentes.

---

## 9. Ajuda e suporte

### `POST /api/support/tickets`

Request:

```ts
interface SupportTicketRequest {
  subject: string;
  category: SupportCategory;
  message: string;
}
```

```json
{
  "subject": "Código não foi aceito",
  "category": "code",
  "message": "Tentei resgatar na plataforma correta e recebi uma mensagem de erro."
}
```

Response `201`:

```json
{
  "id": "2d247df4-19ec-49b2-8c40-e7b58d3273ae",
  "status": "open",
  "createdAt": "2026-07-06T14:30:00Z"
}
```

Validações:

- `subject`: 4 a 120 caracteres;
- `message`: 10 a 4.000 caracteres;
- `category`: `code`, `payment`, `account` ou `other`;
- conteúdo tratado como texto, nunca HTML confiável.

Erros: `400 VALIDATION_ERROR`, `429 SUPPORT_RATE_LIMITED`.

---

## 10. Notificações

Hoje as notificações ficam no navegador. Estas rotas substituem esse armazenamento local.

### `GET /api/notifications`

Retorna no máximo as 30 notificações mais recentes, ordenadas por `createdAt DESC`.

Response `200`:

```ts
interface NotificationsResponse {
  items: AppNotification[];
  unreadCount: number;
}
```

```json
{
  "items": [
    {
      "id": "60a94644-cbb0-47e1-a46d-3f53507ec97d",
      "title": "Seu card está pronto!",
      "message": "Seu Steam Card de R$ 50 está disponível.",
      "kind": "purchase",
      "createdAt": "2026-07-06T14:30:00Z",
      "read": false
    }
  ],
  "unreadCount": 1
}
```

### `PATCH /api/notifications/{id}/read`

Sem body. Response `204`.

Erros: `404 NOTIFICATION_NOT_FOUND`.

### `POST /api/notifications/read-all`

Sem body. Response `204`.

Deve alterar somente notificações do usuário autenticado.

---

## 11. Eventos que devem criar notificações

| Evento | `kind` | Exemplo de título |
|---|---|---|
| Cadastro concluído | `news` | Boas-vindas à VirtualGameCard! |
| Compra aprovada | `purchase` | Seu card está pronto! |
| Senha alterada | `security` | Senha alterada |
| Chamado criado/atualizado | `support` | Chamado recebido |

---

## 12. Segurança e desempenho esperados

### Segurança

- Validar autorização por usuário em toda consulta por ID.
- Aplicar rate limiting em autenticação, e-mail, compra e suporte.
- Não armazenar tokens de recuperação ou confirmação em texto puro.
- Não armazenar senha reversível.
- Não aceitar valores, status de pagamento ou códigos vindos do frontend.
- Usar HTTPS em produção.
- Preferir cookies `HttpOnly`, `Secure` e `SameSite` para refresh/session token.
- Proteger fluxos baseados em cookie contra CSRF.
- Redigir dados sensíveis em logs e ferramentas de observabilidade.
- Invalidar sessões após eventos de segurança relevantes.

### Desempenho

- Paginar no banco, nunca carregar tudo para recortar em memória.
- Indexar compras por `(user_id, created_at)`.
- Indexar notificações por `(user_id, created_at, read)`.
- Evitar N+1 nas consultas.
- Usar cancelamento/timeouts nas integrações externas.
- Processar webhooks e e-mails de modo idempotente.
- Comprimir respostas HTTP quando adequado.

---

## 13. Checklist do backend

### Fundação

- [x] Configurar CORS para o frontend com credenciais.
- [x] Implementar middleware global de `ApiError`.
- [x] Configurar autenticação, sessões revogáveis e autorização.
- [x] Configurar rate limiting.
- [x] Criar migrations e índices.

### Autenticação

- [x] Cadastro.
- [x] Login.
- [x] Recuperação de senha.
- [x] Redefinição de senha.
- [x] Confirmação e reenvio de e-mail.
- [x] Alteração autenticada de senha.
- [x] Refresh rotativo e logout com revogação.

### Produto

- [x] Pedido de gift card pendente.
- [x] Idempotência da compra.
- [x] Webhook HMAC e emissão após aprovação.
- [x] Histórico paginado sem código.
- [x] Detalhe protegido com código somente após aprovação.

### Experiência

- [x] Abertura de chamados.
- [x] Persistência de notificações.
- [x] Marcação individual e em massa.

### Qualidade

- [x] Testes de integração para todas as rotas.
- [x] Testes de isolamento entre usuários.
- [x] Testes de paginação e validação.
- [x] Testes de expiração e uso único de tokens.
- [x] Testes de rollback e rotação concorrente.
- [x] OpenAPI validado com todas as rotas públicas.

---

## 14. Mapeamento das telas para endpoints

| Tela do frontend | Endpoints usados |
|---|---|
| Login/cadastro | `register`, `login` |
| Esqueci minha senha | `forgot-password` |
| Nova senha | `reset-password` |
| Painel/checkout | `cards/purchase` |
| Minhas compras | `GET purchases`, `GET purchases/{id}` |
| Meu perfil | `GET me`, `me/password`, `me/email-verification`, `GET purchases` |
| Ajuda e suporte | `support/tickets` |
| Central de notificações | três rotas de `notifications` quando integradas |

---

## 15. Ativação da API real no frontend

Depois de implementar as rotas obrigatórias:

```env
VITE_API_URL=http://localhost:8090
VITE_USE_MOCKS=false
```

Em seguida, validar:

1. cadastro e login;
2. expiração/`401`;
3. recuperação de senha;
4. perfil e confirmação de e-mail;
5. compra PIX e cartão;
6. paginação 20/50/100;
7. isolamento de compras entre usuários;
8. suporte;
9. mensagens de erro padronizadas.

Enquanto `VITE_USE_MOCKS=true`, o frontend usa dados locais e nenhuma chamada deste documento é enviada ao backend.

---

## 16. Referência rápida de DTOs C#

Os tipos abaixo são uma referência de serialização. Eles podem ser separados por feature/camada conforme a arquitetura do backend.

```csharp
public sealed record RegisterRequest(string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, Guid UserId);

public sealed record ForgotPasswordRequest(string Email);
public sealed record ForgotPasswordResponse(
    string Message,
    string? ResetToken,
    DateTimeOffset? ExpiresAt);

public sealed record ResetPasswordRequest(string Token, string NewPassword);
public sealed record VerifyEmailRequest(string Token);
public sealed record MessageResponse(string Message);

public sealed record MeResponse(
    Guid UserId,
    string Email,
    bool EmailVerified,
    DateTimeOffset CreatedAt);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);

public sealed record PurchaseCardRequest(
    int Amount,
    string Platform,
    string PaymentMethod);

public record PurchaseResponse(
    Guid Id,
    int Amount,
    string Platform,
    string PaymentMethod,
    DateTimeOffset CreatedAt);

public sealed record PurchaseDetailResponse(
    Guid Id,
    int Amount,
    string Platform,
    string PaymentMethod,
    string Code,
    DateTimeOffset CreatedAt);

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

public sealed record SupportTicketRequest(
    string Subject,
    string Category,
    string Message);

public sealed record SupportTicketResponse(
    Guid Id,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record NotificationResponse(
    Guid Id,
    string Title,
    string Message,
    string Kind,
    DateTimeOffset CreatedAt,
    bool Read);

public sealed record NotificationsResponse(
    IReadOnlyList<NotificationResponse> Items,
    int UnreadCount);

public sealed record ApiErrorResponse(
    string Message,
    string Code,
    int StatusCode,
    string Path,
    IReadOnlyDictionary<string, string[]>? FieldErrors = null,
    string? TraceId = null);
```

Configure o serializador JSON para `camelCase`, produzindo exatamente `userId`, `createdAt`, `emailVerified`, `pageSize` e os demais nomes usados pelo frontend.
