export function withDiscount<
    T extends { price: number; originalPrice?: number | null },
>(product: T) {
    const { price, originalPrice } = product;
    const isOnSale = originalPrice != null && originalPrice > price;
    const discountPercent = isOnSale
        ? Math.round((1 - price / originalPrice) * 100)
        : null;

    return { ...product, isOnSale, discountPercent };
}
