import fs from 'fs';
import { DATA_DIR, DB_FILE } from '../config/paths.ts';
import { defaultProducts } from '../data/default-products.ts';
import { Product } from '../types/index.ts';
import {
  bulkUpsertDbProducts,
  deleteDbProduct as deleteFromMongo,
  upsertDbProduct as upsertToMongo,
} from '../mongodb.ts';

let productsCache: Product[] = [];

function loadFromDisk(): Product[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultProducts, null, 2), 'utf-8');
    return defaultProducts;
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
    return defaultProducts;
  }
}

function persistProducts(products: Product[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }

  // Asynchronously persist to MongoDB
  bulkUpsertDbProducts(products).catch((err) => {
    console.error('[MongoDB] Error in bulkUpsertDbProducts:', err);
  });
}

// Initialize cache
productsCache = loadFromDisk();

export const productService = {
  getAll(): Product[] {
    return productsCache;
  },

  setAll(products: Product[]): void {
    productsCache = products;
    persistProducts(productsCache);
  },

  getById(id: string): Product | undefined {
    return productsCache.find((p) => p.id === id);
  },

  getByBarcode(barcode: string): Product | undefined {
    const code = barcode.trim();
    return productsCache.find((p) => p.barcode && p.barcode.trim() === code);
  },

  search(query: string): Product[] {
    const q = query.toLowerCase().trim();
    if (!q) return productsCache;
    return productsCache.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  },

  create(data: Omit<Product, 'id'> & { id?: string }): Product {
    const newProduct: Product = {
      ...data,
      id: data.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: data.date || new Date().toISOString().split('T')[0],
    };

    productsCache = [newProduct, ...productsCache];
    persistProducts(productsCache);
    upsertToMongo(newProduct).catch(() => {});
    return newProduct;
  },

  update(id: string, updates: Partial<Product>): Product | null {
    const index = productsCache.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updated = { ...productsCache[index], ...updates };
    productsCache[index] = updated;
    persistProducts(productsCache);
    upsertToMongo(updated).catch(() => {});
    return updated;
  },

  delete(id: string): boolean {
    const initialLen = productsCache.length;
    productsCache = productsCache.filter((p) => p.id !== id);
    if (productsCache.length !== initialLen) {
      persistProducts(productsCache);
      deleteFromMongo(id).catch(() => {});
      return true;
    }
    return false;
  },

  bulkUpsert(items: Product[]): { count: number } {
    const map = new Map<string, Product>();
    for (const p of productsCache) {
      map.set(p.id, p);
    }
    for (const item of items) {
      map.set(item.id, item);
    }
    productsCache = Array.from(map.values());
    persistProducts(productsCache);
    return { count: items.length };
  },

  count(): number {
    return productsCache.length;
  },
};
