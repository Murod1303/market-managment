import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service.ts';
import { defaultProducts } from '../data/default-products.ts';

const router = Router();

// 1. Get all products
router.get('/', (req: Request, res: Response) => {
  res.json({ products: productService.getAll() });
});

// 2. Add product or batch of products
router.post('/', (req: Request, res: Response) => {
  const newItems = Array.isArray(req.body) ? req.body : [req.body];
  const added: any[] = [];

  for (const item of newItems) {
    if (!item.name || item.quantity === undefined || item.unitCost === undefined) {
      continue;
    }

    const created = productService.create({
      name: String(item.name).trim(),
      category: item.category ? String(item.category).trim() : 'Umumiy',
      quantity: Number(item.quantity) || 0,
      unit: item.unit ? String(item.unit).trim() : 'dona',
      unitCost: Number(item.unitCost) || 0,
      markupPercent: Number(item.markupPercent) || 0,
      date: item.date || new Date().toISOString().split('T')[0],
      supplier: item.supplier ? String(item.supplier).trim() : "Noma'lum",
      notes: item.notes ? String(item.notes).trim() : '',
      barcode: item.barcode ? String(item.barcode).trim() : undefined,
    });
    added.push(created);
  }

  res.json({ success: true, addedCount: added.length, products: productService.getAll() });
});

// 3. Update single product
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = productService.update(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Mahsulot topilmadi' });
    return;
  }
  res.json({ success: true, product: updated, products: productService.getAll() });
});

// 4. Batch update markups
router.post('/batch-markup', (req: Request, res: Response) => {
  const { ids, markupPercent } = req.body;
  if (!Array.isArray(ids) || typeof markupPercent !== 'number') {
    res.status(400).json({ error: "Noto'g'ri parametrlar" });
    return;
  }

  let updatedCount = 0;
  for (const id of ids) {
    const res = productService.update(id, { markupPercent });
    if (res) updatedCount++;
  }

  res.json({ success: true, updatedCount, products: productService.getAll() });
});

// 5. Delete product
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = productService.delete(id);
  res.json({ success: deleted, products: productService.getAll() });
});

// 6. Reset to default demo data
router.post('/reset', (req: Request, res: Response) => {
  productService.setAll([...defaultProducts]);
  res.json({ success: true, products: productService.getAll() });
});

export default router;
