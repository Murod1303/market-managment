import { Router } from 'express';
import productsRoutes from './products.routes.ts';
import usersRoutes from './users.routes.ts';
import telegramRoutes from './telegram.routes.ts';
import databaseRoutes from './database.routes.ts';
import aiRoutes from './ai.routes.ts';
import healthRoutes from './health.routes.ts';
import { productService } from '../services/product.service.ts';

const apiRouter = Router();

// Modular sub-routers
apiRouter.use('/products', productsRoutes);
apiRouter.use('/auth', usersRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/telegram', telegramRoutes);
apiRouter.use('/database', databaseRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/', aiRoutes); // handles /api/scan-receipt

// Backward compatibility alias for batch markup
apiRouter.put('/products-batch-markup', (req, res) => {
  const { ids, markupPercent } = req.body;
  if (!Array.isArray(ids) || typeof markupPercent !== 'number') {
    res.status(400).json({ error: "Noto'g'ri parametrlar" });
    return;
  }

  let updatedCount = 0;
  for (const id of ids) {
    const r = productService.update(id, { markupPercent });
    if (r) updatedCount++;
  }

  res.json({ success: true, updatedCount, products: productService.getAll() });
});

export default apiRouter;
