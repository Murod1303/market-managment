import { AppUser } from '../types/index.ts';

export const defaultUsers: AppUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    name: 'Boshqaruvchi (Admin)',
    role: 'admin',
    roleTitle: "Do'kon Egasi / Boshqaruvchi",
  },
  {
    id: 'user-cashier',
    username: 'kassir',
    password: 'kassa2026',
    name: 'Kassir-Operator',
    role: 'cashier',
    roleTitle: 'Kassir / Hisobchi',
  },
];
