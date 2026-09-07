import { Router, Request, Response } from 'express';
import { userService, sanitizeUser } from '../services/user.service.ts';

const router = Router();

// 1. Auth: Login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Login va parol kiritilishi shart' });
    return;
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

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
  const { username, password, name, role, roleTitle } = req.body;
  if (!username || !password || !name) {
    res.status(400).json({ error: "Barcha maydonlar to'ldirilishi shart" });
    return;
  }

  if (userService.getByUsername(username)) {
    res.status(400).json({ error: 'Bu login band' });
    return;
  }

  const created = userService.create({
    username,
    password,
    name,
    role: role === 'admin' ? 'admin' : 'cashier',
    roleTitle: roleTitle || (role === 'admin' ? 'Boshqaruvchi' : 'Kassir'),
  });

  res.json({ success: true, user: created });
});

// 7. Users: Change password
router.post('/change-password', (req: Request, res: Response) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    res.status(400).json({ error: "Barcha maydonlar to'ldirilishi shart" });
    return;
  }

  const ok = userService.changePassword(userId, oldPassword, newPassword);
  if (!ok) {
    res.status(400).json({ error: "Eski parol noto'g'ri" });
    return;
  }

  res.json({ success: true, message: 'Parol muvaffaqiyatli almashtirildi' });
});

// 8. Users: Delete user
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = userService.delete(id);
  res.json({ success: deleted });
});

export default router;
