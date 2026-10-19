# Torcida Veste — Fase 4: Pedidos, Stripe (sandbox), Webhook e "Meus Pedidos"

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o fluxo de compra: o carrinho vira um pedido calculado no servidor, o usuário paga no Stripe Checkout (modo teste), o webhook marca o pedido como pago e "Meus Pedidos" mostra o histórico.

**Architecture:** O backend NestJS ganha um módulo `order` com uma função de preço pura (centavos inteiros), um serviço que valida carrinho/cupom/estoque e uma abstração `PaymentGateway` (implementada pelo Stripe, trocável por um fake nos testes). `POST /orders` cria o pedido `PENDING_PAYMENT`, abre a Checkout Session e devolve `payment_url`; `POST /payments/webhook` (corpo cru, assinatura verificada) move o pedido para `PAID` ou `CANCELED` de forma idempotente. O front fala com o backend só por route handlers do Next, que anexam o token da sessão em cookie.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres/Neon), `stripe` (Node SDK), Jest · Next 16, React 19, shadcn, Vitest.

Spec: `docs/superpowers/specs/2026-10-14-torcida-veste-storefront-design.md` (seção 2.3) · Fases anteriores: 1 (backend), 2 (vitrine), 3 (auth + carrinho).

## Convenções

- Node 24 (`PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`). Backend: `node node_modules/jest/bin/jest.js`, `node node_modules/prisma/build/index.js`, `node node_modules/.bin/nest build`; leia sempre a linha `Test Suites:`. Front: `node node_modules/vitest/vitest.mjs run`, `node node_modules/.bin/tsc --noEmit`, `npm run lint`. O seed precisa de `PATH="$PWD/node_modules/.bin:..."`.
- `.env` do backend tem aspas e caracteres especiais: nunca `grep|cut` para ler valores, use `dotenv`. Nunca imprima segredos.
- Next 16 difere do que você conhece (`AGENTS.md`): leia `torcida-veste-app/node_modules/next/dist/docs/` antes de escrever route handlers. ESLint do front é estrito (sem `any`, `react-hooks/set-state-in-effect`).
- **Nunca** `pkill`/`killall` por nome; encerre servidores pelo PID da porta (`kill $(lsof -tiTCP:3002 -sTCP:LISTEN)`). Nossas portas: API 3002, front 3001. `rm -rf .next` antes de cada `npm run build`.
- O build do front precisa da API no ar (a home pré-renderiza com fetch).
- Commits com o trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Branch nova: `feat/storefront-orders`, a partir de `feat/storefront-auth-cart`.
- **Dependência externa (do usuário):** conta Stripe em modo teste e a chave `sk_test_...`. Tasks B1–B4 e F1–F3 não precisam dela; B5 (verificação ao vivo) e a Release precisam. A chave nunca vai para o git nem para o chat: `.env` local e `vercel env add` em produção.
- Dinheiro continua `Float` no schema (dívida conhecida); todo cálculo é feito em **centavos inteiros** e só convertido na borda.

## Decisões

| Tema | Decisão |
|---|---|
| Preço | Fonte da verdade é o banco. `subtotal` = soma dos preços cheios (como no print); `discount` = economia das ofertas + cupom; `total` = subtotal − discount + frete |
| Frete | R$ 5,00; grátis quando o valor dos produtos **depois de ofertas e cupom** for ≥ R$ 300,00. Configurável por `SHIPPING_FLAT` e `FREE_SHIPPING_FROM`. O front espelha a regra em `src/lib/shipping.ts` |
| Cupom | `POST /orders/quote` substitui o `POST /coupon/validate` do spec: devolve o desconto já calculado pelo mesmo código do pedido, então não há regra duplicada. Código é único e case-insensitive; vencido ou inexistente → 400 |
| Divergência | O front envia `unitPrice` por item. Preço diferente, produto fora de estoque ou inexistente → 409 `CART_OUTDATED` com a lista; o front reconcilia o carrinho |
| Pagamento | Checkout Session (`mode: payment`, só cartão, BRL, `locale: pt-BR`), itens em `price_data`, cupom como Stripe coupon `amount_off` de uso único, frete como `shipping_options` inline, `expires_at` = 31 min |
| Webhook | `checkout.session.completed` com `payment_status=paid` → `PAID`; `checkout.session.expired` → `CANCELED`; qualquer outro evento → 200 sem efeito. Transição condicional (`WHERE order_status = 'PENDING_PAYMENT'`) = idempotente |
| Falha no Stripe | O pedido já criado vira `CANCELED` e o cliente recebe 502 (ou 503 se pagamentos não estiverem configurados) |
| Enum | `PENDING_PAYMENT` e `PAID` entram em `ORDER_STATUS`. **Sem `@default`** no status: o Postgres não deixa usar um valor de enum recém-criado na mesma migration. O código sempre informa o status |
| Número do pedido | `Order.number` autoincremental (`#001` no print) |
| Cartão no teste | A página do Stripe é de terceiros: o cartão de teste `4242 4242 4242 4242` é digitado **pelo usuário**. A automação cobre tudo até o redirecionamento e prova o webhook com eventos assinados |

## Contratos novos da API

| Chamada | Auth | Corpo | Resposta |
|---|---|---|---|
| `POST /orders/quote` | pública | `{ items:[{productId, quantity}], couponCode? }` | `{ items:[{productId,name,quantity,unitPrice,originalPrice}], subtotal, shipping, discount, couponDiscount, total, coupon:{code}\|null }` |
| `POST /orders` | JWT | `{ items:[{productId, quantity(1–10), unitPrice}], couponCode? }` | 201 `{ orderId, payment_url }` · 409 `{ code:'CART_OUTDATED', items:[{productId, reason, price?, originalPrice?}] }` · 400 cupom inválido · 502/503 pagamento |
| `GET /orders` | JWT | — | `[Order]` do usuário, mais novos primeiro |
| `GET /orders/:id` | JWT | — | `Order`; pedido de outro usuário → 404 |
| `POST /payments/webhook` | assinatura Stripe | corpo cru | 200 `{ received:true }` · 400 assinatura inválida |

`Order` (camelCase): `{ id, number, status, createdAt, subtotal, shipping, discount, couponDiscount, total, couponCode, paymentUrl (só se PENDING_PAYMENT), items:[{ productId, name, quantity, unitPrice, originalPrice, image }] }`.

## Estrutura de arquivos

```
torcida-veste-api/
├── prisma/schema.prisma + migrations/<ts>_orders/
└── src/order/
    ├── pricing.ts (+spec)              preço puro em centavos, cupom, frete
    ├── orders.config.ts                SHIPPING_FLAT, FREE_SHIPPING_FROM, FRONTEND_URL
    ├── errors/cart-outdated.exception.ts
    ├── dto/{create-order,quote-order}.dto.ts
    ├── order.mapper.ts (+spec)
    ├── repository/orders.repository.ts
    ├── payments/{payment.gateway.ts,stripe.gateway.ts}
    ├── services/prepare-order.service.ts (+spec)
    ├── use-cases/{quote-order,create-order,list-orders,find-order,handle-payment-event}.use-case.ts (+specs)
    ├── orders.controller.ts · payments.controller.ts · order.module.ts

torcida-veste-app/src/
├── proxy.ts                           + /checkout
├── app/api/{orders,orders/[id],quote}/route.ts
├── app/checkout/{page,sucesso/page,cancelado/page}.tsx
├── app/pedidos/page.tsx
├── lib/{backend,order-types,order-labels,reconcile}.ts (+tests); cart.ts atualizado
└── components/{checkout,orders,cart}/…
```

---

## Parte A — Backend

### Task B0: Branch

- [ ] `cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste" && git checkout feat/storefront-auth-cart && git checkout -b feat/storefront-orders && git add docs/superpowers/plans/2026-10-16-phase-4-orders-stripe.md && git commit -m "docs: add phase 4 orders and Stripe plan"` (+ trailer). Se o arquivo do plano já estiver commitado, pule o `add/commit`.

### Task B1: Schema, migration e variáveis

**Files:** Modify `torcida-veste-api/prisma/schema.prisma`, `torcida-veste-api/.env.example`; Create `prisma/migrations/<timestamp>_orders/migration.sql` (gerada).

