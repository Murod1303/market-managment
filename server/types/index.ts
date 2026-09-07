/**
 * Server-wide Shared Types and Interfaces
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  markupPercent: number;
  date: string;
  supplier: string;
  notes?: string;
  barcode?: string;
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'cashier';
  roleTitle: string;
}

export type SafeUser = Omit<AppUser, 'password'>;

export interface TelegramSession {
  user: AppUser;
  token: string;
  loginAt: string;
}

export interface ParsedProductResult {
  success: boolean;
  error?: 'empty' | 'invalid';
  item?: {
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    markupPercent: number;
    category: string;
    supplier: string;
  };
}

export interface DbStatusData {
  configured: boolean;
  connected: boolean;
  mode: 'mongodb' | 'local_json_fallback';
  databaseName: string;
  maskedUri: string | null;
  productCount: number;
  userCount: number;
  lastError: string | null;
  railwayInstruction: string;
}

export interface PingResult {
  ok: boolean;
  connected: boolean;
  mode: string;
  latencyMs?: number;
  message: string;
  timestamp: string;
  databaseName?: string;
  error?: string;
}
