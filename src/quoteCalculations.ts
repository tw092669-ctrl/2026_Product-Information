import type { QuoteProduct } from './types';

export interface ProductDetailOverride {
  location: string;
  power?: string;
  notes: string;
  notes2?: string;
  priceAdjustment?: number;
  mergeWithNext?: boolean;
}

export type ProductDetailMap = Record<string, ProductDetailOverride>;

export function calculateGroupUnitPrice(group: QuoteProduct[], productDetails: ProductDetailMap = {}): number {
  if (!group.length) return 0;

  const mainProduct = group[0];

  return group.reduce((sum, product) => {
    const quantity = product.id === mainProduct.id ? 1 : product.quantity;
    const adjustment = productDetails[product.id]?.priceAdjustment || 0;
    return sum + (product.price + adjustment) * quantity;
  }, 0);
}

export function calculateProductsTotal(productGroups: QuoteProduct[][], productDetails: ProductDetailMap = {}): number {
  return productGroups.reduce((sum, group) => {
    const unitPrice = calculateGroupUnitPrice(group, productDetails);
    const groupQuantity = group[0]?.quantity ?? 1;
    return sum + unitPrice * groupQuantity;
  }, 0);
}