- [ ] **Step 1: Atualizar o schema.** Substitua os models `Coupon`, `Order`, `OrderItem` e o enum `ORDER_STATUS`; adicione `Orders Order[]` em `User`:
```prisma
model Coupon {
  id            String        @id @unique @default(uuid())
  code          String        @unique
  expiration_at String
  value         Float?
  Order         Order[]
  discount_type DISCOUNT_TYPE
}

model Order {
  id              String       @id @unique @default(uuid())
  number          Int          @unique @default(autoincrement())
  user_id         String
  User            User         @relation(fields: [user_id], references: [id])
  order_status    ORDER_STATUS
  subtotal        Float
  shipping        Float
  discount        Float
  coupon_discount Float        @default(0)
  total           Float
  payment_id      String?      @unique
  payment_url     String?
  coupon_id       String?
  Coupon          Coupon?      @relation(fields: [coupon_id], references: [id])
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
  OrderItems      OrderItem[]

  @@index([user_id])
}

model OrderItem {
  id             String  @id @unique @default(uuid())
  product_id     String
  order_id       String
  product_name   String
  quantity       Int
  unit_price     Float
  original_price Float?
  Product        Product @relation(fields: [product_id], references: [id])
  Order          Order   @relation(fields: [order_id], references: [id], onDelete: Cascade)
}

enum ORDER_STATUS {
  PENDING_PAYMENT
  PAID
  RECEIVED
  PROCESSING
  SENT
  CONCLUDED
  CANCELED
}
```
- [ ] **Step 2: Garantir que não há dados a perder.** Nenhum fluxo criou pedidos até hoje. Confirme no banco local: `SELECT count(*) FROM "Order"` = 0 (script com `PrismaClient`, `NODE_PATH`). Se não for 0, **pare e relate**.
- [ ] **Step 3: Gerar a migration sem aplicar e inspecionar o SQL.**
```bash
cd torcida-veste-api
export PATH="$PWD/node_modules/.bin:$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
node node_modules/prisma/build/index.js migrate dev --name orders --create-only
cat prisma/migrations/*_orders/migration.sql
```
Confira: `ALTER TYPE "ORDER_STATUS" ADD VALUE` dos dois novos valores; coluna `code` única em `Coupon`; `Order` com `number`, `user_id` + FK, `created_at/updated_at` como `TIMESTAMP`, `payment_id/payment_url/coupon_id` anuláveis; `OrderItem.quantity INTEGER`, `unit_price`, `original_price`, `product_name`; **nenhum `DEFAULT` referenciando `PENDING_PAYMENT`**. Se o Prisma tiver gerado `DROP COLUMN` + `ADD COLUMN NOT NULL` sem default em tabela com linhas, a tabela precisa estar vazia (Step 2 garante). Aplique: `node node_modules/prisma/build/index.js migrate dev` e depois `node node_modules/prisma/build/index.js generate`.
- [ ] **Step 4: Seed continua válido** (`TORCIDA10` é único). Rode duas vezes: `node node_modules/prisma/build/index.js db seed` → `Seed completed.` nas duas.
- [ ] **Step 5: `.env.example`** — acrescente:
```
# Stripe (modo teste). Chaves reais só em .env local / variáveis da Vercel
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Frete (opcional; padrão 5 e 300)
SHIPPING_FLAT=5
FREE_SHIPPING_FROM=300
```
- [ ] **Step 6: Verificar e commitar.** `node node_modules/.bin/nest build` compila (o código atual não usa os campos removidos; se algo quebrar, relate), `node node_modules/jest/bin/jest.js` segue em 15 suítes/67 testes. Commit: `feat(db): order schema with status, totals, item snapshots and unique coupon code`.

### Task B2: Preço puro (TDD)

**Files:** Create `src/order/pricing.ts`, `src/order/pricing.spec.ts`, `src/order/orders.config.ts`.

- [ ] **Step 1: Teste** — `src/order/pricing.spec.ts`:
```ts
import { calculatePricing, isCouponActive, toCents } from './pricing';

const config = { shippingFlat: 5, freeShippingFrom: 300 };
const shirt = { price: 69.9, originalPrice: 139.9, quantity: 1 };
const set = { price: 159.9, originalPrice: 199.9, quantity: 1 };

describe('calculatePricing', () => {
    it('matches the mockup: 339,80 − 110,00 + 5,00 = 234,80', () => {
        expect(calculatePricing([shirt, set], null, config)).toEqual({
            subtotal: 339.8,
            shipping: 5,
            discount: 110,
            couponDiscount: 0,
            total: 234.8,
        });
    });

    it('applies a percentage coupon on the offer price and counts it in discount', () => {
        const result = calculatePricing([shirt, set], { discount_type: 'PERCENTAGE', value: 10 }, config);
        expect(result).toEqual({ subtotal: 339.8, shipping: 5, discount: 132.98, couponDiscount: 22.98, total: 211.82 });
    });

    it('applies a fixed value coupon and never exceeds the goods total', () => {
        expect(calculatePricing([shirt], { discount_type: 'VALUE', value: 20 }, config).couponDiscount).toBe(20);
        const big = calculatePricing([shirt], { discount_type: 'VALUE', value: 500 }, config);
        expect(big.couponDiscount).toBe(69.9);
        expect(big.total).toBe(0);
        expect(big.shipping).toBe(0);
    });

    it('clamps percentages to 0–100 and ignores empty values', () => {
        expect(calculatePricing([shirt], { discount_type: 'PERCENTAGE', value: 250 }, config).couponDiscount).toBe(69.9);
        expect(calculatePricing([shirt], { discount_type: 'PERCENTAGE', value: null }, config).couponDiscount).toBe(0);
        expect(calculatePricing([shirt], { discount_type: 'VALUE', value: -5 }, config).couponDiscount).toBe(0);
    });

    it('gives free shipping when goods after discounts reach the threshold', () => {
        const line = { price: 150, originalPrice: null, quantity: 2 };
        expect(calculatePricing([line], null, config)).toMatchObject({ shipping: 0, total: 300 });
        expect(calculatePricing([line], { discount_type: 'VALUE', value: 0.01 }, config)).toMatchObject({ shipping: 5, total: 304.99 });
    });

    it('treats a missing or lower originalPrice as no offer', () => {
        const result = calculatePricing([{ price: 50, originalPrice: 40, quantity: 2 }], null, config);
        expect(result).toMatchObject({ subtotal: 100, discount: 0 });
    });

    it('avoids floating point noise', () => {
        const result = calculatePricing([{ price: 0.1, originalPrice: null, quantity: 3 }], null, config);
        expect(result.subtotal).toBe(0.3);
        expect(toCents(0.3)).toBe(30);
    });

    it('returns zeros for an empty order', () => {
        expect(calculatePricing([], null, config)).toEqual({ subtotal: 0, shipping: 0, discount: 0, couponDiscount: 0, total: 0 });
    });
});

describe('isCouponActive', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    it('is true before expiration', () => {
        expect(isCouponActive({ expiration_at: '2099-12-31T23:59:59.000Z' }, now)).toBe(true);
    });
    it('is false after expiration or for unparseable dates', () => {
        expect(isCouponActive({ expiration_at: '2020-01-01T00:00:00.000Z' }, now)).toBe(false);
        expect(isCouponActive({ expiration_at: 'not a date' }, now)).toBe(false);
    });
});
```
Rode (`node node_modules/jest/bin/jest.js src/order/pricing.spec.ts`); esperado FAIL (módulo ausente).

- [ ] **Step 2: Implementar** — `src/order/pricing.ts`:
```ts
import { DISCOUNT_TYPE } from '@prisma/client';

export type PricingLine = { price: number; originalPrice: number | null; quantity: number };
export type PricingCoupon = { discount_type: DISCOUNT_TYPE; value: number | null };
export type PricingConfig = { shippingFlat: number; freeShippingFrom: number };
export type Pricing = {
    subtotal: number;
    shipping: number;
    discount: number;
    couponDiscount: number;
    total: number;
};

export const toCents = (value: number) => Math.round(value * 100);
export const fromCents = (cents: number) => cents / 100;

function couponCents(goodsCents: number, coupon: PricingCoupon | null): number {
    if (!coupon || coupon.value == null || coupon.value <= 0) return 0;

    const raw =
        coupon.discount_type === 'PERCENTAGE'
            ? Math.round((goodsCents * Math.min(coupon.value, 100)) / 100)
            : toCents(coupon.value);

    return Math.min(raw, goodsCents);
}

export function calculatePricing(
    lines: PricingLine[],
    coupon: PricingCoupon | null,
    config: PricingConfig,
): Pricing {
    let subtotal = 0;
    let payable = 0;

    for (const line of lines) {
        const price = toCents(line.price);
        const list = line.originalPrice != null && toCents(line.originalPrice) > price ? toCents(line.originalPrice) : price;
        subtotal += list * line.quantity;
        payable += price * line.quantity;
    }

    const coupons = couponCents(payable, coupon);
    const goods = payable - coupons;
    const shipping = goods <= 0 || goods >= toCents(config.freeShippingFrom) ? 0 : toCents(config.shippingFlat);

    return {
        subtotal: fromCents(subtotal),
        shipping: fromCents(shipping),
        discount: fromCents(subtotal - payable + coupons),
        couponDiscount: fromCents(coupons),
        total: fromCents(goods + shipping),
    };
}

export function isCouponActive(coupon: { expiration_at: string }, now: Date = new Date()): boolean {
    const expires = Date.parse(coupon.expiration_at);
    return Number.isFinite(expires) && expires > now.getTime();
}
```
- [ ] **Step 3: Config** — `src/order/orders.config.ts`:
```ts
const numberFrom = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return value?.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const ordersConfig = () => ({
    shippingFlat: numberFrom(process.env.SHIPPING_FLAT, 5),
    freeShippingFrom: numberFrom(process.env.FREE_SHIPPING_FROM, 300),
    frontendUrl: (process.env.FRONTEND_URL ?? '').trim().replace(/\/+$/, ''),
});
```
- [ ] **Step 4: Rodar.** O teste passa (`Test Suites: 16 passed`). Mutação: troque `goods >= toCents(...)` por `>` e confirme que o teste do limite falha; troque `Math.min(raw, goodsCents)` por `raw` e confirme falha do teste do teto; reverta. Se alguma mutação sobreviver, acrescente um teste de fronteira. Commit: `feat(order): pure pricing in cents with coupon and shipping rules`.

### Task B3: Preparar pedido, cotação e criação (TDD com gateway fake)

