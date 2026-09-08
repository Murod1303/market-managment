import { AppUser } from '../types/index.ts';
import bcrypt from 'bcryptjs';

export const defaultUsers: AppUser[] = [
  {
    id: 'user-admin',
    username: 'Admin123',
    password: bcrypt.hashSync('Admin7778', 10),
    name: 'Boshqaruvchi (Admin)',
    role: 'admin',
    roleTitle: "Do'kon Egasi / Boshqaruvchi",
  },
  {
    id: 'user-cashier',
    username: 'kassir123',
    password: bcrypt.hashSync('kassir7877', 10),
    name: 'Kassir-Operator',
    role: 'cashier',
    roleTitle: 'Kassir / Hisobchi',
  },
];
