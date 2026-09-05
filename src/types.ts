export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; // 'kg' | 'dona' | 'litr' | 'qop' | 'quti' | 'metr' | 'pachka' | 'blok'
  unitCost: number; // 1 birlik tannarxi (so'm)
  markupPercent: number; // Ustama foizi (masalan 20)
  date: string; // YYYY-MM-DD
  supplier: string; // Ta'minotchi
  notes?: string;
  // Computed fields (optional helper properties)
  totalCost?: number;
  unitPrice?: number;
  expectedRevenue?: number;
  expectedProfit?: number;
}

export interface ExtractedReceiptItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface ReceiptScanResult {
  supplier: string;
  date: string;
  invoiceNumber?: string;
  items: ExtractedReceiptItem[];
  totalInvoiceAmount?: number;
  notes?: string;
}

export interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  image?: string;
  actionType?: 'ask_markup' | 'products_preview' | 'excel_file' | 'pdf_file' | 'product_card' | 'open_webapp' | 'login_required';
  pendingItems?: ExtractedReceiptItem[];
  productData?: Product;
  authToken?: string;
  userRole?: string;
}

export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  token: string;
  loginTime: string;
}

export interface CategorySummary {
  category: string;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  percentage: number;
  itemCount: number;
}