**Files:** Create `src/order/errors/cart-outdated.exception.ts`, `src/order/dto/{create-order,quote-order}.dto.ts`, `src/order/payments/payment.gateway.ts`, `src/order/repository/orders.repository.ts`, `src/order/services/prepare-order.service.ts` (+`.spec.ts`), `src/order/use-cases/{quote-order,create-order}.use-case.ts` (+`create-order.use-case.spec.ts`); Modify `src/product/repository/product.repository.ts` (método `findProductsByIds`), `src/coupon/repository/coupon.repository.ts` (busca case-insensitive).

- [ ] **Step 1: Pequenas dependências.** Leia `product.repository.ts` e reaproveite o `productSelect` existente (inclui `Images`): acrescente
```ts
async findProductsByIds(ids: string[]) {
    return this.prisma.product.findMany({ where: { id: { in: ids } }, select: productSelect });
}
```
(sem `try/catch` que engula erro). Em `coupon.repository.ts`, `findCouponByCode` passa a usar `where: { code: { equals: code, mode: 'insensitive' } }`. Garanta que os specs atuais seguem passando.
- [ ] **Step 2: Exceção e DTOs.**
`src/order/errors/cart-outdated.exception.ts`:
```ts
import { ConflictException } from '@nestjs/common';

export type CartIssue = {
    productId: string;
    reason: 'NOT_FOUND' | 'OUT_OF_STOCK' | 'PRICE_CHANGED';
    price?: number;
    originalPrice?: number | null;
};

export class CartOutdatedException extends ConflictException {
    constructor(items: CartIssue[]) {
        super({ statusCode: 409, code: 'CART_OUTDATED', message: 'Cart is out of date', items });
    }
}
```
`src/order/dto/quote-order.dto.ts`:
```ts
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
    @IsString()
    @MaxLength(64)
    productId: string;

    @IsInt()
    @Min(1)
    @Max(10)
    quantity: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    unitPrice?: number;
}

export class QuoteOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsOptional()
    @IsString()
    @MaxLength(40)
    couponCode?: string;
}
```
`src/order/dto/create-order.dto.ts`: `CreateOrderDto extends QuoteOrderDto` com `items` redeclarado exigindo `unitPrice` — implemente como classe separada `CreateOrderItemDto extends OrderItemDto` com `@IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() declare unitPrice: number;` (sem `@IsOptional`) e `CreateOrderDto` com `items: CreateOrderItemDto[]` (mesmos decorators de array) e `couponCode?`.
- [ ] **Step 3: Gateway abstrato** — `src/order/payments/payment.gateway.ts`:
```ts
export type CheckoutLine = { name: string; unitAmount: number; quantity: number; imageUrl?: string };

export type CheckoutInput = {
    orderId: string;
    lines: CheckoutLine[];
    couponAmount: number;
    couponName?: string;
    shippingAmount: number;
    successUrl: string;
    cancelUrl: string;
    expiresAt: number;
};

export type PaymentEvent = {
    type: 'paid' | 'expired' | 'ignored';
    sessionId?: string;
    orderId?: string;
};

// Valores em centavos. Classe abstrata para servir de token de injeção do Nest.
export abstract class PaymentGateway {
    abstract createCheckoutSession(input: CheckoutInput): Promise<{ id: string; url: string }>;
    abstract parseWebhook(rawBody: Buffer, signature: string): PaymentEvent;
}
```
- [ ] **Step 4: Repositório de pedidos** — `src/order/repository/orders.repository.ts` (sem engolir erros, ao contrário dos outros repositórios):
```ts
import { Injectable } from '@nestjs/common';
import { ORDER_STATUS } from '@prisma/client';
import { PrismaService } from '../../shared/databases/prisma.database';
import { Pricing } from '../pricing';

export type NewOrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number | null;
};

const orderInclude = {
    Coupon: { select: { code: true } },
    OrderItems: {
        include: { Product: { select: { Images: { select: { url: true, is_Cover: true } } } } },
    },
} as const;

@Injectable()
export class OrdersRepository {
    constructor(private readonly prisma: PrismaService) {}

    createPending(data: { userId: string; couponId: string | null; pricing: Pricing; items: NewOrderItem[] }) {
        return this.prisma.order.create({
            data: {
                user_id: data.userId,
                coupon_id: data.couponId,
                order_status: 'PENDING_PAYMENT',
                subtotal: data.pricing.subtotal,
                shipping: data.pricing.shipping,
                discount: data.pricing.discount,
                coupon_discount: data.pricing.couponDiscount,
                total: data.pricing.total,
                OrderItems: {
                    create: data.items.map((item) => ({
                        product_id: item.productId,
                        product_name: item.productName,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        original_price: item.originalPrice,
                    })),
                },
            },
        });
    }

    attachPayment(id: string, payment: { paymentId: string; paymentUrl: string }) {
        return this.prisma.order.update({
            where: { id },
            data: { payment_id: payment.paymentId, payment_url: payment.paymentUrl },
        });
    }

    cancel(id: string) {
        return this.prisma.order.updateMany({
            where: { id, order_status: 'PENDING_PAYMENT' },
            data: { order_status: 'CANCELED' },
        });
    }

    /** Transição condicional: devolve quantas linhas mudaram (0 = já processado ou inexistente). */
    async transition(
        where: { id: string; paymentId?: string },
        from: ORDER_STATUS,
        to: ORDER_STATUS,
    ): Promise<number> {
        const result = await this.prisma.order.updateMany({
            where: { id: where.id, order_status: from, ...(where.paymentId ? { payment_id: where.paymentId } : {}) },
            data: { order_status: to },
        });
        return result.count;
    }

    findManyByUser(userId: string) {
        return this.prisma.order.findMany({
            where: { user_id: userId },
            include: orderInclude,
            orderBy: { created_at: 'desc' },
        });
    }

    findByIdForUser(id: string, userId: string) {
        return this.prisma.order.findFirst({ where: { id, user_id: userId }, include: orderInclude });
    }
}
```
- [ ] **Step 5: Teste do serviço de preparo** — `src/order/services/prepare-order.service.spec.ts`. Casos (com repositórios fakes `jest.fn()`; produto `{ id, name, price, originalPrice, stock_status, Images }`):
  1. caminho feliz (2 itens, sem cupom) → `pricing` igual ao do mockup e `lines` na ordem de entrada;
  2. `productId` repetido → `BadRequestException`;
  3. produto inexistente → `CartOutdatedException` com `{ reason: 'NOT_FOUND' }`;
  4. `OUT_OF_STOCK` → issue `OUT_OF_STOCK`;
  5. `unitPrice` diferente do banco (comparação em centavos) → issue `PRICE_CHANGED` com `price` e `originalPrice` atuais; `unitPrice` ausente (cotação) não gera divergência;
  6. vários problemas viram **uma** exceção com todas as issues;
  7. cupom: válido aplica desconto; inexistente → `BadRequestException('Invalid or expired coupon')`; vencido (`expiration_at` no passado) → mesma exceção; `couponCode` é aparado (`' torcida10 '`) antes da busca;
  8. nenhum acesso ao `couponsRepository` quando não há `couponCode`.
