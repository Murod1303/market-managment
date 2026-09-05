import * as XLSX from 'xlsx';
import { Product } from '../types';
import { calculateProductMetrics } from './formatters';

export function exportProductsToExcel(products: Product[], filename: string = 'tovarlar_va_hisob_kitob.xlsx') {
  // Prepare formatted rows
  const rows = products.map((prod, index) => {
    const m = calculateProductMetrics(prod);
    return {
      '№': index + 1,
      'Tovar Nomi': prod.name,
      'Kategoriya': prod.category,
      'Kelgan Miqdori': prod.quantity,
      'Birligi': prod.unit,
      '1 Birlik Tannarxi (so\'m)': prod.unitCost,
      'Jami Xarajat (so\'m)': m.totalCost,
      'Ustama Foizi (%)': prod.markupPercent,
      '1 Birlik Sotish Narxi (so\'m)': m.unitPrice,
      'Kutilayotgan Tushum (so\'m)': m.expectedRevenue,
      'Kutilayotgan Sof Foyda (so\'m)': m.expectedProfit,
      'Sana': prod.date,
      'Ta\'minotchi': prod.supplier,
      'Izoh': prod.notes || '',
    };
  });

  // Calculate totals
  let sumCost = 0;
  let sumRevenue = 0;
  let sumProfit = 0;
  products.forEach((p) => {
    const m = calculateProductMetrics(p);
    sumCost += m.totalCost;
    sumRevenue += m.expectedRevenue;
    sumProfit += m.expectedProfit;
  });

  const summaryRow = {
    '№': 'JAMI',
    'Tovar Nomi': `${products.length} xil mahsulot`,
    'Kategoriya': '',
    'Kelgan Miqdori': '',
    'Birligi': '',
    '1 Birlik Tannarxi (so\'m)': '',
    'Jami Xarajat (so\'m)': sumCost,
    'Ustama Foizi (%)': products.length ? Math.round(products.reduce((acc, p) => acc + p.markupPercent, 0) / products.length) : 0,
    '1 Birlik Sotish Narxi (so\'m)': '',
    'Kutilayotgan Tushum (so\'m)': sumRevenue,
    'Kutilayotgan Sof Foyda (so\'m)': sumProfit,
    'Sana': '',
    'Ta\'minotchi': '',
    'Izoh': '',
  };

  const worksheet = XLSX.utils.json_to_sheet([...rows, summaryRow]);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // №
    { wch: 28 }, // Tovar Nomi
    { wch: 18 }, // Kategoriya
    { wch: 15 }, // Kelgan Miqdori
    { wch: 10 }, // Birligi
    { wch: 22 }, // Tannarx
    { wch: 22 }, // Jami Xarajat
    { wch: 16 }, // Ustama
    { wch: 24 }, // Sotish Narxi
    { wch: 24 }, // Kutilgan Tushum
    { wch: 24 }, // Sof Foyda
    { wch: 14 }, // Sana
    { wch: 24 }, // Ta'minotchi
    { wch: 20 }, // Izoh
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tovarlar va Xarajatlar');

  XLSX.writeFile(workbook, filename);
}

export async function parseExcelFile(file: File): Promise<Partial<Product>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedProducts: Partial<Product>[] = [];

        for (const row of rawJson) {
          // Identify keys flexibly
          const name =
            row['Tovar Nomi'] ||
            row['Nomi'] ||
            row['Mahsulot'] ||
            row['Tovar'] ||
            row['name'] ||
            row['Name'];

          if (!name || String(name).toUpperCase() === 'JAMI') continue;

          const category =
            row['Kategoriya'] ||
            row['Bo\'lim'] ||
            row['Turkum'] ||
            row['category'] ||
            'Umumiy';

          const quantity = Number(
            row['Kelgan Miqdori'] ||
            row['Miqdori'] ||
            row['Miqdor'] ||
            row['quantity'] ||
            1
          ) || 1;

          const unit =
            row['Birligi'] ||
            row['Birlik'] ||
            row['O\'lchov'] ||
            row['unit'] ||
            'dona';

          const unitCost = Number(
            row['1 Birlik Tannarxi (so\'m)'] ||
            row['Tannarx'] ||
            row['Kelish narxi'] ||
            row['Narxi'] ||
            row['unitCost'] ||
            0
          ) || 0;

          const markupPercent = Number(
            row['Ustama Foizi (%)'] ||
            row['Ustama'] ||
            row['Ustama (%)'] ||
            row['markupPercent'] ||
            20
          ) || 20;

          const supplier =
            row['Ta\'minotchi'] ||
            row['Yetkazib beruvchi'] ||
            row['supplier'] ||
            'Yetkazib beruvchi';

          const date =
            row['Sana'] ||
            row['date'] ||
            new Date().toISOString().split('T')[0];

          const notes = row['Izoh'] || row['notes'] || '';

          parsedProducts.push({
            id: 'imp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            name: String(name).trim(),
            category: String(category).trim(),
            quantity,
            unit: String(unit).trim().toLowerCase(),
            unitCost,
            markupPercent,
            date: String(date),
            supplier: String(supplier).trim(),
            notes: String(notes),
          });
        }

        resolve(parsedProducts);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
