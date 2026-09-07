import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database.service.ts';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPing = await databaseService.ping();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbPing,
    });
  } catch (err: any) {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: { ok: false, connected: false, error: err.message },
    });
  }
});

export default router;