- [ ] **Step 6: Implementar** — `src/order/services/prepare-order.service.ts`:
```ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { CouponsRepository } from '../../coupon/repository/coupon.repository';
import { ProductsRepository } from '../../product/repository/product.repository';
import { CartIssue, CartOutdatedException } from '../errors/cart-outdated.exception';
import { ordersConfig } from '../orders.config';
import { calculatePricing, isCouponActive, toCents } from '../pricing';

export type PrepareInput = {
    items: { productId: string; quantity: number; unitPrice?: number }[];
    couponCode?: string;
};

@Injectable()
export class PrepareOrderService {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly couponsRepository: CouponsRepository,
    ) {}

    async prepare(input: PrepareInput) {
        const ids = input.items.map((item) => item.productId);
        if (new Set(ids).size !== ids.length) {
            throw new BadRequestException('Duplicate products in order');
        }

        const products = await this.productsRepository.findProductsByIds(ids);
        const byId = new Map(products.map((product) => [product.id, product]));

        const issues: CartIssue[] = [];
        const lines = input.items.flatMap((item) => {
            const product = byId.get(item.productId);

            if (!product) {
                issues.push({ productId: item.productId, reason: 'NOT_FOUND' });
                return [];
            }
            if (product.stock_status !== 'IN_STOCK') {
                issues.push({ productId: item.productId, reason: 'OUT_OF_STOCK' });
                return [];
            }
            if (item.unitPrice != null && toCents(item.unitPrice) !== toCents(product.price)) {
                issues.push({
                    productId: item.productId,
                    reason: 'PRICE_CHANGED',
                    price: product.price,
                    originalPrice: product.originalPrice ?? null,
                });
                return [];
            }
            return [{ product, quantity: item.quantity }];
        });

        if (issues.length > 0) throw new CartOutdatedException(issues);

        let coupon = null;
        const code = input.couponCode?.trim();
        if (code) {
            coupon = await this.couponsRepository.findCouponByCode(code);
            if (!coupon || !isCouponActive(coupon)) {
                throw new BadRequestException('Invalid or expired coupon');
            }
        }

        const pricing = calculatePricing(
            lines.map(({ product, quantity }) => ({
                price: product.price,
                originalPrice: product.originalPrice ?? null,
                quantity,
            })),
            coupon,
            ordersConfig(),
        );

        return { lines, coupon, pricing };
    }
}
```
Se os tipos do `productSelect` não tiverem `stock_status`/`price`, ajuste o `select` (acrescentando os campos) em vez de `any`.
- [ ] **Step 7: Teste do `CreateOrderUseCase`** — `src/order/use-cases/create-order.use-case.spec.ts`:
```ts
import { BadGatewayException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { CreateOrderUseCase } from './create-order.use-case';

const prepared = {
    lines: [
        { product: { id: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, Images: [{ url: '/a.png', is_Cover: true }] }, quantity: 1 },
        { product: { id: 'p2', name: 'Conjunto', price: 159.9, originalPrice: 199.9, Images: [] }, quantity: 2 },
    ],
    coupon: { id: 'c1', code: 'TORCIDA10' },
    pricing: { subtotal: 539.7, shipping: 0, discount: 142.0, couponDiscount: 38.97, total: 350.73 },
};

describe('CreateOrderUseCase', () => {
    beforeEach(() => {
        process.env.FRONTEND_URL = 'https://front.test/';
    });

    const makeSut = () => {
        const prepare = { prepare: jest.fn().mockResolvedValue(prepared) };
        const orders = {
            createPending: jest.fn().mockResolvedValue({ id: 'o1' }),
            attachPayment: jest.fn().mockResolvedValue({}),
            cancel: jest.fn().mockResolvedValue({ count: 1 }),
        };
        const gateway = { createCheckoutSession: jest.fn().mockResolvedValue({ id: 'cs_1', url: 'https://pay.test/cs_1' }) };
        const logger = { log: jest.fn(), error: jest.fn() };
        const sut = new CreateOrderUseCase(prepare as any, orders as any, gateway as any, logger as any);
        return { sut, prepare, orders, gateway };
    };
    const dto = { items: [{ productId: 'p1', quantity: 1, unitPrice: 69.9 }, { productId: 'p2', quantity: 2, unitPrice: 159.9 }], couponCode: 'torcida10' };

    it('creates the pending order, opens the session and returns the payment url', async () => {
        const { sut, orders, gateway } = makeSut();

        const result = await sut.execute('u1', dto);

        expect(result).toEqual({ orderId: 'o1', payment_url: 'https://pay.test/cs_1' });
        expect(orders.createPending).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u1', couponId: 'c1', pricing: prepared.pricing }),
        );
        expect(orders.createPending.mock.calls[0][0].items[1]).toEqual({
            productId: 'p2', productName: 'Conjunto', quantity: 2, unitPrice: 159.9, originalPrice: 199.9,
        });
        const input = gateway.createCheckoutSession.mock.calls[0][0];
        expect(input.orderId).toBe('o1');
        expect(input.lines).toEqual([
            { name: 'Camiseta', unitAmount: 6990, quantity: 1, imageUrl: 'https://front.test/a.png' },
            { name: 'Conjunto', unitAmount: 15990, quantity: 2, imageUrl: undefined },
        ]);
        expect(input.couponAmount).toBe(3897);
        expect(input.shippingAmount).toBe(0);
        expect(input.successUrl).toBe('https://front.test/checkout/sucesso?order=o1');
        expect(input.cancelUrl).toBe('https://front.test/checkout/cancelado?order=o1');
        expect(input.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 30 * 60);
        expect(orders.attachPayment).toHaveBeenCalledWith('o1', { paymentId: 'cs_1', paymentUrl: 'https://pay.test/cs_1' });
    });

    it('does not create anything when the cart is outdated', async () => {
        const { sut, prepare, orders, gateway } = makeSut();
        prepare.prepare.mockRejectedValue(new ConflictException());
        await expect(sut.execute('u1', dto)).rejects.toBeInstanceOf(ConflictException);
        expect(orders.createPending).not.toHaveBeenCalled();
        expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('cancels the order and answers 502 when the gateway fails', async () => {
        const { sut, orders, gateway } = makeSut();
        gateway.createCheckoutSession.mockRejectedValue(new Error('stripe down'));
        await expect(sut.execute('u1', dto)).rejects.toBeInstanceOf(BadGatewayException);
        expect(orders.cancel).toHaveBeenCalledWith('o1');
        expect(orders.attachPayment).not.toHaveBeenCalled();
    });

    it('cancels the order and keeps 503 when payments are not configured', async () => {
        const { sut, orders, gateway } = makeSut();
        gateway.createCheckoutSession.mockRejectedValue(new ServiceUnavailableException());
        await expect(sut.execute('u1', dto)).rejects.toBeInstanceOf(ServiceUnavailableException);
        expect(orders.cancel).toHaveBeenCalledWith('o1');
    });
});
```
Ajuste os números de `prepared.pricing` só se o seu arredondamento diferir; o que importa é `couponAmount === toCents(couponDiscount)`.
- [ ] **Step 8: Implementar os use cases.** `create-order.use-case.ts`:
```ts
import { BadGatewayException, HttpException, Injectable, Logger } from '@nestjs/common';
import { ordersConfig } from '../orders.config';
import { PaymentGateway } from '../payments/payment.gateway';
import { toCents } from '../pricing';
import { OrdersRepository } from '../repository/orders.repository';
import { PrepareOrderService } from '../services/prepare-order.service';
import { CreateOrderDto } from '../dto/create-order.dto';

const SESSION_MINUTES = 31; // o Stripe exige expiração de pelo menos 30 min

@Injectable()
export class CreateOrderUseCase {
    constructor(
        private readonly prepareOrder: PrepareOrderService,
        private readonly ordersRepository: OrdersRepository,
        private readonly gateway: PaymentGateway,
        private readonly logger: Logger = new Logger(CreateOrderUseCase.name),
    ) {}

    async execute(userId: string, dto: CreateOrderDto) {
        const { lines, coupon, pricing } = await this.prepareOrder.prepare(dto);
        const { frontendUrl } = ordersConfig();

        const order = await this.ordersRepository.createPending({
            userId,
            couponId: coupon?.id ?? null,
            pricing,
            items: lines.map(({ product, quantity }) => ({
                productId: product.id,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                originalPrice: product.originalPrice ?? null,
            })),
        });

        try {
            const session = await this.gateway.createCheckoutSession({
                orderId: order.id,
                lines: lines.map(({ product, quantity }) => {
                    const cover = product.Images.find((image) => image.is_Cover) ?? product.Images[0];
                    return {
                        name: product.name,
                        unitAmount: toCents(product.price),
                        quantity,
                        imageUrl: cover && frontendUrl.startsWith('https://') ? `${frontendUrl}${cover.url}` : undefined,
                    };
                }),
                couponAmount: toCents(pricing.couponDiscount),
                couponName: coupon?.code,
                shippingAmount: toCents(pricing.shipping),
                successUrl: `${frontendUrl}/checkout/sucesso?order=${order.id}`,
                cancelUrl: `${frontendUrl}/checkout/cancelado?order=${order.id}`,
                expiresAt: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
            });

            await this.ordersRepository.attachPayment(order.id, { paymentId: session.id, paymentUrl: session.url });
            this.logger.log(`Order ${order.id} created`, CreateOrderUseCase.name);
            return { orderId: order.id, payment_url: session.url };
        } catch (error) {
            await this.ordersRepository.cancel(order.id);
            this.logger.error(`Order ${order.id} canceled: payment session failed`);
            if (error instanceof HttpException) throw error;
            throw new BadGatewayException('Could not start the payment');
        }
    }
}
```
`quote-order.use-case.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { QuoteOrderDto } from '../dto/quote-order.dto';
import { PrepareOrderService } from '../services/prepare-order.service';

@Injectable()
export class QuoteOrderUseCase {
    constructor(private readonly prepareOrder: PrepareOrderService) {}

    async execute(dto: QuoteOrderDto) {
        const { lines, coupon, pricing } = await this.prepareOrder.prepare(dto);

        return {
            items: lines.map(({ product, quantity }) => ({
                productId: product.id,
                name: product.name,
                quantity,
                unitPrice: product.price,
                originalPrice: product.originalPrice ?? null,
            })),
            ...pricing,
            coupon: coupon ? { code: coupon.code } : null,
        };
    }
}
```
- [ ] **Step 9: Rodar** `node node_modules/jest/bin/jest.js` (todas passam; leia `Test Suites:`) e `nest build`. Mutação: remover o `cancel` do `catch` do `CreateOrderUseCase` deve falhar 2 testes; reverta. Commit: `feat(order): prepare, quote and create-order use cases with payment gateway abstraction`.

### Task B4: Webhook, leitura de pedidos e mapper (TDD)

**Files:** Create `src/order/order.mapper.ts` (+spec), `src/order/use-cases/{handle-payment-event,list-orders,find-order}.use-case.ts` (+specs de `handle-payment-event` e `find-order`).

