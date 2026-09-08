import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service.ts';
import { defaultProducts } from '../data/default-products.ts';
import { z } from 'zod';

const router = Router();

// Zod schemas
const productSchema = z.object({
  name: z.string().min(1, 'Mahsulot nomi kiritilishi shart'),
  category: z.string().optional().default('Umumiy'),
  quantity: z.coerce.number().min(0, 'Miqdor manfiy bo\'lishi mumkin emas'),
  unit: z.string().optional().default('dona'),
  unitCost: z.coerce.number().min(0, 'Narx manfiy bo\'lishi mumkin emas'),
  markupPercent: z.coerce.number().min(0).default(0),
  date: z.string().optional(),
  supplier: z.string().optional().default("Noma'lum"),
  notes: z.string().optional().default(''),
  barcode: z.string().optional(),
});

const productUpdateSchema = productSchema.partial();

const batchMarkupSchema = z.object({
  ids: z.array(z.string()).min(1, 'Kamida bitta mahsulot tanlanishi kerak'),
  markupPercent: z.coerce.number().min(0, 'Foiz manfiy bo\'lishi mumkin emas'),
});

// 1. Get all products
router.get('/', (req: Request, res: Response) => {
  res.json({ products: productService.getAll() });
});

// 2. Add product or batch of products
router.post('/', (req: Request, res: Response) => {
  try {
    const newItems = Array.isArray(req.body) ? req.body : [req.body];
    const added: any[] = [];

    for (const item of newItems) {
      const validatedData = productSchema.parse(item);

      const created = productService.create({
        name: validatedData.name.trim(),
        category: validatedData.category.trim(),
        quantity: validatedData.quantity,
        unit: validatedData.unit.trim(),
        unitCost: validatedData.unitCost,
        markupPercent: validatedData.markupPercent,
        date: validatedData.date || new Date().toISOString().split('T')[0],
        supplier: validatedData.supplier.trim(),
        notes: validatedData.notes.trim(),
        barcode: validatedData.barcode ? validatedData.barcode.trim() : undefined,
      });
      added.push(created);
    }

    res.json({ success: true, addedCount: added.length, products: productService.getAll() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Noto\'g\'ri ma\'lumot' });
    } else {
      console.error('Add Product Error:', error);
      res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
});

// 3. Update single product
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = productUpdateSchema.parse(req.body);

    const updated = productService.update(id, validatedData);
    if (!updated) {
      res.status(404).json({ error: 'Mahsulot topilmadi' });
      return;
    }
    res.json({ success: true, product: updated, products: productService.getAll() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Noto\'g\'ri ma\'lumot' });
    } else {
      console.error('Update Product Error:', error);
      res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
});

// 4. Batch update markups
router.post('/batch-markup', (req: Request, res: Response) => {
  try {
    const validatedData = batchMarkupSchema.parse(req.body);

    let updatedCount = 0;
    for (const id of validatedData.ids) {
      const resData = productService.update(id, { markupPercent: validatedData.markupPercent });
      if (resData) updatedCount++;
    }

    res.json({ success: true, updatedCount, products: productService.getAll() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Noto\'g\'ri ma\'lumot' });
    } else {
      console.error('Batch Markup Error:', error);
      res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
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
