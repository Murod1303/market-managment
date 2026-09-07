import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database.service.ts';

const router = Router();

// 1. Diagnostics & status
router.get('/status', (req: Request, res: Response) => {
  try {
    const diag = databaseService.getStatus();
    res.json(diag);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Health check & live ping
router.get('/ping', async (req: Request, res: Response) => {
  try {
    const result = await databaseService.ping();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, connected: false, error: err.message });
  }
});

// 3. Sync local state to MongoDB
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const success = await databaseService.sync();
    res.json({ success, message: success ? "Muvaffaqiyatli sinxronizatsiya qilindi" : "Sinxronizatsiyada xatolik" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