- [ ] **Step 1: Testes do mapper** — `order.mapper.spec.ts`, casos: (a) mapeia campos para camelCase, `createdAt` em ISO, `couponCode` nulo sem cupom; (b) `image` é a capa do produto (ou a primeira, ou `null`); (c) `paymentUrl` só existe quando `order_status === 'PENDING_PAYMENT'` (nos demais é `null`); (d) `originalPrice` do item vem do snapshot, `unitPrice` também.
- [ ] **Step 2: Implementar** — `src/order/order.mapper.ts`:
```ts
type OrderRow = {
    id: string; number: number; order_status: string; created_at: Date;
    subtotal: number; shipping: number; discount: number; coupon_discount: number; total: number;
    payment_url: string | null;
    Coupon: { code: string } | null;
    OrderItems: {
        product_id: string; product_name: string; quantity: number; unit_price: number; original_price: number | null;
        Product: { Images: { url: string; is_Cover: boolean }[] };
    }[];
};

export function toOrderResponse(order: OrderRow) {
    return {
        id: order.id,
        number: order.number,
        status: order.order_status,
        createdAt: order.created_at.toISOString(),
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        couponDiscount: order.coupon_discount,
        total: order.total,
        couponCode: order.Coupon?.code ?? null,
        paymentUrl: order.order_status === 'PENDING_PAYMENT' ? order.payment_url : null,
        items: order.OrderItems.map((item) => {
            const images = item.Product.Images;
            return {
                productId: item.product_id,
                name: item.product_name,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                originalPrice: item.original_price,
                image: (images.find((image) => image.is_Cover) ?? images[0])?.url ?? null,
            };
        }),
    };
}
```
- [ ] **Step 3: Teste do webhook** — `handle-payment-event.use-case.spec.ts`:
```ts
import { HandlePaymentEventUseCase } from './handle-payment-event.use-case';

const makeSut = (count = 1) => {
    const orders = { transition: jest.fn().mockResolvedValue(count) };
    const logger = { log: jest.fn(), error: jest.fn() };
    return { sut: new HandlePaymentEventUseCase(orders as any, logger as any), orders };
};

describe('HandlePaymentEventUseCase', () => {
    it('marks the order as paid only if it is still pending and the session matches', async () => {
        const { sut, orders } = makeSut();
        expect(await sut.execute({ type: 'paid', sessionId: 'cs_1', orderId: 'o1' })).toEqual({ received: true });
        expect(orders.transition).toHaveBeenCalledWith({ id: 'o1', paymentId: 'cs_1' }, 'PENDING_PAYMENT', 'PAID');
    });

    it('is idempotent: a replay changes nothing and still answers received', async () => {
        const { sut } = makeSut(0);
        expect(await sut.execute({ type: 'paid', sessionId: 'cs_1', orderId: 'o1' })).toEqual({ received: true });
    });

    it('cancels the order when the session expires', async () => {
        const { sut, orders } = makeSut();
        await sut.execute({ type: 'expired', sessionId: 'cs_1', orderId: 'o1' });
        expect(orders.transition).toHaveBeenCalledWith({ id: 'o1', paymentId: 'cs_1' }, 'PENDING_PAYMENT', 'CANCELED');
    });

    it('ignores unknown events and events without order metadata', async () => {
        const { sut, orders } = makeSut();
        expect(await sut.execute({ type: 'ignored' })).toEqual({ received: true });
        expect(await sut.execute({ type: 'paid', sessionId: 'cs_1' })).toEqual({ received: true });
        expect(orders.transition).not.toHaveBeenCalled();
    });
});
```
- [ ] **Step 4: Implementar** `handle-payment-event.use-case.ts`:
```ts
import { Injectable, Logger } from '@nestjs/common';
import { PaymentEvent } from '../payments/payment.gateway';
import { OrdersRepository } from '../repository/orders.repository';

@Injectable()
export class HandlePaymentEventUseCase {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly logger: Logger = new Logger(HandlePaymentEventUseCase.name),
    ) {}

    async execute(event: PaymentEvent) {
        if (event.type === 'ignored' || !event.orderId || !event.sessionId) {
            return { received: true };
        }

        const target = event.type === 'paid' ? 'PAID' : 'CANCELED';
        const changed = await this.ordersRepository.transition(
            { id: event.orderId, paymentId: event.sessionId },
            'PENDING_PAYMENT',
            target,
        );

        this.logger.log(`Order ${event.orderId} -> ${target}: ${changed ? 'updated' : 'no-op'}`, HandlePaymentEventUseCase.name);
        return { received: true };
    }
}
```
- [ ] **Step 5: Leitura com dono.** `find-order.use-case.ts`: `execute(userId, id)` chama `findByIdForUser`; `null` → `NotFoundException('Order not found')` (**404 também para pedido de outro usuário**); devolve `toOrderResponse(order)`. Teste (`find-order.use-case.spec.ts`): encontra o próprio pedido; repositório devolve `null` → `NotFoundException`; confirma que a consulta é feita com `(id, userId)` (um pedido alheio nunca é lido). `list-orders.use-case.ts`: `execute(userId)` → `findManyByUser(userId)` mapeado com `toOrderResponse`.
- [ ] **Step 6: Rodar** jest (todas passam) e `nest build`. Mutação: no `HandlePaymentEventUseCase` tirar `paymentId` do `where` não é detectável por mock; garanta pelo teste que `transition` recebe `paymentId`. Commit: `feat(order): payment webhook handling, order read use cases and response mapper`.

### Task B5: Stripe, controllers, módulo e verificação ao vivo

**Files:** Create `src/order/payments/stripe.gateway.ts`, `src/order/orders.controller.ts`, `src/order/payments.controller.ts`, `src/order/order.module.ts`; Modify `src/app.module.ts`, `src/main.ts`, `package.json`.

