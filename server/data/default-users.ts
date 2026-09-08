import { AppUser } from '../types/index.ts';
import bcrypt from 'bcryptjs';

export const defaultUsers: AppUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Boshqaruvchi (Admin)',
    role: 'admin',
    roleTitle: "Do'kon Egasi / Boshqaruvchi",
  },
  {
    id: 'user-cashier',
    username: 'kassir',
    password: bcrypt.hashSync('kassa2026', 10),
    name: 'Kassir-Operator',
    role: 'cashier',
    roleTitle: 'Kassir / Hisobchi',
  },
];
