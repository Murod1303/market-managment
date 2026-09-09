import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database.service.ts';

const router = Router();

// 1. Diagnostics & status
router.get('/status', (req: Request, res: Response) => {
  try {
    const diag = databaseService.getStatus();
    res.json(diag);
  } catch (err: any) {
    console.error('Database Status Error:', err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// 2. Health check & live ping
router.get('/ping', async (req: Request, res: Response) => {
  try {
    const result = await databaseService.ping();
    res.json(result);
  } catch (err: any) {
    console.error('Database Ping Error:', err);
    res.status(500).json({ ok: false, connected: false, error: 'Serverda xatolik yuz berdi' });
  }
});

// 3. Sync local state to MongoDB
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const success = await databaseService.sync();
    res.json({ success, message: success ? "Muvaffaqiyatli sinxronizatsiya qilindi" : "Sinxronizatsiyada xatolik" });
  } catch (err: any) {
    console.error('Database Sync Error:', err);
    res.status(500).json({ success: false, error: 'Serverda xatolik yuz berdi' });
  }
});

// 4. Clear products database
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    const success = await databaseService.clearProducts();
    res.json({ success, message: "Baza muvaffaqiyatli tozalandi" });
  } catch (err: any) {
    console.error('Database Clear Error:', err);
    res.status(500).json({ success: false, error: 'Serverda xatolik yuz berdi' });
  }
});

export default router;