- [ ] **Step 1: Instalar o SDK** — `npm i stripe`. Leia os tipos instalados em `node_modules/stripe` (a API do SDK muda entre majors) e confirme `checkout.sessions.create` (com `line_items.price_data`, `discounts`, `shipping_options`, `expires_at`, `locale`), `coupons.create`, `webhooks.constructEvent`.
- [ ] **Step 2: Gateway Stripe** — `src/order/payments/stripe.gateway.ts` (adapte à tipagem real do SDK, sem `any`):
```ts
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import { CheckoutInput, PaymentEvent, PaymentGateway } from './payment.gateway';

@Injectable()
export class StripeGateway extends PaymentGateway {
    private client(): Stripe {
        const key = process.env.STRIPE_SECRET_KEY?.trim();
        if (!key) throw new ServiceUnavailableException('Payments are not configured');
        return new Stripe(key);
    }

    async createCheckoutSession(input: CheckoutInput) {
        const stripe = this.client();

        const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
        if (input.couponAmount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: input.couponAmount,
                currency: 'brl',
                duration: 'once',
                max_redemptions: 1,
                name: input.couponName,
            });
            discounts.push({ coupon: coupon.id });
        }

        const session = await stripe.checkout.sessions.create(
            {
                mode: 'payment',
                payment_method_types: ['card'],
                locale: 'pt-BR',
                client_reference_id: input.orderId,
                metadata: { orderId: input.orderId },
                line_items: input.lines.map((line) => ({
                    quantity: line.quantity,
                    price_data: {
                        currency: 'brl',
                        unit_amount: line.unitAmount,
                        product_data: { name: line.name, ...(line.imageUrl ? { images: [line.imageUrl] } : {}) },
                    },
                })),
                discounts,
                shipping_options: [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: input.shippingAmount, currency: 'brl' },
                            display_name: input.shippingAmount > 0 ? 'Entrega' : 'Entrega grátis',
                        },
                    },
                ],
                success_url: input.successUrl,
                cancel_url: input.cancelUrl,
                expires_at: input.expiresAt,
            },
            { idempotencyKey: `order-${input.orderId}` },
        );

        if (!session.url) throw new Error('Stripe returned a session without url');
        return { id: session.id, url: session.url };
    }

    parseWebhook(rawBody: Buffer, signature: string): PaymentEvent {
        const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!secret) throw new ServiceUnavailableException('Webhook is not configured');

        let event: Stripe.Event;
        try {
            event = new Stripe(process.env.STRIPE_SECRET_KEY?.trim() || 'sk_test_unused').webhooks.constructEvent(rawBody, signature, secret);
        } catch {
            throw new BadRequestException('Invalid signature');
        }

        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
            const session = event.data.object as Stripe.Checkout.Session;
            const isPaid = event.type === 'checkout.session.completed' && session.payment_status === 'paid';
            const isExpired = event.type === 'checkout.session.expired';

            if (isPaid || isExpired) {
                return {
                    type: isPaid ? 'paid' : 'expired',
                    sessionId: session.id,
                    orderId: session.metadata?.orderId ?? undefined,
                };
            }
        }
        return { type: 'ignored' };
    }
}
```
- [ ] **Step 3: Controllers.** `orders.controller.ts`:
```ts
import { Body, Controller, Get, Param, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteOrderDto } from './dto/quote-order.dto';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { FindOrderUseCase } from './use-cases/find-order.use-case';
import { ListOrdersUseCase } from './use-cases/list-orders.use-case';
import { QuoteOrderUseCase } from './use-cases/quote-order.use-case';

const pipe = () => new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly quoteOrder: QuoteOrderUseCase,
        private readonly createOrder: CreateOrderUseCase,
        private readonly listOrders: ListOrdersUseCase,
        private readonly findOrder: FindOrderUseCase,
    ) {}

    @Post('quote')
    quote(@Body(pipe()) dto: QuoteOrderDto) {
        return this.quoteOrder.execute(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() req, @Body(pipe()) dto: CreateOrderDto) {
        return this.createOrder.execute(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    list(@Req() req) {
        return this.listOrders.execute(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    find(@Req() req, @Param('id') id: string) {
        return this.findOrder.execute(req.user.userId, id);
    }
}
```
`payments.controller.ts`:
```ts
import { BadRequestException, Controller, Headers, HttpCode, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentGateway } from './payments/payment.gateway';
import { HandlePaymentEventUseCase } from './use-cases/handle-payment-event.use-case';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly gateway: PaymentGateway,
        private readonly handleEvent: HandlePaymentEventUseCase,
    ) {}

    @Post('webhook')
    @HttpCode(200)
    webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
        if (!req.rawBody || !signature) throw new BadRequestException('Missing payload or signature');
        return this.handleEvent.execute(this.gateway.parseWebhook(req.rawBody, signature));
    }
}
```
- [ ] **Step 4: Módulo e boot.** `order.module.ts`: `imports: [ProductModule, CouponModule]` (ambos já exportam seus repositórios), `controllers: [OrdersController, PaymentsController]`, `providers: [OrdersRepository, PrepareOrderService, QuoteOrderUseCase, CreateOrderUseCase, ListOrdersUseCase, FindOrderUseCase, HandlePaymentEventUseCase, Logger, { provide: PaymentGateway, useClass: StripeGateway }]`. Registre `OrderModule` em `AppModule`. Em `main.ts`: `NestFactory.create(AppModule, { rawBody: true })`.
- [ ] **Step 5: Verificar sem Stripe (não precisa de chave).** `nest build`, jest completo, suba a API (`PORT=3002`) e rode:
```bash
B=http://localhost:3002
curl -s -X POST $B/orders/quote -H 'Content-Type: application/json' -d '{"items":[{"productId":"seed-product-01","quantity":1},{"productId":"seed-product-10","quantity":1}]}'   # subtotal 339.8, shipping 5, discount 110, total 234.8
curl -s -X POST $B/orders/quote -H 'Content-Type: application/json' -d '{"items":[{"productId":"seed-product-01","quantity":1},{"productId":"seed-product-10","quantity":1}],"couponCode":"torcida10"}'   # couponDiscount 22.98, total 211.82
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/orders/quote -H 'Content-Type: application/json' -d '{"items":[{"productId":"seed-product-01","quantity":1}],"couponCode":"NAOEXISTE"}'   # 400
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/orders/quote -H 'Content-Type: application/json' -d '{"items":[{"productId":"nope","quantity":1}]}'   # 409
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/orders -H 'Content-Type: application/json' -d '{}'   # 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/payments/webhook -H 'Content-Type: application/json' -d '{}'   # 400
```
Depois logue como demo (`POST /auth`) e valide `POST /orders` com `unitPrice` errado → 409 `PRICE_CHANGED` com `price` correto; DTO inválido (quantidade 11, campo extra) → 400; `GET /orders` → `[]`.
- [ ] **Step 6: Verificação ao vivo com Stripe (exige `STRIPE_SECRET_KEY` de teste no `.env` local, fornecida pelo usuário; se faltar, registre "não verificado" e siga).** Com a chave e `STRIPE_WEBHOOK_SECRET=whsec_test_local` (qualquer valor; é usado só para assinar eventos sintéticos) reinicie a API e, como demo:
  1. `POST /orders` (camiseta 01 + conjunto 10, `unitPrice` corretos, cupom `TORCIDA10`) → 201 com `payment_url` iniciando em `https://checkout.stripe.com/`; `GET /orders/:id` mostra `PENDING_PAYMENT` e `paymentUrl`. Busque a sessão na API do Stripe (`GET /v1/checkout/sessions/<id>` com a chave) e confira `amount_total` = `total × 100`, `currency=brl`, `payment_method_types=['card']`.
  2. Webhook **sem** assinatura → 400; com assinatura inválida → 400.
  3. Evento sintético `checkout.session.completed` (`payment_status:'paid'`, `metadata.orderId`, `id` = sessão real), assinado com `stripe.webhooks.generateTestHeaderString({ payload, secret })` (script no scratchpad, `NODE_PATH` do backend), enviado com o **corpo exato** ao `POST /payments/webhook` → 200; `GET /orders/:id` → `PAID`, `paymentUrl: null`. Reenvie o mesmo evento → 200 e continua `PAID`.
  4. Segundo pedido + evento `checkout.session.expired` → `CANCELED`; um `completed` depois do cancelamento **não** o reabre.
  5. `GET /orders/:id` de um pedido do demo logado como **outro** usuário (registre um temporário) → 404. Apague os usuários/pedidos de teste do banco local ao final.
  6. Se a Stripe CLI estiver instalada (`stripe --version`), faça também `stripe listen --forward-to localhost:3002/payments/webhook` e dispare `stripe trigger checkout.session.completed`; senão registre que só os eventos assinados localmente foram usados.
  Encerre a API pelo PID. Commit: `feat(order): Stripe gateway, orders and payments controllers, raw body webhook`.

---

## Parte B — Front-end

### Task F1: Libs puras (TDD)

**Files:** Modify `src/lib/cart.ts` (+test); Create `src/lib/order-types.ts`, `src/lib/order-labels.ts` (+test), `src/lib/reconcile.ts` (+test).

- [ ] **Step 1: `cart.ts` ganha cupom.** O tipo vira `Cart = { items: CartItem[]; couponCode: string | null }`. Atualize **todos** os usos e testes existentes: o carrinho vazio é `{ items: [], couponCode: null }` (testes `empty`, `parseCart` que devolvem vazio, `serializeCart` round-trip). Acrescente e teste:
  - `setCoupon(cart, code: string | null)`: apara espaços; vazio vira `null`; limita a 40 caracteres.
  - `clearCart(): Cart` → vazio.
  - `parseCart` lê `couponCode` (string aparada ≤ 40, senão `null`).
  - `cartTotals(cart, couponDiscount = 0)` devolve `{ subtotal, savings, couponDiscount, discounts, shipping, total, itemCount }`, com `discounts = savings + couponDiscount`, frete calculado sobre `payable − couponDiscount` e `total = payable − couponDiscount + shipping`. O caso do mockup passa a esperar `{ subtotal: 339.8, savings: 110, couponDiscount: 0, discounts: 110, shipping: 5, total: 234.8, itemCount: 2 }` (o teste atual do plano da fase 3 usava 100 de economia por causa do print desktop; use os preços reais do seed: 69,9/139,9 e 159,9/199,9). Novos casos: cupom de 22,98 → `total 211.82`; cupom que leva os produtos abaixo de R$ 300 volta a cobrar frete; cupom maior que o `payable` é limitado ao `payable` (total 0, frete 0).
- [ ] **Step 2: Tipos de pedido** — `src/lib/order-types.ts`:
```ts
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'RECEIVED' | 'PROCESSING' | 'SENT' | 'CONCLUDED' | 'CANCELED';

export type OrderItemView = {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number | null;
    image: string | null;
};

export type Order = {
    id: string;
    number: number;
    status: OrderStatus;
    createdAt: string;
    subtotal: number;
    shipping: number;
    discount: number;
    couponDiscount: number;
    total: number;
    couponCode: string | null;
    paymentUrl: string | null;
    items: OrderItemView[];
};
```
- [ ] **Step 3: Rótulos (TDD)** — testes em `order-labels.test.ts`: `formatOrderNumber(1) === '#001'`, `(42) === '#042'`, `(1234) === '#1234'`; `formatOrderDate('2026-10-16T02:30:00.000Z')` → `'15/10/26'` (fuso `America/Sao_Paulo`: 23:30 do dia anterior) e `'2026-10-16T15:00:00.000Z'` → `'16/10/26'`; `statusLabel` e `statusTone`: `PENDING_PAYMENT` → `'Aguardando pagamento'` / `'warning'`, `PAID` → `'Pago'` / `'success'`, `PROCESSING` → `'Em preparação'` / `'success'`, `SENT` → `'Enviado'` / `'success'`, `CONCLUDED` → `'Concluído'` / `'success'`, `RECEIVED` → `'Recebido'` / `'success'`, `CANCELED` → `'Cancelado'` / `'danger'`. Implemente com `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' })`.
- [ ] **Step 4: Reconciliação (TDD)** — `src/lib/reconcile.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { addItem } from './cart';
import { reconcileCart } from './reconcile';

const shirt = { productId: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, image: null };
const set = { productId: 'p2', name: 'Conjunto', price: 159.9, originalPrice: 199.9, image: null };
const base = addItem(addItem({ items: [], couponCode: 'X' }, shirt, 2), set, 1);

describe('reconcileCart', () => {
    it('removes products that are gone or out of stock', () => {
        const next = reconcileCart(base, [
            { productId: 'p1', reason: 'NOT_FOUND' },
            { productId: 'p2', reason: 'OUT_OF_STOCK' },
        ]);
        expect(next.items).toEqual([]);
    });
    it('updates price and original price, keeping quantity', () => {
        const next = reconcileCart(base, [{ productId: 'p1', reason: 'PRICE_CHANGED', price: 59.9, originalPrice: null }]);
        expect(next.items[0]).toMatchObject({ productId: 'p1', price: 59.9, originalPrice: null, quantity: 2 });
        expect(next.items[1].productId).toBe('p2');
    });
    it('keeps the coupon and ignores issues for unknown products', () => {
        const next = reconcileCart(base, [{ productId: 'zzz', reason: 'NOT_FOUND' }]);
        expect(next).toEqual(base);
    });
});
```
Implemente `reconcileCart(cart, issues: CartIssue[])` e exporte `CartIssue = { productId: string; reason: 'NOT_FOUND' | 'OUT_OF_STOCK' | 'PRICE_CHANGED'; price?: number; originalPrice?: number | null }`.
- [ ] **Step 5: Rodar tudo** (vitest, `tsc`, lint). Mutação: troque a filtragem de `OUT_OF_STOCK` e o limite de frete; confirme falhas; reverta. Commit: `feat(app): coupon-aware cart totals, order labels and cart reconciliation with tests`.

