# Torcida Veste — Storefront Completo (Design)

Data: 2026-10-14
Status: aprovado em brainstorming, aguardando revisão do usuário

## Objetivo

Concluir o Torcida Veste como projeto de portfólio: loja de artigos esportivos com front-end em Next.js + shadcn/ui, integrado ao backend NestJS existente, com pagamento via Stripe em modo sandbox. Não é um produto a ser monetizado.

Fonte visual: `Torcida Veste/desktop/*.png` e `Torcida Veste/mobile/*.png` (home, ofertas, produtos, produto + carrinho, pedidos), mais `Torcida Veste/images` e `Torcida Veste/icon`.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Ofertas | Campo opcional `originalPrice` em `Product`; desconto % calculado |
| Pagamento | Stripe Checkout hospedado (sandbox) + webhook; usa `Order.payment_url` |
| Carrinho | localStorage; login exigido apenas ao finalizar compra |
| Login | E-mail/senha + Google OAuth |
| Backend | Mantém NestJS, hospedado na Vercel |
| Banco | Postgres (Neon via Vercel Marketplace); Prisma `mysql` → `postgresql` |
| Deploy | Dois projetos Vercel no mesmo repositório (Root Directory distinto) |

## 1. Arquitetura

```
torcida-veste/
├── torcida-veste-api/   → Vercel project #1 (NestJS)
├── torcida-veste-app/   → Vercel project #2 (Next.js + shadcn), recriado do zero
└── Torcida Veste/       → material de design
```

- Front chama a API via `NEXT_PUBLIC_API_URL`; browser nunca recebe o token em JS (ver seção 3).
- Docker Compose de desenvolvimento passa a subir Postgres em vez de MySQL.
- Segredos (Stripe, Google, JWT, DB) só em variáveis de ambiente; `.env.example` documentado em cada projeto.
- Contas externas criadas pelo usuário: Stripe (modo teste), Google Cloud OAuth client, Neon/Vercel. Claude não cria contas nem recebe chaves de produção.

## 2. Backend (`torcida-veste-api`)

### 2.1 Correções obrigatórias (pré-requisito)

- **Role hardcoded:** `AuthService.generateToken` e `generateRefreshToken` emitem `role: 'ADMIN'` para todo usuário. Passa a usar `user.role`; cadastro cria com `role = USER`. Sem isso, abrir endpoints públicos e permitir cadastro concede admin a qualquer um.
- **Google login sem token:** `googleLogin` só devolve o usuário do provider. Passa a: localizar ou criar o `User` pelo e-mail, emitir `token` + `refresh_token` e redirecionar o browser para `${FRONTEND_URL}/auth/google/callback?code=<one-time-code>`; o front troca o código por tokens via `POST /auth/google/exchange`. Tokens nunca vão na URL. O código é de uso único e expira em ~60s (armazenado na tabela de sessão ou em tabela própria de `AuthCode`).
- **`@Roles` não é aplicado:** não existe nenhum guard que leia a metadata de `@Roles('ADMIN')`; hoje qualquer usuário logado cria/apaga produto, categoria, liga e cupom. Cria-se um `RolesGuard` e ele é aplicado nas rotas de escrita. `GET` de categoria e liga passam a ser públicos (o front precisa deles para filtros).
- **`/user` sem controle de acesso:** qualquer logado lista, edita e apaga qualquer usuário, e o `PATCH` aceita `role` e `password` em texto puro. Passa a: listar só ADMIN; ver/editar/apagar só o próprio usuário ou ADMIN; edição por DTO restrita (sem `role`, `email`, `password`).
- **Cadastro:** não existe endpoint. Cria-se `POST /auth/register` (role sempre `USER`, senha com bcrypt, campos extras rejeitados).
- Login de conta Google (senha nula) quebra em `bcrypt.compare`; `validateUser` passa a retornar `null` nesse caso. (A ordem dos argumentos de `compare` está correta.)
- Fora de escopo, apenas registrado: `GET /address` lista endereços de qualquer usuário (o modelo não tem dono); use-cases de update/delete de produto não dão `await`; repositórios engolem erros.

### 2.2 Produto

- `Product.originalPrice Float?`. Regra: oferta quando `originalPrice > price`; `discountPercent = round((1 - price/originalPrice) * 100)`, calculado na resposta da API.
- `GET /product`, `/product/:id`, `/product/category/:id`, `/product/league/:id` passam a ser **públicos**. `POST/PATCH/DELETE` continuam ADMIN.
- `GET /product` aceita `?search=`, `?onSale=true`, `?categoryId=`, `?leagueId=` e paginação existente.
- Respostas incluem `Images` (com a capa) e `Category`/`League`.

### 2.3 Pedidos (módulo novo — `src/order/` hoje está vazio)

Schema (migração):
- `Order`: adicionar `subtotal`, `shipping`, `discount`, `total` (Float); `person_id` vira relação com `User`; `coupon_id` opcional; `payment_id` e `payment_url` opcionais até a sessão Stripe existir; `created_at`/`updated_at` como `DateTime`.
- `ORDER_STATUS`: adicionar `PENDING_PAYMENT` e `PAID`. Fluxo: `PENDING_PAYMENT` → `PAID` (webhook) → `PROCESSING` → `SENT` → `CONCLUDED`; `CANCELED` se a sessão expirar.
- `OrderItem`: guardar `unit_price` no momento da compra.

