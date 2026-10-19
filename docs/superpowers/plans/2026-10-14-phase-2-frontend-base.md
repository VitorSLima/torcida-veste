# Torcida Veste — Fase 2: Base do Front-end (Next.js + shadcn)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a vitrine pública do Torcida Veste (home, catálogo, listagens, ofertas, busca e página de produto), fiel aos prints desktop e mobile e consumindo a API NestJS da fase 1. Carrinho, login e pedidos ficam nas fases 3 e 4.

**Architecture:** Next.js (App Router, Server Components) recriado do zero em `torcida-veste-app/`. As páginas públicas buscam dados no servidor via `fetch` tipado para a API (`API_URL`), com revalidação curta. Só os pedaços interativos são Client Components (busca, menu mobile, galeria, quantidade). Tema escuro único com tokens shadcn (verde neon `#41f800`, fundo `#0b0b0b`, cards `#1a1a1a`) e fonte Poppins.

**Tech Stack:** Next.js 16 (App Router, `params`/`searchParams` são Promises), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base Radix) + lucide-react, Vitest.

Spec de origem: `docs/superpowers/specs/2026-10-14-torcida-veste-storefront-design.md` · Fase anterior: `2026-10-14-phase-1-backend.md`

## Convenções

- Todos os comandos usam **Node 24**: prefixar com `PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`. Repo: `/Users/vitorlima/Desktop/projetos e freelances/torcida-veste`. Front: `torcida-veste-app/`.
- O wrapper `rtk` engole a saída de `npx jest/vitest/prisma`. Rodar testes com `node node_modules/vitest/vitest.mjs run` e conferir a linha `Test Files ... passed` (uma suíte que não compila não aparece na contagem de testes).
- Imports com alias `@/` (`src/`). Commits terminam com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (uma linha em branco antes).
- A porta 3000 está ocupada por um `next-server` do usuário. **API local do front: porta 3002** (`PORT=3002 node dist/main` no backend; `API_URL=http://localhost:3002` no front). Front em dev/prod local: porta **3001** (igual ao `FRONTEND_URL` do backend).
- Carrinho (botão do header e "Adicionar ao carrinho"), login (ícone de usuário → `/entrar`) são **renderizados mas ainda não ligados**; a fase 3 os conecta. Isso é intencional e não deve ser "completado" aqui.

## Decisões de design tomadas a partir dos prints

| Observação nos prints | Decisão |
|---|---|
| Catálogo tem 4 coleções: Primeira Linha, Tailandesa, Conjuntos, Pro Socks (categorias) | Seed passa a ter essas 4 categorias (Task 1); front ordena por lista fixa |
| Chips da home: camisetas / conjuntos / pro socks (mobile mostra "Teclados", erro de cópia do design) | Usar "pro socks". "camisetas" leva à busca `camiseta`; os outros à categoria |
| Home desktop mostra Primeira Linha, mobile mostra Tailandesa | Mostrar as duas seções em todos os tamanhos |
| Galeria com 4 miniaturas; estrelas e "(25 avaliações)" | Seed com 4 imagens por produto; estrelas decorativas (spec) |
| Ícones SVG do design têm cores fixas | `lucide-react` onde existir equivalente; SVGs do design (camiseta, cabide, meia, redes sociais) via máscara CSS com `currentColor` |
| Assets: basket 9,4 MB, van 1,7 MB | Redimensionar para 1000 px (`sips`) |

## Estrutura de arquivos

```
torcida-veste-app/
├── .env.example                        # API_URL
├── vitest.config.ts
├── public/{products,brand,icons}/      # imagens do design
└── src/
    ├── app/
    │   ├── layout.tsx                  # fonte, header, footer, metadata
    │   ├── globals.css                 # tokens do tema
    │   ├── page.tsx                    # home
    │   ├── produtos/page.tsx           # catálogo (4 coleções)
    │   ├── produtos/[categoryId]/{page,loading}.tsx
    │   ├── ofertas/{page,loading}.tsx
    │   ├── buscar/{page,loading}.tsx
    │   ├── produto/[id]/{page,loading}.tsx
    │   ├── not-found.tsx
    │   └── error.tsx
    ├── lib/{types,format,products-query,api,categories,quantity}.ts (+ .test.ts)
    └── components/
        ├── ui/                         # shadcn (button, badge, sheet, input, skeleton)
        ├── layout/{site-header,site-footer,search-form,mobile-nav,nav-links}.tsx
        ├── common/{mask-icon,title-pill}.tsx
        ├── home/{hero-banner,promo-banner,free-shipping-banner,category-chips}.tsx
        └── product/{product-card,product-section,product-grid,price,discount-badge,
                     pagination,product-gallery,product-info,quantity-stepper,
                     rating-stars,product-grid-skeleton}.tsx
```

---

### Task 0: Branch e documentação

**Files:** `docs/superpowers/**` (specs e planos, hoje não versionados).

- [ ] **Step 1: Criar a branch a partir do backend e commitar os documentos**

```bash
cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste"
git checkout feat/storefront-backend
git checkout -b feat/storefront-frontend
git add docs
git status --short | grep -v '^??'
git commit -m "docs: add storefront spec and phase 1-2 implementation plans

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: só arquivos de `docs/` staged. `Torcida Veste/` (material de design) e `.DS_Store` seguem fora do commit.

---

### Task 1: Seed v2 (backend): 4 categorias, 19 produtos, 4 imagens por produto

**Files:** Modify (reescrever) `torcida-veste-api/prisma/seed.ts`.

Mapeamento: Primeira Linha = 01, 02 (oferta), 06, 07, 08; Tailandesa = 03, 04, 05 (oferta), 18, 19; Conjuntos = 09, 10 (oferta), 11, 12, 13; Pro Socks = 14, 15 (oferta), 16, 17. Total de ofertas continua 9 (01–05, 09, 10, 14, 15).

- [ ] **Step 1: Reescrever o seed**

`torcida-veste-api/prisma/seed.ts`:
```ts
import { PrismaClient, STOCK_STATUS } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
    { id: 'seed-category-primeira-linha', name: 'Primeira Linha' },
    { id: 'seed-category-tailandesa', name: 'Tailandesa' },
    { id: 'seed-category-conjuntos', name: 'Conjuntos' },
    { id: 'seed-category-pro-socks', name: 'Pro Socks' },
];

const LEAGUE = { id: 'seed-league-bundesliga', name: 'Bundesliga' };

type SeedProduct = {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    categoryId: string;
    image: string;
    description: string;
};

const PRIMEIRA_LINHA = {
    categoryId: 'seed-category-primeira-linha',
    image: '/products/bayern-shirt.png',
    description:
        'Camisa de primeira linha inspirada no uniforme do Bayern de Munique. Acabamento premium, tecido leve e respirável.',
};
const TAILANDESA = {
    categoryId: 'seed-category-tailandesa',
    image: '/products/bayern-shirt.png',
    description:
        'Camisa modelo tailandês, qualidade superior, inspirada no uniforme do Bayern de Munique. Ideal para torcer nos dias de jogo.',
};
const SET = {
    categoryId: 'seed-category-conjuntos',
    image: '/products/conjunto.png',
    description:
        'Conjunto de treino completo (jaqueta e calça) inspirado no Bayern de Munique. Confortável para o dia a dia.',
};
const SOCKS = {
    categoryId: 'seed-category-pro-socks',
    image: '/products/pro-socks.png',
    description:
        'Meiões profissionais com reforço no calcanhar e na sola, para jogar e torcer com conforto.',
};

