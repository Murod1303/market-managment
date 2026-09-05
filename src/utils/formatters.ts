import { Product } from '../types';

export function formatSom(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0 so'm";
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} so'm`;
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function calculateProductMetrics(product: {
  quantity: number;
  unitCost: number;
  markupPercent: number;
}) {
  const quantity = Math.max(0, Number(product.quantity) || 0);
  const unitCost = Math.max(0, Number(product.unitCost) || 0);
  const markupPercent = Number(product.markupPercent) || 0;

  const totalCost = quantity * unitCost;
  const unitPrice = Math.round(unitCost * (1 + markupPercent / 100));
  const expectedRevenue = quantity * unitPrice;
  const expectedProfit = expectedRevenue - totalCost;

  return {
    totalCost,
    unitPrice,
    expectedRevenue,
    expectedProfit,
  };
}

export function enrichProduct(product: Product): Product {
  const metrics = calculateProductMetrics(product);
  return {
    ...product,
    totalCost: metrics.totalCost,
    unitPrice: metrics.unitPrice,
    expectedRevenue: metrics.expectedRevenue,
    expectedProfit: metrics.expectedProfit,
  };
}