### Task F2: Chamadas autenticadas e route handlers

**Files:** Create `src/lib/backend.ts` (+test), `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/api/quote/route.ts`.

- [ ] **Step 1: Teste de `backendFetch`** — `src/lib/backend.test.ts` (jar fake como em `session-store.test.ts`; `fetch` mockado com `vi.stubGlobal`): (a) sem sessão → resposta 401 `{ message }` e **nenhum** `fetch`; (b) com sessão válida → `fetch` para `${API_URL}${path}` com `Authorization: Bearer <token>`, `Content-Type: application/json` e `cache: 'no-store'`, repassando método e corpo; (c) devolve o **status e o corpo** do backend (incluindo 409 com `items`); (d) com token expirado renova pelo `resolveSession` antes de chamar.
- [ ] **Step 2: Implementar** — `src/lib/backend.ts`:
```ts
import { resolveSession, type CookieJar } from './session-store';

const baseUrl = () => process.env.API_URL ?? 'http://localhost:3000';

export async function backendFetch(
    jar: CookieJar,
    path: string,
    init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<Response> {
    const session = await resolveSession(jar);
    if (!session) return Response.json({ message: 'Não autenticado' }, { status: 401 });

    const response = await fetch(`${baseUrl()}${path}`, {
        method: init.method ?? 'GET',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
    });
}
```
- [ ] **Step 3: Route handlers** (consulte os docs do Next 16 para a assinatura de `params` assíncrono):
  - `GET /api/orders` → `backendFetch(await cookies(), '/orders')`.
  - `POST /api/orders` → lê `await request.json().catch(() => null)`; se não for objeto → 400; repassa para `backendFetch(..., '/orders', { method: 'POST', body })`.
  - `GET /api/orders/[id]` → `backendFetch(..., `/orders/${encodeURIComponent(id)}`)`.
  - `POST /api/quote` (**pública**, sem sessão): `fetch(`${API_URL}/orders/quote`, { method: 'POST', cache: 'no-store', ... })` repassando status e corpo.
  Todos com `export const dynamic = 'force-dynamic'`.
- [ ] **Step 4: Verificar** com a API no ar: `curl -X POST localhost:3001/api/quote ...` devolve a cotação do mockup (234,8) e 409 para produto inexistente; `GET /api/orders` sem cookie → 401; com login do demo → `[]`. Vitest, `tsc`, lint, build. Commit: `feat(app): authenticated order proxy route handlers and public quote`.

### Task F3: Cupom no provider e no drawer

**Files:** Modify `src/components/cart/cart-provider.tsx`, `cart-drawer.tsx`, `src/lib/cart.ts` consumers; Create `src/components/cart/coupon-field.tsx`, `src/components/cart/cart-summary.tsx`.

- [ ] **Step 1: Provider.** Acrescente ao estado exposto: `couponCode`, `couponDiscount`, `couponError`, `applyCoupon(code)`, `removeCoupon()`, `clear()` (usa `clearCart`). O desconto vem da cotação do servidor:
  - efeito (com debounce de 300 ms e `AbortController`) que, quando há `cart.couponCode` **e** itens, chama `POST /api/quote` com `{ items: [{ productId, quantity }], couponCode }` e guarda `{ key, couponDiscount }` (ou `{ key, error }`) **dentro do callback assíncrono** (o lint proíbe `setState` síncrono no efeito); `key` é uma string derivada de código + itens/quantidades;
  - o desconto efetivo só vale quando `quote.key === keyAtual`; senão é 0 (cupom em verificação). Em 400 do cupom, remove o código do carrinho e mostra `couponError` ('Cupom inválido ou expirado'). Em 409 `CART_OUTDATED`, aplica `reconcileCart` ao carrinho;
  - `totals = cartTotals(cart, couponDiscount)`.
  `applyCoupon(code)` chama `updateCart((c) => setCoupon(c, code))`.
- [ ] **Step 2: `CouponField`** (client): linha com `Input` ("Cupom de desconto", `aria-label`) + botão "Aplicar"; com cupom ativo mostra um chip `TORCIDA10 · − R$ x,xx` com botão "Remover"; `couponError` em `role="alert"` (`text-destructive`). Visual dentro do drawer: compacto, `h-10`, abaixo da lista e acima dos totais.
- [ ] **Step 3: `CartSummary`** (client, reaproveitado no drawer e no checkout): as quatro linhas do print — Subtotal, Entrega (`Grátis` quando 0), Descontos (`- R$ x` somando `discounts`), Total em negrito. Substitua as linhas hoje montadas no `cart-drawer.tsx`.
- [ ] **Step 4: Verificar.** vitest, `tsc`, lint, build limpo (`rm -rf .next`, API no ar). Teste com puppeteer (scratchpad): aplicar `torcida10` com dois itens → Descontos `- R$ 132,98` e Total `R$ 211,82`; `naoexiste` → mensagem de erro e nenhum desconto; recarregar mantém o cupom; remover cupom volta a `R$ 234,80`. Commit: `feat(app): coupon field with server-verified discount in the cart drawer`.

### Task F4: Checkout, sucesso e cancelamento

**Files:** Create `src/app/checkout/page.tsx`, `src/components/checkout/{checkout-view,order-poller}.tsx`, `src/app/checkout/sucesso/page.tsx`, `src/app/checkout/cancelado/page.tsx`; Modify `src/proxy.ts`, `src/components/cart/cart-drawer.tsx` (botão).

- [ ] **Step 1: Proxy.** `matcher: ['/pedidos/:path*', '/checkout/:path*', '/checkout']` (sem sessão → `/entrar?next=...`).
- [ ] **Step 2: `/checkout`** — página servidora fina (`metadata: { title: 'Finalizar compra' }`) que renderiza `CheckoutView` (client). Ele mostra: título em pílula neon "FINALIZAR COMPRA"; lista somente-leitura dos itens (miniatura, nome, quantidade, preço); `CouponField`; `CartSummary`; botão "PAGAR COM CARTÃO" (neon, `h-12`, desabilitado enquanto envia) e uma linha "Pagamento seguro no Stripe · ambiente de testes". Carrinho vazio → mensagem + link para `/produtos`. Ao clicar:
  1. `POST /api/orders` com `{ items: cart.items.map(({ productId, quantity, price }) => ({ productId, quantity, unitPrice: price })), couponCode }`;
  2. `201` → `window.location.assign(payment_url)` (mantém o botão desabilitado; **não** limpa o carrinho aqui);
  3. `409` com `code === 'CART_OUTDATED'` → mostra a lista do que mudou ("X saiu de estoque", "Preço de Y mudou para R$ …") em `role="alert"` e aplica `reconcileCart`; o botão volta a funcionar para o usuário revisar e tentar de novo;
  4. `400` (cupom) → erro no campo de cupom e remove o cupom; `401` → `router.replace('/entrar?next=%2Fcheckout')`; demais (`502/503`/rede) → "Não foi possível iniciar o pagamento agora. Tente novamente.".
- [ ] **Step 3: `/checkout/sucesso?order=<id>`** — página servidora com `searchParams` assíncrono; o client `OrderPoller`: ao montar chama `clear()` do carrinho (o usuário só chega aqui depois de pagar); consulta `GET /api/orders/<id>` a cada 2 s, até 10 tentativas, enquanto o status for `PENDING_PAYMENT` ("Confirmando seu pagamento…"); `PAID` → "Pagamento confirmado! Pedido #001" com botões "Ver meus pedidos" e "Continuar comprando"; se esgotar as tentativas → "Recebemos seu pedido; a confirmação pode levar alguns instantes" + link para `/pedidos`. `id` ausente/inválido → mensagem neutra com link para `/pedidos`. Sem `any`; sem `setState` síncrono em efeito (use `.then`).
- [ ] **Step 4: `/checkout/cancelado`** — estático: "Pagamento não concluído", "Seu carrinho foi mantido. Você pode tentar novamente quando quiser.", botões "Voltar ao carrinho" (abre o drawer: link para `/` com o drawer não é trivial; use um botão client que chama `setOpen(true)` e `router.push('/')`) e "Ver meus pedidos".
- [ ] **Step 5: Botão do drawer.** "Finalizar compra" mantém a regra da fase 3 (logado → `/checkout`; deslogado → `/entrar?next=%2Fcheckout`).
- [ ] **Step 6: Verificar e commitar.** vitest/`tsc`/lint/build; `curl`: `/checkout` deslogado → 307 para `/entrar?next=%2Fcheckout`; `/checkout/cancelado` e `/checkout/sucesso?order=x` → 307 (sem sessão). Commit: `feat(app): checkout, success and canceled pages`.

### Task F5: Meus Pedidos e menus

**Files:** Create `src/app/pedidos/page.tsx`, `src/components/orders/{orders-list,order-card}.tsx`; Modify `src/components/auth/user-menu.tsx`, `src/components/layout/mobile-nav.tsx`.

