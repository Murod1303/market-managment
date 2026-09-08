import { Router, Request, Response } from 'express';
import { userService, sanitizeUser } from '../services/user.service.ts';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();

// Zod schemas
const loginSchema = z.object({
  username: z.string().min(1, 'Login kiritilishi shart'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

const createUserSchema = z.object({
  username: z.string().min(3, 'Login kamida 3 ta belgidan iborat bo\'lishi kerak'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  name: z.string().min(2, 'Ism kiritilishi shart'),
  role: z.enum(['admin', 'cashier']),
  roleTitle: z.string().optional(),
});

const changePasswordSchema = z.object({
  userId: z.string().min(1, 'Foydalanuvchi ID si kiritilishi shart'),
  oldPassword: z.string().min(1, 'Eski parol kiritilishi shart'),
  newPassword: z.string().min(6, 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});

// Brute-force himoyasi uchun rate limiter (max 5 ta urinish 15 daqiqada)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 5, // har bir IP dan ko'pi bilan 5 ta so'rov
  message: { error: "Juda ko'p xato urinishlar! Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
});

// 1. Auth: Login
router.post('/login', loginLimiter, (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const cleanUser = validatedData.username.trim();
    const cleanPass = validatedData.password.trim();

    const authResult = userService.authenticate(cleanUser, cleanPass);
    if (!authResult) {
      res.status(401).json({
        error: "Noto'g'ri login yoki parol! Iltimos, ma'lumotlarni tekshirib qaytadan kiriting.",
      });
      return;
    }

    res.json({
      success: true,
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Noto\'g\'ri ma\'lumot' });
    } else {
      console.error('Login Error:', error);
      res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
});

// 2. Auth: Current user (me)
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-auth-token'];
  const queryToken = req.query.token as string | undefined;

  let token: string | undefined = undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  } else if (queryToken) {
    token = queryToken.trim();
  }

  const user = userService.verifyToken(token);
  if (!user) {
    res.status(401).json({
      error: "Avtorizatsiyadan o'tilmagan yoki sessiya muddati tugagan",
      isAuthenticated: false,
    });
    return;
  }

  res.json({
    success: true,
    isAuthenticated: true,
    user: sanitizeUser(user),
  });
});

// 3. Auth: Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Tizimdan chiqildi' });
});

// 4. Auth: Demo accounts info
router.get('/demo-users', (req: Request, res: Response) => {
  res.json({
    demoAccounts: [
      {
        username: 'admin',
        role: 'admin',
        roleTitle: "Do'kon Egasi / Boshqaruvchi",
        passwordHint: 'admin123',
      },
      {
        username: 'kassir',
        role: 'cashier',
        roleTitle: 'Kassir / Hisobchi',
        passwordHint: 'kassa2026',
      },
    ],
  });
});

// 5. Users: List all users
router.get('/', (req: Request, res: Response) => {
  res.json({ users: userService.getAllSafe() });
});

// 6. Users: Create user
router.post('/', (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    if (userService.getByUsername(validatedData.username)) {
      res.status(400).json({ error: 'Bu login band' });
      return;
    }

    const created = userService.create({
      username: validatedData.username,
      password: validatedData.password,
      name: validatedData.name,
      role: validatedData.role,
      roleTitle: validatedData.roleTitle || (validatedData.role === 'admin' ? 'Boshqaruvchi' : 'Kassir'),
    });

    res.json({ success: true, user: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Noto\'g\'ri ma\'lumot' });
    } else {
      console.error('Create User Error:', error);
      res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
});

// 7. Users: Change password
router.post('/change-password', (req: Request, res: Response) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);

    const ok = userService.changePassword(validatedData.userId, validatedData.oldPassword, validatedData.newPassword);
    if (!ok) {
      res.status(400).json({ error: "Eski parol noto'g'ri" });
      return;
    }

    res.json({ success: true, message: 'Parol muvaffaqiyatli almashtirildi' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Noto\'g\'ri ma\'lumot' });
    } else {
      console.error('Change Password Error:', error);
      res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
});

// 8. Users: Delete user
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = userService.delete(id);
  res.json({ success: deleted });
});

export default router;