Endpoints:
- `POST /orders` (JWT): body `{ items: [{ productId, quantity }], couponCode? }`. O backend **recalcula tudo** a partir do banco (nunca confia em preço do front): valida estoque (`IN_STOCK`), aplica cupom (validade, `PERCENTAGE`/`VALUE`), calcula frete, cria `Order` + `OrderItem`s e uma Stripe Checkout Session (preços em centavos, `BRL`, `success_url`/`cancel_url` do front, `metadata.orderId`). Retorna `{ orderId, payment_url }`.
- `GET /orders` e `GET /orders/:id` (JWT): somente pedidos do usuário autenticado; outro usuário recebe 404.
- `POST /payments/webhook` (público): corpo cru + verificação de assinatura `STRIPE_WEBHOOK_SECRET`. `checkout.session.completed` → `PAID`; `checkout.session.expired` → `CANCELED`. Idempotente (reprocessar o mesmo evento não altera o resultado).
- `GET /coupon/:code` hoje é ADMIN; criar `POST /coupon/validate` público/JWT que retorna só o necessário (tipo, valor) para o carrinho exibir o desconto.

Frete: constante configurável (R$ 5,00; grátis acima de um limite definido em env). Regra isolada em uma função pura para teste.

### 2.4 Infra

- CORS restrito a `FRONTEND_URL`.
- `main.ts` adaptado ao entrypoint detectado pela Vercel (conforme docs do framework NestJS) e `app.listen(process.env.PORT ?? 3000)`.
- Prisma: `provider = "postgresql"`, nova migration inicial; `prisma generate` no build.
- Seed: categorias (camisetas, conjuntos, pro socks), ligas, produtos com `originalPrice` em parte deles, imagens apontando para assets do front, 1 cupom de teste, 1 admin e 1 usuário demo.

## 3. Front-end (`torcida-veste-app`)

Stack: Next.js (versão estável atual, App Router), TypeScript, Tailwind, shadcn/ui, TanStack Query nas partes interativas, Server Components nas páginas públicas. Tema escuro com verde neon e Poppins, conforme os prints.

Rotas:
- `/` home (banner, atalhos de categoria, Ofertas, Primeira Linha, Conjuntos, banners)
- `/produtos`, `/ofertas` (filtros, busca, paginação)
- `/produto/[id]` (galeria, De/Por, quantidade, descrição, adicionar ao carrinho)
- `/pedidos` (Meus Pedidos, detalhes expansíveis) — protegida
- `/entrar`, `/cadastrar`, `/auth/google/callback`
- `/checkout/sucesso`, `/checkout/cancelado`

Carrinho: drawer (shadcn `Sheet`), estado em localStorage, mostra subtotal, entrega, descontos, total, campo de cupom. "Finalizar compra" → login se necessário → `POST /orders` → redirect para `payment_url`. Total mostrado no carrinho é estimativa; o valor final vem do backend.

Auth: route handlers do Next fazem proxy de login/refresh/logout e gravam access/refresh token em cookies `httpOnly`, `secure`, `sameSite=lax`. Chamadas autenticadas do front passam pelo servidor do Next, que anexa o token. Proxy/middleware protege `/pedidos`.

Responsivo: layouts mobile e desktop conforme as duas pastas de prints; menu hambúrguer no mobile.

## 4. Tratamento de erros

- API devolve erros HTTP padronizados do Nest; front mostra toasts (shadcn `Sonner`) e estados vazios/erro nas listas.
- Estoque/preço divergente no `POST /orders` → 409 com a lista de itens afetados; o front atualiza o carrinho.
- Falha ao criar sessão Stripe → o pedido não fica órfão (transação: cria a sessão antes de confirmar, ou marca `CANCELED`).
- Webhook com assinatura inválida → 400 sem processar.

## 5. Testes e verificação

- Backend (Jest): cálculo de pedido (subtotal, cupom por % e valor, cupom expirado, frete), webhook (assinatura válida/inválida, idempotência), autorização de `GET /orders/:id`, regra de role, troca do código do Google.
- Front (Vitest + Testing Library): lógica do carrinho (adicionar, remover, quantidades, totais, persistência).
- Verificação manual no navegador, fim a fim: cadastro → carrinho → checkout com cartão `4242 4242 4242 4242` → pedido pago em "Meus Pedidos"; login com Google; comparação visual de cada tela com os prints (desktop e mobile).
- Nenhuma tarefa é declarada concluída sem rodar testes/build e conferir a saída.

## 6. Fases de entrega

1. Backend: correções de auth/role, Postgres, `originalPrice`, produtos públicos, CORS, seed
2. Front: base shadcn + tema, home, listagem, produto
3. Auth no front (e-mail e Google) e carrinho
4. Pedidos, Stripe, webhook, "Meus Pedidos"
5. Responsivo, polimento, README com prints, deploy dos dois projetos na Vercel

## 7. Fora de escopo

Painel administrativo (produtos se gerenciam via seed/API), cálculo de frete por CEP, múltiplos tamanhos por produto (o schema tem `size` único), avaliações (as estrelas do print são estáticas/decorativas), e-mails transacionais, upload de imagens.

## 8. Riscos e observações

- O repositório tem alterações não commitadas no backend (auth, category, prisma, seed, pasta `address/`). O trabalho parte delas, sem revertê-las; a organização dos commits é combinada com o usuário.
- Webhook da Stripe precisa de URL pública: em desenvolvimento usa `stripe listen` (Stripe CLI); em produção, o endpoint da Vercel.
- Chaves de teste da Stripe e credenciais do Google são fornecidas pelo usuário; nada de segredo vai para o git.