- [ ] **Step 1: `/pedidos`** — página servidora (`metadata: { title: 'Meus pedidos' }`) com `TitlePill` (ícone `ShoppingBasket`, texto "MEUS PEDIDOS") e `OrdersList` (client): busca `GET /api/orders`; estados: carregando (3 `Skeleton` do tamanho do cartão), vazio ("Você ainda não fez nenhum pedido." + link "Ver produtos"), erro (com "Tentar novamente"; `401` → `/entrar?next=%2Fpedidos`).
- [ ] **Step 2: `OrderCard`** fiel ao print `desktop/6-orders.png`: cartão com borda `border-border`, cabeçalho em grade (`md:grid-cols-5`; no mobile empilha em 2 colunas) com "NÚMERO DO PEDIDO" (`#001`), "STATUS" (cor por `statusTone`: success = `text-primary`, warning = amarelo, danger = `text-destructive`), "DATA" (`dd/mm/aa`), "PAGAMENTO" ("Cartão") e o botão "Detalhes do Pedido" (chevron que gira; `aria-expanded`). O primeiro pedido começa aberto. Aberto: itens (miniatura 91 px em `bg-card`, etiqueta "Vendido e entregue por: **Torcida Veste**", nome, "Quantidade: n", à direita o preço unitário em negrito e "De: R$ …" riscado quando houver `originalPrice > unitPrice`), depois Subtotal / Entrega / Descontos / Total (mesmas linhas do `CartSummary`, com Descontos = `order.discount`). Pedido `PENDING_PAYMENT` com `paymentUrl` mostra o botão "Pagar agora" (neon) apontando para o Stripe.
- [ ] **Step 3: Menus.** `UserMenu` (logado): item "Meus pedidos" (`Link` para `/pedidos`) antes de "Sair". `MobileNav`: quando logado, "Meus pedidos" antes de "Sair".
- [ ] **Step 4: Verificar e commitar.** vitest/`tsc`/lint/build. Commit: `feat(app): my orders page and account menu links`.

### Task F6: Verificação ponta a ponta local e visual

**Files:** nenhum (script no scratchpad; correções seguem corrigir → rever → commit).

- [ ] **Step 1: Ambiente.** Postgres Docker no ar; API local (`PORT=3002`) com `STRIPE_SECRET_KEY` de teste e `STRIPE_WEBHOOK_SECRET` locais (se a chave não existir, rode os cenários 1–4 e 7–9 e registre "pagamento real não verificado"); front `rm -rf .next && npm run build && npm run start`.
- [ ] **Step 2: Puppeteer (`puppeteer-core` só no scratchpad, Chrome do sistema, `headless: 'new'`; mobile com `setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 })`).** Cenários, desktop e mobile:
  1. Deslogado, carrinho com 2 itens → "Finalizar compra" → `/entrar?next=%2Fcheckout`; login do demo volta para `/checkout` com os itens e o resumo `R$ 339,80 / 5,00 / − 110,00 / 234,80`.
  2. Cupom `torcida10` no checkout → Total `R$ 211,82`; cupom inválido → erro.
  3. Divergência: com o carrinho aberto, altere o preço de um produto direto no banco (script) e clique "Pagar": aparece a mensagem de preço alterado, o carrinho é reconciliado e o resumo atualiza; restaure o preço original depois.
  4. Produto fora de estoque (altere `stock_status` no banco) → item removido com aviso; restaure.
  5. Sem chave Stripe: "Pagar" mostra a mensagem de erro e o pedido criado fica `CANCELED` (cheque no banco).
  6. Com chave Stripe: "Pagar" navega para `checkout.stripe.com`; capture a URL e o screenshot da página do Stripe (**não digite dados de cartão**); confirme total e descrição dos itens na página.
  7. Webhook assinado local (como na B5) marca esse pedido como `PAID`; abra `/checkout/sucesso?order=<id>` logado e veja "Pagamento confirmado!"; o carrinho foi limpo.
  8. `/pedidos` mostra os pedidos (`#001…`), status `Pago`/`Aguardando pagamento`/`Cancelado`, o primeiro aberto; compare com `Torcida Veste/desktop/6-orders.png` e `mobile/6-orders.png` (abra os screenshots e descreva diferenças); "Pagar agora" aparece só no pendente.
  9. `/pedidos` e `/checkout` deslogados → `/entrar?next=…`; um segundo usuário (cadastro temporário) não vê pedidos do demo e `GET /api/orders/<id do demo>` → 404; sem erros de console/hidratação.
- [ ] **Step 3: Limpeza.** Remova pedidos/usuários de teste do banco local; restaure produtos alterados; encerre os servidores pelo PID; `git status` só com `.DS_Store`, `Torcida Veste/` e os arquivos não rastreados do Neon.
- [ ] **Step 4: Relatório** com evidências e o que **não** foi verificado.

---

## Parte C — Release em produção

### Task R1: Migration, variáveis e webhook

**Depende do usuário** (escritas em produção que o sistema bloqueia para o assistente, e a chave Stripe).

- [ ] **Step 1: Migration no Neon (usuário roda, sem `cd` se o terminal já estiver em `torcida-veste-api`):**
`! DATABASE_URL="$(grep '^DATABASE_URL_UNPOOLED=' .env.local | cut -d= -f2- | tr -d '"')" node node_modules/prisma/build/index.js migrate deploy`
Saída esperada: `Applying migration ..._orders` e `All migrations have been successfully applied`. (Antes, o assistente confirma que a tabela `Order` de produção está vazia: não há pedidos.)
- [ ] **Step 2: Stripe (usuário).** No Dashboard (modo teste): Developers → API keys → copiar a **chave secreta** `sk_test_...`; Developers → Webhooks → Add endpoint `https://torcida-veste-api.vercel.app/payments/webhook`, eventos `checkout.session.completed` e `checkout.session.expired`; copiar o **signing secret** `whsec_...`.
- [ ] **Step 3: Variáveis na Vercel** (sem colar segredos no chat; o usuário roda ou autoriza o assistente a rodar `vercel env add`): `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` (ambas `--sensitive`, `production`) no projeto `torcida-veste-api`. Frete usa o padrão (sem variáveis).
- [ ] **Step 4: Deploy.** API (`torcida-veste-api`): `vercel deploy --prod --yes`; front (`torcida-veste-app`): `rm -rf .next` não é necessário (a Vercel builda do zero) → `vercel deploy --prod --yes`. Confirme `Ready` e os aliases `torcida-veste-api.vercel.app` / `torcida-veste-app.vercel.app`.
- [ ] **Step 5: Smoke em produção.** Cotação (`POST /orders/quote`) com o mockup e com o cupom; `POST /payments/webhook` sem assinatura → 400; `GET /pedidos` e `/checkout` deslogados → 307 para `/entrar`; login do demo + `POST /api/orders` → 201 com `payment_url` do Stripe.

### Task R2: Pagamento de teste ponta a ponta (com o usuário)

- [ ] **Step 1:** o assistente leva a navegação até a página do Stripe (login do demo, carrinho, cupom, "Pagar com cartão") e para.
- [ ] **Step 2:** o **usuário** digita o cartão de teste `4242 4242 4242 4242`, validade futura, CVC `123` e finaliza.
- [ ] **Step 3:** o assistente confirma o retorno em `/checkout/sucesso`, o status `Pago` em `/pedidos` (webhook de produção funcionando), o carrinho limpo e o cancelamento: um segundo pedido, abandonado na página do Stripe (botão "voltar") cai em `/checkout/cancelado` e permanece `Aguardando pagamento` com o botão "Pagar agora".
- [ ] **Step 4:** relatório final da fase com evidências, pendências e a recomendação de rotacionar o secret do Google e os segredos expostos em conversas.

---

## Self-review (spec × plano)

| Requisito (spec 2.3 / 4 / 5) | Task |
|---|---|
| Order com subtotal/shipping/discount/total, `user` relacionado, `coupon_id` opcional, datas `DateTime` | B1 |
| `ORDER_STATUS` com `PENDING_PAYMENT` e `PAID`; `OrderItem.unit_price` | B1 |
| `POST /orders` recalcula tudo no servidor (estoque, cupom, frete) | B2, B3 |
| 409 com itens afetados e o front atualiza o carrinho | B3, F1, F4 |
| Sessão Stripe (centavos, BRL, `metadata.orderId`, URLs do front) | B3, B5 |
| Sem pedido órfão se o Stripe falhar | B3 |
| `GET /orders` e `/orders/:id` só do dono (404 para outro) | B4, B5, F6 |
| Webhook com corpo cru, assinatura, `completed → PAID`, `expired → CANCELED`, idempotente, 400 se assinatura inválida | B4, B5 |
| Validação de cupom para o carrinho | B3 (`/orders/quote`, substitui `/coupon/validate`) |
| Frete como função pura testada | B2 |
| Testes de cálculo, webhook, autorização, divergência | B2–B4, F1 |
| `/pedidos` protegida, `/checkout/sucesso`, `/checkout/cancelado` | F4, F5 |
| Verificação manual: checkout com `4242…`, pedido pago em "Meus Pedidos", comparação com prints | F6, R2 |
| Painel admin, frete por CEP, e-mails transacionais | fora de escopo (spec seção 7) |

**Riscos registrados:** dinheiro continua `Float` no schema (cálculo em centavos mitiga); o repositório de cupom antigo engole erros (a busca por código passa a ser case-insensitive, o resto não foi tocado); `POST /orders/quote` é público e sem rate limit (aceitável em sandbox; rate limiting fica para depois); o Stripe BRL exige valor mínimo da cobrança (R$ 0,50): totais menores falham com 502 e o pedido é cancelado; `expires_at` mínimo de 30 min implica pedidos abandonados ficarem `PENDING_PAYMENT` por ~31 min.
