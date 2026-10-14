import { PrismaClient, STOCK_STATUS } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
    { id: 'seed-category-camisetas', name: 'camisetas' },
    { id: 'seed-category-conjuntos', name: 'conjuntos' },
    { id: 'seed-category-pro-socks', name: 'pro socks' },
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

const SHIRT = {
    categoryId: 'seed-category-camisetas',
    image: '/products/bayern-shirt.png',
    description:
        'Camisa inspirada no uniforme do Bayern de Munique. Tecido leve e respirável, ideal para torcer nos dias de jogo.',
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
    { id: 'seed-product-01', name: 'Camiseta Bayern de Munique Home 14/15', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-02', name: 'Camiseta Bayern de Munique Away 14/15', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-03', name: 'Camiseta Bayern de Munique Third 14/15', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-04', name: 'Camiseta Bayern de Munique Retrô', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-05', name: 'Camiseta Bayern de Munique Goleiro', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-06', name: 'Camiseta Bayern de Munique Treino', price: 149.9, ...SHIRT },
    { id: 'seed-product-07', name: 'Camiseta Bayern de Munique Torcedor', price: 149.9, ...SHIRT },
    { id: 'seed-product-08', name: 'Camiseta Bayern de Munique Edição Especial', price: 149.9, ...SHIRT },
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

        const imageId = `${product.id}-cover`;
        const imageData = {
            url: product.image,
            key: product.image.replace('/products/', ''),
            is_Cover: true,
            product_id: product.id,
        };

        await prisma.image.upsert({
            where: { id: imageId },
            update: imageData,
            create: { id: imageId, ...imageData },
        });
    }

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