const PRODUCTS: SeedProduct[] = [
    { id: 'seed-product-01', name: 'Camiseta Bayern de Munique Home 14/15', price: 69.9, originalPrice: 139.9, ...PRIMEIRA_LINHA },
    { id: 'seed-product-02', name: 'Camiseta Bayern de Munique Away 14/15', price: 69.9, originalPrice: 139.9, ...PRIMEIRA_LINHA },
    { id: 'seed-product-06', name: 'Camiseta Bayern de Munique Treino', price: 149.9, ...PRIMEIRA_LINHA },
    { id: 'seed-product-07', name: 'Camiseta Bayern de Munique Torcedor', price: 149.9, ...PRIMEIRA_LINHA },
    { id: 'seed-product-08', name: 'Camiseta Bayern de Munique Edição Especial', price: 149.9, ...PRIMEIRA_LINHA },
    { id: 'seed-product-03', name: 'Camiseta Bayern de Munique Third 14/15', price: 69.9, originalPrice: 139.9, ...TAILANDESA },
    { id: 'seed-product-04', name: 'Camiseta Bayern de Munique Retrô', price: 69.9, originalPrice: 139.9, ...TAILANDESA },
    { id: 'seed-product-05', name: 'Camiseta Bayern de Munique Goleiro', price: 69.9, originalPrice: 139.9, ...TAILANDESA },
    { id: 'seed-product-18', name: 'Camiseta Bayern de Munique Tailandesa Home', price: 149.9, ...TAILANDESA },
    { id: 'seed-product-19', name: 'Camiseta Bayern de Munique Tailandesa Away', price: 149.9, ...TAILANDESA },
    { id: 'seed-product-09', name: 'Conjunto Bayern de Munique Treino', price: 159.9, originalPrice: 199.9, ...SET },
    { id: 'seed-product-10', name: 'Conjunto Bayern de Munique Viagem', price: 159.9, originalPrice: 199.9, ...SET },
    { id: 'seed-product-11', name: 'Conjunto Bayern de Munique Aquecimento', price: 199.9, ...SET },
    { id: 'seed-product-12', name: 'Conjunto Bayern de Munique Inverno', price: 199.9, ...SET },
    { id: 'seed-product-13', name: 'Conjunto Bayern de Munique Casual', price: 199.9, ...SET },
    { id: 'seed-product-14', name: 'Pro Socks Preto', price: 29.9, originalPrice: 39.9, ...SOCKS },
    { id: 'seed-product-15', name: 'Pro Socks Branco', price: 29.9, originalPrice: 39.9, ...SOCKS },
    { id: 'seed-product-16', name: 'Pro Socks Vermelho', price: 39.9, ...SOCKS },
    { id: 'seed-product-17', name: 'Pro Socks Azul', price: 39.9, ...SOCKS },
];

const IMAGES_PER_PRODUCT = 4;

async function seedUsers() {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } =
        process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    }

    await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {},
        create: {
            email: ADMIN_EMAIL,
            password: await bcrypt.hash(ADMIN_PASSWORD, 10),
            role: 'ADMIN',
            firstName: ADMIN_FIRST_NAME ?? 'Admin',
            lastName: ADMIN_LAST_NAME ?? 'Torcida',
            picture: process.env.ADMIN_PICTURE,
        },
    });

    // Conta pública de demonstração para o portfólio (role USER).
    await prisma.user.upsert({
        where: { email: 'demo@torcidaveste.com' },
        update: {},
        create: {
            email: 'demo@torcidaveste.com',
            password: await bcrypt.hash('Demo@1234', 10),
            role: 'USER',
            firstName: 'Demo',
            lastName: 'Torcedor',
        },
    });
}

async function seedCatalog() {
    for (const category of CATEGORIES) {
        await prisma.category.upsert({
            where: { id: category.id },
            update: { name: category.name },
            create: category,
        });
    }

    await prisma.league.upsert({
        where: { id: LEAGUE.id },
        update: { name: LEAGUE.name },
        create: LEAGUE,
    });

    for (const product of PRODUCTS) {
        const data = {
            name: product.name,
            size: 'P/M/G/GG',
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice ?? null,
            stock_status: STOCK_STATUS.IN_STOCK,
            category_id: product.categoryId,
            league_id: LEAGUE.id,
        };

        await prisma.product.upsert({
            where: { id: product.id },
            update: data,
            create: { id: product.id, ...data },
        });

        for (let n = 1; n <= IMAGES_PER_PRODUCT; n++) {
            const imageId = n === 1 ? `${product.id}-cover` : `${product.id}-img-${n}`;
            const imageData = {
                url: product.image,
                key: product.image.replace('/products/', ''),
                is_Cover: n === 1,
                product_id: product.id,
            };

            await prisma.image.upsert({
                where: { id: imageId },
                update: imageData,
                create: { id: imageId, ...imageData },
            });
        }
    }

    // Categoria da versão anterior do seed: remove só se ficou sem produtos.
    await prisma.category.deleteMany({
        where: { id: 'seed-category-camisetas', Products: { none: {} } },
    });

    await prisma.coupon.upsert({
        where: { id: 'seed-coupon-torcida10' },
        update: {},
        create: {
            id: 'seed-coupon-torcida10',
            code: 'TORCIDA10',
            discount_type: 'PERCENTAGE',
            value: 10,
            expiration_at: '2099-12-31T23:59:59.000Z',
        },
    });
}

