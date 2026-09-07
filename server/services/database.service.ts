import {
  initMongoDatabase,
  getDbDiagnostics,
  pingMongoDatabase,
  getDbProducts,
  getDbUsers,
} from '../mongodb.ts';
import { productService } from './product.service.ts';
import { userService } from './user.service.ts';
import { defaultProducts } from '../data/default-products.ts';
import { defaultUsers } from '../data/default-users.ts';

export const databaseService = {
  async init(): Promise<boolean> {
    try {
      const isMongoReady = await initMongoDatabase(defaultProducts, defaultUsers);
      if (isMongoReady) {
        const mongoProducts = await getDbProducts(defaultProducts);
        const mongoUsers = await getDbUsers(defaultUsers);

        if (mongoProducts.length > 0) {
          productService.setAll(
            mongoProducts.map((p) => ({
              ...p,
              supplier: p.supplier || "Do'kon ombori",
            }))
          );
        }
        if (mongoUsers.length > 0) {
          userService.setAll(mongoUsers);
        }
        console.log(`[MongoDB] Initialized! Synced ${mongoProducts.length} products & ${mongoUsers.length} users.`);
      }
      return isMongoReady;
    } catch (err) {
      console.warn('[MongoDB] Database init warning:', err);
      return false;
    }
  },

  getStatus() {
    return getDbDiagnostics();
  },

  async ping() {
    return await pingMongoDatabase();
  },

  async sync() {
    const products = productService.getAll();
    const users = userService.getAll();
    return await initMongoDatabase(products, users);
  },
};