async function main() {
    await seedUsers();
    await seedCatalog();
    console.log('Seed completed.');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Rodar duas vezes e conferir as contagens**

```bash
cd torcida-veste-api
export PATH="$PWD/node_modules/.bin:$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
node node_modules/prisma/build/index.js db seed
node node_modules/prisma/build/index.js db seed
node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();(async()=>{const cats=await p.category.findMany({select:{name:true,_count:{select:{Products:true}}}});console.log(cats.map(c=>c.name+":"+c._count.Products).join(" | "));console.log("products",await p.product.count(),"images",await p.image.count(),"onSale",await p.product.count({where:{originalPrice:{not:null}}}));await p.$disconnect()})()'
```
Expected: `Seed completed.` duas vezes sem erro; categorias `Primeira Linha:5 | Tailandesa:5 | Conjuntos:5 | Pro Socks:4` (ordem pode variar), **sem** `camisetas`; `products 19 images 76 onSale 9`.

- [ ] **Step 3: Commit**

```bash
git add torcida-veste-api/prisma/seed.ts
git commit -m "feat(seed): four collections, 19 products and 4 images per product

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Recriar o app (Next.js + shadcn + Vitest)

**Files:** remover o esqueleto Next 14 de `torcida-veste-app/` (15 arquivos versionados) e criar o projeto novo; criar `.env.example`, `vitest.config.ts`.

- [ ] **Step 1: Remover o esqueleto antigo**

```bash
cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste"
git rm -r -q torcida-veste-app
rm -rf torcida-veste-app
```
(Era só o boilerplate do `create-next-app`, sem código do usuário; recuperável pelo git.)

- [ ] **Step 2: Criar o projeto com `create-next-app`**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
npx create-next-app@latest --help | head -60
```
Confirmar no `--help` que os flags abaixo existem; se algum nome mudou, usar o equivalente e **registrar a diferença no relatório**:
```bash
npx create-next-app@latest torcida-veste-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```
Expected: pasta `torcida-veste-app/` com `src/app/`, Tailwind v4 (`@import "tailwindcss"` em `src/app/globals.css`), `next` 16.x. Conferir: `grep '"next"' torcida-veste-app/package.json`.

- [ ] **Step 3: Inicializar o shadcn (base Radix) e adicionar componentes**

```bash
cd torcida-veste-app
npx shadcn@latest init --help | head -40
npx shadcn@latest init -b radix -d -y
npx shadcn@latest add button badge sheet input skeleton -y
```
Expected: `components.json`, `src/lib/utils.ts` (`cn`), `src/components/ui/{button,badge,sheet,input,skeleton}.tsx`. Conferir que o `sheet.tsx` importa de `radix-ui` ou `@radix-ui/react-dialog` (base Radix, necessário para `SheetTrigger asChild`). Se o init tiver escolhido outra base, repetir com `--force` e `-b radix`.

- [ ] **Step 4: Scripts, Vitest e variáveis**

```bash
npm install -D vitest
```
Em `package.json`, ajustar `scripts` para (manter os demais):
```json
    "dev": "next dev -p 3001",
    "start": "next start -p 3001",
    "test": "vitest run"
```
Criar `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```
Criar `.env.example`:
```
# URL da API NestJS (usada só no servidor do Next)
API_URL=http://localhost:3002
```
Criar `.env.local` com o mesmo conteúdo (já ignorado pelo `.gitignore` do Next; conferir com `git check-ignore .env.local`).

- [ ] **Step 5: Verificar**

```bash
npm run build
```
Expected: build conclui sem erro (página padrão). `ls src/components/ui` lista os 5 componentes.

- [ ] **Step 6: Commit**

```bash
cd ..
git add torcida-veste-app
git status --short | grep -v '^??' | head
git commit -m "feat(app): recreate frontend with Next 16, Tailwind 4, shadcn and Vitest

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Conferir antes do commit que `.env.local` e `node_modules` **não** estão staged.

---

### Task 3: Assets, tema e fonte

**Files:** Create `public/products/*`, `public/brand/*`, `public/icons/*`; Modify `src/app/globals.css`, `src/app/layout.tsx`.

- [ ] **Step 1: Copiar e otimizar os assets do design**

```bash
cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste"
D="Torcida Veste"; P=torcida-veste-app/public
mkdir -p $P/products $P/brand $P/icons
cp "$D/images/bayern-shirt.png" "$D/images/conjunto.png" "$D/images/pro-socks.png" $P/products/
cp "$D/images/logo.png" $P/brand/logo.png
cp "$D/images/path633.png" $P/brand/brazil-map.png
sips -Z 1000 "$D/images/2c9071ad1dee9d1e6e7209c8ffad472a.png" --out $P/brand/basket.png
sips -Z 1000 "$D/images/pngegg.png" --out $P/brand/van.png
cp "$D/icon/shirt.svg" "$D/icon/sock.svg" "$D/icon/clothes.svg" "$D/icon/facebook.svg" "$D/icon/whatsapp.svg" "$D/icon/instagram.svg" $P/icons/
mv $P/icons/clothes.svg $P/icons/hanger.svg
ls -la $P/products $P/brand $P/icons | awk '{print $5, $9}'
```
Expected: `basket.png` e `van.png` bem abaixo dos originais (idealmente < 1 MB cada). Se `sips` perder a transparência (fundo preto/branco aparecendo), reportar.

- [ ] **Step 2: Tokens do tema (escuro único)**

Em `src/app/globals.css`: **manter** as linhas `@import` e o bloco `@theme inline` gerados pelo shadcn; **substituir** os blocos `:root { ... }` e `.dark { ... }` por um único `:root` escuro abaixo; apagar o bloco `.dark`. No `@theme inline`, garantir `--font-sans: var(--font-poppins);` (editar a linha existente de `--font-sans`, ou adicioná-la).
```css
:root {
    --radius: 0.75rem;
    --background: #0b0b0b;
    --foreground: #ffffff;
    --card: #1a1a1a;
    --card-foreground: #ffffff;
    --popover: #1a1a1a;
    --popover-foreground: #ffffff;
    --primary: #41f800;
    --primary-foreground: #0b0b0b;
    --secondary: #262626;
    --secondary-foreground: #ffffff;
    --muted: #262626;
    --muted-foreground: #9a9a9a;
    --accent: #262626;
    --accent-foreground: #ffffff;
    --destructive: #ff4d4f;
    --border: #3a3a3a;
    --input: #ffffff;
    --ring: #41f800;
}
```
No `@layer base`, garantir `body { @apply bg-background text-foreground; }` (já vem do shadcn).

- [ ] **Step 3: Fonte e layout raiz**

`src/app/layout.tsx` (header e footer entram na Task 5; por ora só fonte/metadata):
```tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
    variable: '--font-poppins',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'Torcida Veste — Artigos esportivos',
        template: '%s | Torcida Veste',
    },
    description:
        'Camisetas, conjuntos e acessórios para torcer com estilo. Projeto de portfólio.',
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" className={poppins.variable}>
            <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
                <main className="flex-1">{children}</main>
            </body>
        </html>
    );
}
```

- [ ] **Step 4: Verificar e commitar**

```bash
cd torcida-veste-app && npm run build
```
Expected: build sem erro. Commit: `git add public src && git commit -m "feat(app): design assets, dark neon theme tokens and Poppins"` (+ trailer).

---

### Task 4: Biblioteca de dados (TDD)

**Files:** Create `src/lib/{types,format,products-query,api,categories,quantity}.ts` e os `.test.ts` correspondentes.

- [ ] **Step 1: Tipos** (`src/lib/types.ts`, sem teste)

```ts
export type ProductImage = { id: string; url: string; is_Cover: boolean };

export type Product = {
    id: string;
    name: string;
    size: string;
    description: string;
    price: number;
    originalPrice: number | null;
    stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
    Category: { id: string; name: string };
    League: { id: string; name: string };
    Images: ProductImage[];
    isOnSale: boolean;
    discountPercent: number | null;
};

export type ListInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type ProductListResponse = { products: Product[]; info: ListInfo };

export type Category = { id: string; name: string };
```

- [ ] **Step 2: Testes de `format` e `quantity`**

`src/lib/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatBRL } from './format';

const plain = (s: string) => s.replace(/ /g, ' ');

describe('formatBRL', () => {
    it('formats with comma decimals', () => {
        expect(plain(formatBRL(69.9))).toBe('R$ 69,90');
    });
    it('uses dot thousands separators', () => {
        expect(plain(formatBRL(1234.5))).toBe('R$ 1.234,50');
    });
    it('formats zero', () => {
        expect(plain(formatBRL(0))).toBe('R$ 0,00');
    });
});
```
`src/lib/quantity.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { clampQuantity, MAX_QUANTITY } from './quantity';

describe('clampQuantity', () => {
    it('keeps values inside the range', () => {
        expect(clampQuantity(3)).toBe(3);
    });
    it('never goes below 1', () => {
        expect(clampQuantity(0)).toBe(1);
        expect(clampQuantity(-4)).toBe(1);
    });
    it('never goes above the maximum', () => {
        expect(clampQuantity(MAX_QUANTITY + 5)).toBe(MAX_QUANTITY);
    });
    it('falls back to 1 for non-numeric input', () => {
        expect(clampQuantity(Number.NaN)).toBe(1);
    });
});
```
Rodar `node node_modules/vitest/vitest.mjs run`; esperado FAIL (módulos ausentes).

- [ ] **Step 3: Implementar `format` e `quantity`**

`src/lib/format.ts`:
```ts
const brl = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export function formatBRL(value: number): string {
    return brl.format(value);
}
```
`src/lib/quantity.ts`:
```ts
export const MAX_QUANTITY = 10;

export function clampQuantity(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(value)));
}
```
Rodar; esperado PASS.

- [ ] **Step 4: Testes de `products-query`**

`src/lib/products-query.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildProductsQuery, pageHref, parsePage } from './products-query';

describe('buildProductsQuery', () => {
    it('returns an empty string when nothing is set', () => {
        expect(buildProductsQuery({})).toBe('');
    });
    it('includes only meaningful params, in a stable order', () => {
        expect(
            buildProductsQuery({ onSale: true, limit: 5, categoryId: 'c1' }),
        ).toBe('?limit=5&onSale=true&categoryId=c1');
    });
    it('omits page 1 and false/blank values', () => {
        expect(buildProductsQuery({ page: 1, onSale: false, search: '  ' })).toBe('');
    });
    it('keeps page > 1 and trims search', () => {
        expect(buildProductsQuery({ page: 3, search: ' camiseta ' })).toBe(
            '?page=3&search=camiseta',
        );
    });
});

describe('parsePage', () => {
    it('parses valid values', () => {
        expect(parsePage('4')).toBe(4);
        expect(parsePage(['2', '9'])).toBe(2);
    });
    it('falls back to 1 for invalid values', () => {
        expect(parsePage(undefined)).toBe(1);
        expect(parsePage('0')).toBe(1);
        expect(parsePage('abc')).toBe(1);
        expect(parsePage('1.5')).toBe(1);
    });
});

describe('pageHref', () => {
    it('omits page for the first page', () => {
        expect(pageHref('/ofertas', {}, 1)).toBe('/ofertas');
    });
    it('keeps extra params and sets the page', () => {
        expect(pageHref('/buscar', { q: 'bayern' }, 2)).toBe('/buscar?q=bayern&page=2');
    });
    it('drops undefined params', () => {
        expect(pageHref('/buscar', { q: undefined }, 3)).toBe('/buscar?page=3');
    });
});
```
Rodar; esperado FAIL.

- [ ] **Step 5: Implementar `products-query`**

`src/lib/products-query.ts`:
```ts
export type ProductsQuery = {
    page?: number;
    limit?: number;
    search?: string;
    onSale?: boolean;
    categoryId?: string;
    leagueId?: string;
};

export function buildProductsQuery(query: ProductsQuery): string {
    const params = new URLSearchParams();

    if (query.page && query.page > 1) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.onSale) params.set('onSale', 'true');
    if (query.categoryId) params.set('categoryId', query.categoryId);
    if (query.leagueId) params.set('leagueId', query.leagueId);

    const serialized = params.toString();
    return serialized ? `?${serialized}` : '';
}

export function parsePage(value: string | string[] | undefined): number {
    const parsed = Number(Array.isArray(value) ? value[0] : value);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function pageHref(
    basePath: string,
    params: Record<string, string | undefined>,
    page: number,
): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
    }
    if (page > 1) search.set('page', String(page));

    const serialized = search.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
}
```
Rodar; esperado PASS.

- [ ] **Step 6: Testes de `categories`**

`src/lib/categories.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { categoryImage, findCategory, sortCategories } from './categories';

const cats = [
    { id: '3', name: 'Pro Socks' },
    { id: '1', name: 'Primeira Linha' },
    { id: '9', name: 'Outra Coisa' },
    { id: '2', name: 'Conjuntos' },
    { id: '4', name: 'Tailandesa' },
];

describe('sortCategories', () => {
    it('orders by the storefront order, unknown ones last', () => {
        expect(sortCategories(cats).map((c) => c.name)).toEqual([
            'Primeira Linha',
            'Tailandesa',
            'Conjuntos',
            'Pro Socks',
            'Outra Coisa',
        ]);
    });
    it('does not mutate the input', () => {
        const copy = [...cats];
        sortCategories(cats);
        expect(cats).toEqual(copy);
    });
});

describe('findCategory', () => {
    it('matches by name ignoring case', () => {
        expect(findCategory(cats, 'conjuntos')?.id).toBe('2');
    });
    it('returns undefined when missing', () => {
        expect(findCategory(cats, 'nope')).toBeUndefined();
    });
});

describe('categoryImage', () => {
    it('maps known categories to product art', () => {
        expect(categoryImage('Conjuntos')).toBe('/products/conjunto.png');
        expect(categoryImage('Pro Socks')).toBe('/products/pro-socks.png');
    });
    it('falls back to the shirt', () => {
        expect(categoryImage('Qualquer')).toBe('/products/bayern-shirt.png');
    });
});
```
- [ ] **Step 7: Implementar `categories`** (rodar o teste antes: FAIL; depois PASS)

`src/lib/categories.ts`:
```ts
import type { Category } from './types';

const ORDER = ['primeira linha', 'tailandesa', 'conjuntos', 'pro socks'];

const IMAGES: Record<string, string> = {
    'primeira linha': '/products/bayern-shirt.png',
    tailandesa: '/products/bayern-shirt.png',
    conjuntos: '/products/conjunto.png',
    'pro socks': '/products/pro-socks.png',
};

const rank = (name: string) => {
    const index = ORDER.indexOf(name.toLowerCase());
    return index === -1 ? ORDER.length : index;
};

export function sortCategories(categories: Category[]): Category[] {
    return [...categories].sort(
        (a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name),
    );
}

export function findCategory(
    categories: Category[],
    name: string,
): Category | undefined {
    return categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

export function categoryImage(name: string): string {
    return IMAGES[name.toLowerCase()] ?? '/products/bayern-shirt.png';
}
```

- [ ] **Step 8: Testes e implementação de `api`**

`src/lib/api.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getCategories, getProduct, getProducts } from './api';

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
    fetchMock.mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    });
}

beforeEach(() => {
    process.env.API_URL = 'http://api.test';
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
});

describe('getProducts', () => {
    it('builds the URL from the query and asks Next to revalidate', async () => {
        respond(200, { products: [], info: { page: 1, limit: 5, total: 0, totalPages: 0 } });

        await getProducts({ onSale: true, limit: 5 });

        expect(fetchMock).toHaveBeenCalledWith(
            'http://api.test/product?limit=5&onSale=true',
            { next: { revalidate: 60 } },
        );
    });

    it('throws ApiError on a non-2xx response', async () => {
        respond(500, {});
        await expect(getProducts()).rejects.toMatchObject({ status: 500 });
    });
});

describe('getProduct', () => {
    it('unwraps { product }', async () => {
        respond(200, { product: { id: 'p1', name: 'X' } });
        await expect(getProduct('p1')).resolves.toMatchObject({ id: 'p1' });
        expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/product/p1');
    });

    it('returns null on 404', async () => {
        respond(404, {});
        await expect(getProduct('nope')).resolves.toBeNull();
    });

    it('rethrows other errors', async () => {
        respond(503, {});
        await expect(getProduct('p1')).rejects.toBeInstanceOf(ApiError);
    });

    it('encodes the id', async () => {
        respond(404, {});
        await getProduct('a/b');
        expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/product/a%2Fb');
    });
});

describe('getCategories', () => {
    it('returns the list with a longer revalidate window', async () => {
        respond(200, [{ id: '1', name: 'Conjuntos' }]);
        await expect(getCategories()).resolves.toEqual([{ id: '1', name: 'Conjuntos' }]);
        expect(fetchMock).toHaveBeenCalledWith('http://api.test/category', {
            next: { revalidate: 300 },
        });
    });
});
```
Rodar; esperado FAIL. Implementar `src/lib/api.ts`:
```ts
import { buildProductsQuery, type ProductsQuery } from './products-query';
import type { Category, Product, ProductListResponse } from './types';

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

const baseUrl = () => process.env.API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, revalidate = 60): Promise<T> {
    const response = await fetch(`${baseUrl()}${path}`, {
        next: { revalidate },
    });

    if (!response.ok) {
        throw new ApiError(response.status, `API ${response.status} on ${path}`);
    }

    return response.json() as Promise<T>;
}

export function getProducts(query: ProductsQuery = {}) {
    return request<ProductListResponse>(`/product${buildProductsQuery(query)}`);
}

export async function getProduct(id: string): Promise<Product | null> {
    try {
        const { product } = await request<{ product: Product }>(
            `/product/${encodeURIComponent(id)}`,
        );
        return product;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }
}

export function getCategories() {
    return request<Category[]>('/category', 300);
}
```
- [ ] **Step 9: Rodar tudo e commitar**

`node node_modules/vitest/vitest.mjs run` → todos os arquivos passam (`Test Files 5 passed`); `npx tsc --noEmit` sem erro. Commit: `feat(app): typed API client and pure helpers with tests`.

---

### Task 5: Shell do layout (header, menu mobile, busca, footer)

**Files:** Create `src/components/common/mask-icon.tsx`, `src/components/layout/{nav-links.ts,search-form.tsx,mobile-nav.tsx,site-header.tsx,site-footer.tsx}`; Modify `src/app/layout.tsx`.

- [ ] **Step 1: `MaskIcon`** (`src/components/common/mask-icon.tsx`) — renderiza SVG do design com `currentColor`:
```tsx
import { cn } from '@/lib/utils';

export function MaskIcon({
    src,
    className,
}: {
    src: string;
    className?: string;
}) {
    const mask = `url(${src})`;

    return (
        <span
            aria-hidden
            className={cn('inline-block size-5 shrink-0 bg-current', className)}
            style={{
                WebkitMaskImage: mask,
                maskImage: mask,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
            }}
        />
    );
}
```
- [ ] **Step 2: Links de navegação** (`src/components/layout/nav-links.ts`)
```ts
export const NAV_LINKS = [
    { href: '/', label: 'Início' },
    { href: '/produtos', label: 'Produtos' },
    { href: '/ofertas', label: 'Ofertas' },
] as const;
```
- [ ] **Step 3: Busca** (`src/components/layout/search-form.tsx`, Client Component)
```tsx
'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchForm({ className }: { className?: string }) {
    const router = useRouter();
    const [term, setTerm] = useState('');

    return (
        <form
            role="search"
            className={cn('relative', className)}
            onSubmit={(event) => {
                event.preventDefault();
                const value = term.trim();
                if (value) router.push(`/buscar?q=${encodeURIComponent(value)}`);
            }}
        >
            <Search
                aria-hidden
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2"
            />
            <Input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="O que você está procurando?"
                aria-label="Buscar produtos"
                className="h-10 rounded-md border-foreground bg-transparent pl-10 text-sm"
            />
        </form>
    );
}
```
- [ ] **Step 4: Menu mobile** (`src/components/layout/mobile-nav.tsx`, Client Component)
```tsx
'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { NAV_LINKS } from './nav-links';

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Abrir menu"
                    className="border-foreground bg-background"
                >
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-border bg-background">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-3 px-4">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="rounded-full border border-foreground px-6 py-3 text-center text-sm font-bold"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
```
- [ ] **Step 5: Header** (`src/components/layout/site-header.tsx`, Server Component). Carrinho e usuário são renderizados, mas só ligados na fase 3:
```tsx
import { ShoppingCart, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';
import { NAV_LINKS } from './nav-links';
import { SearchForm } from './search-form';

export function SiteHeader() {
    return (
        <header className="bg-background">
            <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-4 md:gap-8 md:px-6">
                <div className="md:hidden">
                    <MobileNav />
                </div>

                <Link href="/" aria-label="Torcida Veste, início" className="mx-auto shrink-0 md:mx-0">
                    <Image
                        src="/brand/logo.png"
                        alt="Torcida Veste"
                        width={720}
                        height={153}
                        priority
                        className="h-8 w-auto md:h-11"
                    />
                </Link>

                <div className="hidden flex-1 items-center gap-3 md:flex">
                    <SearchForm className="max-w-[415px] flex-1" />
                    <nav className="flex items-center gap-3" aria-label="Principal">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-full border border-foreground px-7 py-2 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:ml-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Carrinho"
                        className="border-foreground bg-background"
                    >
                        <ShoppingCart />
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="hidden border-foreground bg-background md:inline-flex"
                    >
                        <Link href="/entrar" aria-label="Minha conta">
                            <User />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="px-4 pb-3 md:hidden">
                <SearchForm />
            </div>
        </header>
    );
}
```
- [ ] **Step 6: Footer** (`src/components/layout/site-footer.tsx`)
```tsx
import { MaskIcon } from '@/components/common/mask-icon';

const SOCIALS = [
    { src: '/icons/facebook.svg', label: 'Facebook' },
    { src: '/icons/whatsapp.svg', label: 'WhatsApp' },
    { src: '/icons/instagram.svg', label: 'Instagram' },
];

export function SiteFooter() {
    return (
        <footer className="mt-16 bg-card text-muted-foreground">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 text-sm">
                <p>
                    © Copyright <strong className="text-foreground/80">VL Tech</strong>
                </p>
                <ul className="flex items-center gap-3">
                    {SOCIALS.map((social) => (
                        <li key={social.label} title={social.label}>
                            <MaskIcon src={social.src} className="size-6" />
                            <span className="sr-only">{social.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </footer>
    );
}
```
- [ ] **Step 7: Plugar no layout raiz** — em `src/app/layout.tsx`, importar `SiteHeader` e `SiteFooter` e trocar o conteúdo do `<body>` por:
```tsx
<SiteHeader />
<main className="flex-1">{children}</main>
<SiteFooter />
```
- [ ] **Step 8: Verificar e commitar** — `npm run build` e `npx tsc --noEmit` sem erro; `npm run lint` sem erros. Commit: `feat(app): site header, mobile menu, search and footer`.

---

### Task 6: Componentes de produto

**Files:** Create `src/components/common/title-pill.tsx`; `src/components/product/{discount-badge,price,product-card,product-section,product-grid,pagination,product-grid-skeleton}.tsx`.

- [ ] **Step 1: `TitlePill`** (pílula de título com borda neon, usada em Catálogo/Ofertas/categorias)
```tsx
import type { ReactNode } from 'react';

export function TitlePill({
    icon,
    children,
}: {
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <h1 className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2 text-base font-extrabold uppercase">
            {icon}
            {children}
        </h1>
    );
}
```
- [ ] **Step 2: `DiscountBadge` e `Price`**

`src/components/product/discount-badge.tsx`:
```tsx
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DiscountBadge({
    percent,
    className,
}: {
    percent: number;
    className?: string;
}) {
    return (
        <Badge
            aria-label={`${percent}% de desconto`}
            className={cn(
                'gap-0.5 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground',
                className,
            )}
        >
            <ChevronDown aria-hidden className="size-3.5" />
            {percent}%
        </Badge>
    );
}
```
`src/components/product/price.tsx`:
```tsx
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Price({
    price,
    originalPrice,
    className,
}: {
    price: number;
    originalPrice: number | null;
    className?: string;
}) {
    const onSale = originalPrice != null && originalPrice > price;

    return (
        <p className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
            <span className="text-lg font-bold">{formatBRL(price)}</span>
            {onSale && (
                <span className="text-xs text-muted-foreground line-through">
                    {formatBRL(originalPrice)}
                </span>
            )}
        </p>
    );
}
```
- [ ] **Step 3: `ProductCard`**
```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { DiscountBadge } from './discount-badge';
import { Price } from './price';

export function ProductCard({ product }: { product: Product }) {
    const cover = product.Images.find((image) => image.is_Cover) ?? product.Images[0];

    return (
        <Link
            href={`/produto/${product.id}`}
            className="group relative flex h-full flex-col rounded-xl bg-card p-2 outline-none transition-shadow hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
        >
            {product.discountPercent ? (
                <DiscountBadge
                    percent={product.discountPercent}
                    className="absolute left-3 top-3 z-10"
                />
            ) : null}

            <div className="relative aspect-square">
                {cover && (
                    <Image
                        src={cover.url}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 20vw, 50vw"
                        className="object-contain p-4 transition-transform group-hover:scale-105"
                    />
                )}
            </div>

            <div className="px-1 pb-2 pt-3">
                <h3 className="line-clamp-2 min-h-10 text-sm">{product.name}</h3>
                <Price price={product.price} originalPrice={product.originalPrice} />
            </div>
        </Link>
    );
}
```
- [ ] **Step 4: `ProductSection`** (carrossel com *snap* no mobile, grade de 5 colunas no desktop)
```tsx
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductSection({
    title,
    products,
    href,
}: {
    title: string;
    products: Product[];
    href?: string;
}) {
    if (products.length === 0) return null;

    return (
        <section aria-label={title}>
            <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold uppercase">{title}</h2>
                {href && (
                    <Link href={href} className="text-sm text-primary hover:underline">
                        Ver todos
                    </Link>
                )}
            </div>
            <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:overflow-visible md:px-0">
                {products.map((product) => (
                    <li key={product.id} className="w-[44%] shrink-0 snap-start md:w-auto">
                        <ProductCard product={product} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
```
- [ ] **Step 5: `ProductGrid`, `Pagination` e esqueleto**

`src/components/product/product-grid.tsx`:
```tsx
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: Product[] }) {
    return (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard product={product} />
                </li>
            ))}
        </ul>
    );
}
```
`src/components/product/pagination.tsx`:
```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { pageHref } from '@/lib/products-query';

export function Pagination({
    page,
    totalPages,
    basePath,
    params = {},
}: {
    page: number;
    totalPages: number;
    basePath: string;
    params?: Record<string, string | undefined>;
}) {
    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-4">
            {page > 1 ? (
                <Button asChild variant="outline" className="border-foreground bg-transparent">
                    <Link href={pageHref(basePath, params, page - 1)}>Anterior</Link>
                </Button>
            ) : (
                <Button variant="outline" disabled className="bg-transparent">
                    Anterior
                </Button>
            )}
            <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
            </span>
            {page < totalPages ? (
                <Button asChild variant="outline" className="border-foreground bg-transparent">
                    <Link href={pageHref(basePath, params, page + 1)}>Próxima</Link>
                </Button>
            ) : (
                <Button variant="outline" disabled className="bg-transparent">
                    Próxima
                </Button>
            )}
        </nav>
    );
}
```
`src/components/product/product-grid-skeleton.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <ul
            aria-hidden
            className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-5"
        >
            {Array.from({ length: count }, (_, index) => (
                <li key={index}>
                    <Skeleton className="aspect-[4/5] w-full rounded-xl bg-card" />
                </li>
            ))}
        </ul>
    );
}
```
- [ ] **Step 6: Verificar e commitar** — `npx tsc --noEmit` e `npm run lint` limpos. Commit: `feat(app): product card, section, grid, pagination and badges`.

---

### Task 7: Home

**Files:** Create `src/components/home/{hero-banner,promo-banner,free-shipping-banner,category-chips}.tsx`; Modify `src/app/page.tsx`.

- [ ] **Step 1: `HeroBanner`**
```tsx
import Image from 'next/image';

export function HeroBanner() {
    return (
        <section className="bg-gradient-to-r from-[#1b5108] to-[#11280a]">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-center gap-4 px-6 py-8 md:justify-between md:px-16 md:py-10">
                <h1 className="hidden text-5xl font-extrabold leading-tight md:block lg:text-6xl">
                    Ofertas
                    <br />
                    Imperdíveis!
                </h1>
                <Image
                    src="/brand/basket.png"
                    alt=""
                    width={1000}
                    height={1000}
                    priority
                    className="w-28 md:w-64"
                />
                <p className="text-lg leading-tight md:text-xl">
                    até{' '}
                    <span className="text-5xl font-extrabold md:text-7xl">55%</span>
                    <span className="hidden md:inline"> de</span>
                    <br />
                    <strong className="text-3xl font-extrabold md:text-5xl">Desconto</strong>
                    <br />
                    só esse mês
                </p>
            </div>
        </section>
    );
}
```
- [ ] **Step 2: `PromoBanner`** (usado para "50% OFF camisetas" e "20% OFF conjuntos")
```tsx
import Image from 'next/image';
import Link from 'next/link';

export function PromoBanner({
    value,
    label,
    image,
    href,
}: {
    value: string;
    label: string;
    image: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-around gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#1b5108] to-[#11280a] p-6 outline-none transition-shadow hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
            <p className="leading-none">
                <span className="text-sm">até</span>{' '}
                <span className="text-5xl font-extrabold italic text-primary md:text-6xl">
                    {value}
                </span>
                <br />
                <span className="text-5xl font-extrabold italic text-primary md:text-6xl">
                    OFF
                </span>{' '}
                <span className="text-sm italic">em</span>
                <br />
                <span className="text-xl italic md:text-2xl">{label}</span>
            </p>
            <Image
                src={image}
                alt=""
                width={400}
                height={400}
                className="h-28 w-auto object-contain md:h-40"
            />
        </Link>
    );
}
```
- [ ] **Step 3: `FreeShippingBanner`**
```tsx
import Image from 'next/image';

export function FreeShippingBanner() {
    return (
        <section
            aria-label="Entrega grátis"
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1b5108] to-[#11280a] px-6 py-8 md:px-16"
        >
            <Image
                src="/brand/brazil-map.png"
                alt=""
                width={201}
                height={180}
                className="pointer-events-none absolute left-[10%] top-1/2 hidden h-56 w-auto -translate-y-1/2 opacity-40 md:block"
            />
            <div className="relative flex items-center justify-center gap-6 md:gap-16">
                <div className="text-center">
                    <p className="text-3xl font-extrabold leading-tight md:text-4xl">
                        Entrega
                        <br />
                        <span className="text-4xl md:text-5xl">Grátis</span>
                    </p>
                    <p className="mt-2 inline-block rounded-full border border-primary px-4 py-0.5 text-xs font-bold">
                        Ou retirada em loja!
                    </p>
                </div>
                <Image
                    src="/brand/van.png"
                    alt=""
                    width={1000}
                    height={574}
                    className="w-40 md:w-72"
                />
            </div>
        </section>
    );
}
```
- [ ] **Step 4: `CategoryChips`**
```tsx
import { Shirt } from 'lucide-react';
import Link from 'next/link';
import { MaskIcon } from '@/components/common/mask-icon';
import type { Category } from '@/lib/types';

export function CategoryChips({
    conjuntos,
    proSocks,
}: {
    conjuntos?: Category;
    proSocks?: Category;
}) {
    const chip =
        'inline-flex items-center gap-2 rounded-full border border-foreground bg-background px-5 py-2 text-sm font-bold transition-colors hover:border-primary hover:text-primary';

    return (
        <nav aria-label="Categorias" className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/buscar?q=camiseta" className={chip}>
                <Shirt aria-hidden className="size-5" />
                camisetas
            </Link>
            <Link href={conjuntos ? `/produtos/${conjuntos.id}` : '/produtos'} className={chip}>
                <MaskIcon src="/icons/hanger.svg" />
                conjuntos
            </Link>
            <Link href={proSocks ? `/produtos/${proSocks.id}` : '/produtos'} className={chip}>
                <MaskIcon src="/icons/sock.svg" />
                pro socks
            </Link>
        </nav>
    );
}
```
- [ ] **Step 5: Página inicial** (`src/app/page.tsx`)
```tsx
import { CategoryChips } from '@/components/home/category-chips';
import { FreeShippingBanner } from '@/components/home/free-shipping-banner';
import { HeroBanner } from '@/components/home/hero-banner';
import { PromoBanner } from '@/components/home/promo-banner';
import { ProductSection } from '@/components/product/product-section';
import { getCategories, getProducts } from '@/lib/api';
import { findCategory } from '@/lib/categories';

async function productsOf(categoryId?: string) {
    if (!categoryId) return [];
    const { products } = await getProducts({ categoryId, limit: 5 });
    return products;
}

export default async function HomePage() {
    const [categories, offers] = await Promise.all([
        getCategories(),
        getProducts({ onSale: true, limit: 5 }),
    ]);

    const primeiraLinha = findCategory(categories, 'Primeira Linha');
    const tailandesa = findCategory(categories, 'Tailandesa');
    const conjuntos = findCategory(categories, 'Conjuntos');
    const proSocks = findCategory(categories, 'Pro Socks');

    const [primeiraLinhaProducts, tailandesaProducts, conjuntosProducts] =
        await Promise.all([
            productsOf(primeiraLinha?.id),
            productsOf(tailandesa?.id),
            productsOf(conjuntos?.id),
        ]);

    return (
        <>
            <HeroBanner />
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 py-8 md:px-10 md:py-10">
                <CategoryChips conjuntos={conjuntos} proSocks={proSocks} />

                <ProductSection title="Ofertas" products={offers.products} href="/ofertas" />

                <div className="grid gap-4 md:grid-cols-2 md:gap-8">
                    <PromoBanner
                        value="50%"
                        label="camisetas"
                        image="/products/bayern-shirt.png"
                        href="/ofertas"
                    />
                    <PromoBanner
                        value="20%"
                        label="conjuntos"
                        image="/products/conjunto.png"
                        href={conjuntos ? `/produtos/${conjuntos.id}` : '/produtos'}
                    />
                </div>

                <ProductSection
                    title="Primeira Linha"
                    products={primeiraLinhaProducts}
                    href={primeiraLinha ? `/produtos/${primeiraLinha.id}` : undefined}
                />
                <ProductSection
                    title="Tailandesa"
                    products={tailandesaProducts}
                    href={tailandesa ? `/produtos/${tailandesa.id}` : undefined}
                />

                <FreeShippingBanner />

                <ProductSection
                    title="Conjuntos"
                    products={conjuntosProducts}
                    href={conjuntos ? `/produtos/${conjuntos.id}` : undefined}
                />
            </div>
        </>
    );
}
```
- [ ] **Step 6: Verificar e commitar** — `npx tsc --noEmit` e `npm run lint` limpos (a verificação visual real fica na Task 11, com a API no ar). Commit: `feat(app): home page`.

---

### Task 8: Catálogo, categorias, ofertas e busca

**Files:** Create `src/app/produtos/page.tsx`, `src/app/produtos/[categoryId]/{page,loading}.tsx`, `src/app/ofertas/{page,loading}.tsx`, `src/app/buscar/{page,loading}.tsx`.

- [ ] **Step 1: Catálogo (`/produtos`)**
```tsx
import { LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { TitlePill } from '@/components/common/title-pill';
import { getCategories } from '@/lib/api';
import { categoryImage, sortCategories } from '@/lib/categories';

export const metadata = { title: 'Catálogo' };

export default async function CatalogPage() {
    const categories = sortCategories(await getCategories());

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<LayoutGrid aria-hidden className="size-5" />}>
                Catálogo
            </TitlePill>

            <ul className="mx-auto mt-8 grid max-w-[830px] gap-6 md:grid-cols-2 md:gap-10">
                {categories.map((category) => (
                    <li key={category.id}>
                        <Link
                            href={`/produtos/${category.id}`}
                            className="group block overflow-hidden rounded-xl bg-card outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <div className="flex h-44 items-center justify-center bg-gradient-to-r from-[#1b5108] to-primary md:h-48">
                                <Image
                                    src={categoryImage(category.name)}
                                    alt=""
                                    width={300}
                                    height={300}
                                    className="h-36 w-auto object-contain transition-transform group-hover:scale-105 md:h-40"
                                />
                            </div>
                            <p className="py-5 text-center font-bold">{category.name}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```
- [ ] **Step 2: Categoria (`/produtos/[categoryId]`)**

`page.tsx`:
```tsx
import { LayoutGrid } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TitlePill } from '@/components/common/title-pill';
import { Pagination } from '@/components/product/pagination';
import { ProductGrid } from '@/components/product/product-grid';
import { getCategories, getProducts } from '@/lib/api';
import { parsePage } from '@/lib/products-query';

type Props = {
    params: Promise<{ categoryId: string }>;
    searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { categoryId } = await params;
    const category = (await getCategories()).find((c) => c.id === categoryId);
    return { title: category?.name ?? 'Categoria' };
}

export default async function CategoryPage({ params, searchParams }: Props) {
    const { categoryId } = await params;
    const page = parsePage((await searchParams).page);

    const [categories, list] = await Promise.all([
        getCategories(),
        getProducts({ categoryId, page, limit: 10 }),
    ]);
    const category = categories.find((c) => c.id === categoryId);

    if (!category) notFound();

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<LayoutGrid aria-hidden className="size-5" />}>
                {category.name}
            </TitlePill>
            <div className="mt-6">
                {list.products.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum produto nesta categoria ainda.</p>
                ) : (
                    <ProductGrid products={list.products} />
                )}
                <Pagination
                    page={list.info.page}
                    totalPages={list.info.totalPages}
                    basePath={`/produtos/${categoryId}`}
                />
            </div>
        </div>
    );
}
```
`loading.tsx` (mesmo conteúdo nas rotas `produtos/[categoryId]`, `ofertas` e `buscar`):
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGridSkeleton } from '@/components/product/product-grid-skeleton';

export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <Skeleton className="h-11 w-44 rounded-full bg-card" />
            <div className="mt-6">
                <ProductGridSkeleton />
            </div>
        </div>
    );
}
```
- [ ] **Step 3: Ofertas (`/ofertas`)** — `src/app/ofertas/page.tsx`:
```tsx
import { Tag } from 'lucide-react';
import { TitlePill } from '@/components/common/title-pill';
import { Pagination } from '@/components/product/pagination';
import { ProductGrid } from '@/components/product/product-grid';
import { getProducts } from '@/lib/api';
import { parsePage } from '@/lib/products-query';

export const metadata = { title: 'Ofertas' };

export default async function OffersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const page = parsePage((await searchParams).page);
    const list = await getProducts({ onSale: true, page, limit: 10 });

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<Tag aria-hidden className="size-5" />}>Ofertas</TitlePill>
            <div className="mt-6">
                {list.products.length === 0 ? (
                    <p className="text-muted-foreground">Nenhuma oferta no momento.</p>
                ) : (
                    <ProductGrid products={list.products} />
                )}
                <Pagination
                    page={list.info.page}
                    totalPages={list.info.totalPages}
                    basePath="/ofertas"
                />
            </div>
        </div>
    );
}
```
- [ ] **Step 4: Busca (`/buscar?q=`)** — `src/app/buscar/page.tsx`:
```tsx
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { TitlePill } from '@/components/common/title-pill';
import { Pagination } from '@/components/product/pagination';
import { ProductGrid } from '@/components/product/product-grid';
import { getProducts } from '@/lib/api';
import { parsePage } from '@/lib/products-query';

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { q } = await searchParams;
    return { title: q ? `Busca: ${q}` : 'Busca' };
}

export default async function SearchPage({ searchParams }: Props) {
    const { q, page: rawPage } = await searchParams;
    const term = q?.trim() ?? '';
    const page = parsePage(rawPage);
    const list = term ? await getProducts({ search: term, page, limit: 10 }) : null;

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<Search aria-hidden className="size-5" />}>
                {term ? `Resultados para “${term}”` : 'Busca'}
            </TitlePill>
            <div className="mt-6">
                {!list ? (
                    <p className="text-muted-foreground">Digite o que você procura na barra de busca.</p>
                ) : list.products.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum produto encontrado para “{term}”.</p>
                ) : (
                    <ProductGrid products={list.products} />
                )}
                {list && (
                    <Pagination
                        page={list.info.page}
                        totalPages={list.info.totalPages}
                        basePath="/buscar"
                        params={{ q: term }}
                    />
                )}
            </div>
        </div>
    );
}
```
- [ ] **Step 5: Verificar e commitar** — `npx tsc --noEmit` e `npm run lint` limpos. Commit: `feat(app): catalog, category, offers and search pages`.

---

### Task 9: Página de produto

**Files:** Create `src/components/product/{rating-stars,quantity-stepper,product-gallery,product-info}.tsx`, `src/app/produto/[id]/{page,loading}.tsx`.

- [ ] **Step 1: `RatingStars`** (decorativo, conforme a spec)
```tsx
import { Star } from 'lucide-react';

// Decorativo: o projeto não tem avaliações reais (spec: estrelas só do layout).
export function RatingStars() {
    return (
        <p aria-hidden className="flex items-center gap-1 text-sm text-muted-foreground">
            {[0, 1, 2, 3, 4].map((index) => (
                <Star
                    key={index}
                    className={index < 4 ? 'size-4 fill-primary text-primary' : 'size-4 text-primary'}
                />
            ))}
            <span className="ml-1">(25 avaliações)</span>
        </p>
    );
}
```
- [ ] **Step 2: `QuantityStepper`** (Client)
```tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clampQuantity, MAX_QUANTITY } from '@/lib/quantity';

export function QuantityStepper({
    value,
    onChange,
}: {
    value: number;
    onChange: (next: number) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Diminuir quantidade"
                disabled={value <= 1}
                onClick={() => onChange(clampQuantity(value - 1))}
                className="border-foreground bg-transparent"
            >
                <ChevronLeft />
            </Button>
            <output aria-live="polite" className="w-6 text-center text-sm">
                {value}
            </output>
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Aumentar quantidade"
                disabled={value >= MAX_QUANTITY}
                onClick={() => onChange(clampQuantity(value + 1))}
                className="border-foreground bg-transparent"
            >
                <ChevronRight />
            </Button>
        </div>
    );
}
```
- [ ] **Step 3: `ProductGallery`** (Client; miniaturas só se houver mais de uma imagem)
```tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProductGallery({
    images,
    name,
}: {
    images: ProductImage[];
    name: string;
}) {
    const [selected, setSelected] = useState(0);
    const current = images[selected] ?? images[0];

    if (!current) {
        return <div className="aspect-square rounded-xl bg-card" />;
    }

    return (
        <div className="flex flex-col-reverse gap-4 rounded-xl bg-card p-4 md:flex-row md:gap-6 md:p-10">
            {images.length > 1 && (
                <ul className="flex gap-3 md:flex-col">
                    {images.map((image, index) => (
                        <li key={image.id}>
                            <button
                                type="button"
                                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                                aria-pressed={index === selected}
                                onClick={() => setSelected(index)}
                                className={cn(
                                    'relative size-16 overflow-hidden rounded-lg border-2 bg-background outline-none md:size-[77px]',
                                    index === selected ? 'border-primary' : 'border-transparent',
                                    'focus-visible:ring-2 focus-visible:ring-primary',
                                )}
                            >
                                <Image
                                    src={image.url}
                                    alt=""
                                    fill
                                    sizes="80px"
                                    className="object-contain p-1.5"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="relative aspect-square flex-1">
                <Image
                    src={current.url}
                    alt={name}
                    fill
                    priority
                    sizes="(min-width: 768px) 45vw, 90vw"
                    className="object-contain"
                />
            </div>
        </div>
    );
}
```
- [ ] **Step 4: `ProductInfo`** (Client; o botão "Adicionar ao carrinho" é ligado na fase 3)
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { DiscountBadge } from './discount-badge';
import { QuantityStepper } from './quantity-stepper';
import { RatingStars } from './rating-stars';
import { formatBRL } from '@/lib/format';

export function ProductInfo({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1);
    const inStock = product.stock_status === 'IN_STOCK';

    return (
        <div className="flex flex-col gap-5 rounded-xl bg-card p-6 md:p-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-normal md:text-3xl">{product.name}</h1>
                <p className={inStock ? 'text-sm text-primary' : 'text-sm text-muted-foreground'}>
                    {inStock ? 'Disponível em estoque' : 'Indisponível no momento'}
                </p>
                <RatingStars />
            </div>

            <div className="mt-4 space-y-1">
                <p className="flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-bold">{formatBRL(product.price)}</span>
                    {product.discountPercent ? (
                        <DiscountBadge percent={product.discountPercent} className="text-sm" />
                    ) : null}
                </p>
                {product.isOnSale && product.originalPrice != null && (
                    <p className="text-sm text-muted-foreground">
                        De: <span className="line-through">{formatBRL(product.originalPrice)}</span>
                    </p>
                )}
            </div>

            <QuantityStepper value={quantity} onChange={setQuantity} />

            <section className="mt-4">
                <h2 className="mb-2 font-bold">Descrição</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">Tamanhos: {product.size}</p>
            </section>

            <Button
                type="button"
                size="lg"
                disabled={!inStock}
                className="mt-4 h-12 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
            >
                Adicionar ao carrinho
            </Button>
        </div>
    );
}
```
- [ ] **Step 5: Página (`/produto/[id]`)**

`src/app/produto/[id]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';
import { getProduct } from '@/lib/api';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);
    return { title: product?.name ?? 'Produto' };
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) notFound();

    return (
        <div className="mx-auto grid w-full max-w-[1300px] items-start gap-6 px-4 py-6 md:grid-cols-[1.5fr_1fr] md:px-10 md:py-12">
            <ProductGallery images={product.Images} name={product.name} />
            <ProductInfo product={product} />
        </div>
    );
}
```
`src/app/produto/[id]/loading.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="mx-auto grid w-full max-w-[1300px] gap-6 px-4 py-6 md:grid-cols-[1.5fr_1fr] md:px-10 md:py-12">
            <Skeleton className="aspect-square rounded-xl bg-card md:aspect-[4/3]" />
            <Skeleton className="h-96 rounded-xl bg-card" />
        </div>
    );
}
```
- [ ] **Step 6: Verificar e commitar** — `npx tsc --noEmit` e `npm run lint` limpos. Commit: `feat(app): product page with gallery, price and quantity`.

---

### Task 10: Estados de erro e 404

**Files:** Create `src/app/not-found.tsx`, `src/app/error.tsx`.

- [ ] **Step 1: `not-found.tsx`**
```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
            <p className="text-6xl font-extrabold text-primary">404</p>
            <h1 className="text-xl font-bold">Página não encontrada</h1>
            <p className="text-sm text-muted-foreground">
                O endereço não existe ou o produto saiu do catálogo.
            </p>
            <Button asChild className="bg-primary font-bold text-primary-foreground">
                <Link href="/">Voltar ao início</Link>
            </Button>
        </div>
    );
}
```
- [ ] **Step 2: `error.tsx`** (Client Component obrigatório; cobre API fora do ar)
```tsx
'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
            <h1 className="text-xl font-bold">Não foi possível carregar a loja</h1>
            <p className="text-sm text-muted-foreground">
                Verifique sua conexão e tente de novo em instantes.
            </p>
            <Button
                onClick={reset}
                className="bg-primary font-bold text-primary-foreground"
            >
                Tentar novamente
            </Button>
        </div>
    );
}
```
- [ ] **Step 3: Commit** — `feat(app): not-found and error states`.

---

### Task 11: Verificação ponta a ponta (build, testes e comparação visual)

**Files:** nenhum (só verificação; correções visuais seguem o ciclo corrigir → rever → commit).

- [ ] **Step 1: Suíte e build do front**

```bash
cd torcida-veste-app
export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
node node_modules/vitest/vitest.mjs run
npx tsc --noEmit
npm run lint
npm run build
```
Expected: `Test Files 5 passed`, tipos e lint limpos, build lista as rotas `/`, `/produtos`, `/produtos/[categoryId]`, `/ofertas`, `/buscar`, `/produto/[id]`.

- [ ] **Step 2: Subir API e front**

```bash
cd ../torcida-veste-api && node node_modules/.bin/nest build
(PORT=3002 node dist/main > /tmp/claude-501/api-3002.log 2>&1 &)
cd ../torcida-veste-app && (npm run start > /tmp/claude-501/app-3001.log 2>&1 &)
sleep 8
curl -s -o /dev/null -w "api %{http_code}\n" "localhost:3002/product?limit=1"
curl -s -o /dev/null -w "app %{http_code}\n" localhost:3001/
for p in produtos ofertas "buscar?q=bayern" ; do curl -s -o /dev/null -w "/$p %{http_code}\n" "localhost:3001/$p"; done
```
Expected: todos `200`. Pegar um id de produto e de categoria: `curl -s localhost:3002/category` e `curl -s "localhost:3002/product?limit=1"`; testar `/produtos/<categoryId>` e `/produto/<id>` (200) e `/produto/inexistente` (404).

- [ ] **Step 3: Comparação visual no navegador**

Carregar as ferramentas do navegador numa única chamada: `ToolSearch` com `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__resize_window,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests`. Chamar `tabs_context_mcp` primeiro e criar uma aba nova.

Para cada tela, tirar screenshot e comparar com o print correspondente em `Torcida Veste/desktop|mobile/`:

| Rota | Print desktop | Print mobile |
|---|---|---|
| `/` | `1-home.png` | `mobile/1-home.png` |
| `/produtos` | `2-sales.png` | `mobile/2-sales.png` |
| `/produtos/<Tailandesa>` | `3-products.png` | `mobile/3-products.png` |
| `/produto/seed-product-01` | `4-product-id.png` | `mobile/4-product-id.png` |

Desktop com a janela em 1440 px de largura; mobile em 390 px (`resize_window`). Conferir em cada uma: cores (fundo, cards, neon), tipografia Poppins, pílulas do header, selos `-50%`, preços riscados, galeria com 4 miniaturas, carrossel horizontal no mobile e grade de 5 colunas no desktop, rodapé. Interações: busca "bayern" leva a `/buscar?q=bayern`; menu hambúrguer abre no mobile; seletor de quantidade respeita 1–10; clique numa miniatura troca a imagem principal; "Anterior/Próxima" aparece em `/ofertas` (9 ofertas, limite 10: sem paginação; validar paginação em `/buscar?q=Camiseta`, que tem 10+ resultados).

Ler o console (`read_console_messages`, padrão `error|warn`) e as requisições (`read_network_requests`): nenhuma imagem `/products/*` ou `/brand/*` com 404 e nenhum erro de hidratação.

Qualquer diferença visual relevante: corrigir no componente, repetir a captura e fazer commit `fix(app): <ajuste>`. Diferenças aceitas (já decididas na tabela de decisões) não são defeitos.

- [ ] **Step 4: Encerrar processos e limpar**

```bash
pkill -f "node dist/main"; pkill -f "next start"
lsof -iTCP:3001 -sTCP:LISTEN | wc -l; lsof -iTCP:3002 -sTCP:LISTEN | wc -l
git status --short | grep -v '^??'
```
Expected: `0` e `0` (não encerrar o `next-server` do usuário na porta 3000); árvore limpa.

- [ ] **Step 5: Relatório**

Resumir ao usuário, com evidência: testes/build/lint, rotas verificadas e screenshots comparados (o que ficou idêntico, o que difere e por quê), e o que a fase 3 liga (carrinho, login, "Adicionar ao carrinho", ícone de usuário → `/entrar`, retorno do Google em `/auth/google/callback`).

---

## Self-review (spec × plano)

| Requisito da spec (seção 3) | Task |
|---|---|
| Next atual, App Router, TypeScript, Tailwind, shadcn, tema escuro verde neon, Poppins | 2, 3 |
| Server Components nas páginas públicas | 7–9 |
| `/` home (banner, atalhos, Ofertas, Primeira Linha, Conjuntos, banners) | 7 (+ Tailandesa) |
| `/produtos` e `/ofertas` com filtros, busca, paginação | 8 |
| `/produto/[id]` (galeria, De/Por, quantidade, descrição, comprar) | 9 |
| Responsivo conforme prints, menu hambúrguer no mobile | 5, 7, 11 |
| Busca no header | 5, 8 |
| Estados de erro/vazio, 404 | 8, 10 |
| Testes de lógica pura | 4 |
| Verificação no navegador contra os prints | 11 |
| Carrinho, login/cadastro/Google, `/pedidos`, checkout | **Fase 3 e 4** |
| README com prints, deploy Vercel, `engines`/`postinstall` do backend | **Fase 5** |
