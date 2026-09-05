import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types';
import { calculateProductMetrics, formatNumber, formatSom } from './formatters';

export function generateStorePdfReport(
  products: Product[],
  storeName: string = "Markaziy Savdo Do'koni"
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Header Banner
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("TOVARLAR, KELGAN NAKLADNOYLAR VA FOYDA HISOBLASH RASMIY HISOBOTI", 14, 19);

  doc.setFontSize(8);
  doc.text(`Sana: ${today} | Hisobot №: HSB-${Math.floor(100000 + Math.random() * 900000)}`, 14, 24);

  // Financial summary cards
  let totalCost = 0;
  let totalRevenue = 0;
  let totalProfit = 0;

  products.forEach((p) => {
    const metrics = calculateProductMetrics(p);
    totalCost += metrics.totalCost;
    totalRevenue += metrics.expectedRevenue;
    totalProfit += metrics.expectedProfit;
  });

  const avgMarkup =
    products.length > 0
      ? (
          products.reduce((sum, p) => sum + (Number(p.markupPercent) || 0), 0) /
          products.length
        ).toFixed(1)
      : '0';

  // KPI boxes (x, y, w, h)
  const startY = 34;
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 16;

  const kpis = [
    { label: "Jami Xarajat (Tannarx)", value: formatSom(totalCost), color: [241, 245, 249] },
    { label: "Kutilayotgan Tushum", value: formatSom(totalRevenue), color: [236, 253, 245] },
    { label: "Kutilayotgan Sof Foyda", value: formatSom(totalProfit), color: [220, 252, 231] },
    { label: "O'rtacha Ustama", value: `${avgMarkup}% (${products.length} tovar)`, color: [243, 244, 246] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'S');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + 2.5, startY + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + 2.5, startY + 11);
  });

  // Table Data Preparation
  const tableRows = products.map((prod, index) => {
    const m = calculateProductMetrics(prod);
    return [
      (index + 1).toString(),
      prod.name,
      prod.category,
      `${formatNumber(prod.quantity)} ${prod.unit}`,
      formatNumber(prod.unitCost),
      formatNumber(m.totalCost),
      `+${prod.markupPercent}%`,
      formatNumber(m.unitPrice),
      formatNumber(m.expectedRevenue),
      formatNumber(m.expectedProfit),
      prod.supplier || '-',
    ];
  });

  // Add Table using autoTable
  autoTable(doc, {
    startY: 54,
    head: [
      [
        '№',
        'Tovar Nomi',
        'Kategoriya',
        'Miqdor',
        'Tannarx (so\'m)',
        'Jami Xarajat',
        'Ustama',
        'Sotish Narxi',
        'Kutilgan Tushum',
        'Sof Foyda',
        'Ta\'minotchi',
      ],
    ],
    body: tableRows,
    foot: [
      [
        'JAMI',
        `${products.length} xil tovar`,
        '',
        '',
        '',
        formatNumber(totalCost) + ' so\'m',
        `O'rt: ${avgMarkup}%`,
        '',
        formatNumber(totalRevenue) + ' so\'m',
        formatNumber(totalProfit) + ' so\'m',
        '',
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [6, 78, 59], // Emerald 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 16, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 16, halign: 'right' },
      10: { cellWidth: 20 },
    },
  });

  // Official signatures section at the bottom
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const signY = finalY + 14 < 265 ? finalY + 14 : 265;

  if (signY > 260) {
    doc.addPage();
  }

  const currentSignY = signY > 260 ? 25 : signY;

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentSignY, pageWidth - 14, currentSignY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("Hisobot beruvchi (Bosh hisobchi / Do'kon mudiri): ________________________ (Imzo)", 14, currentSignY + 8);
  doc.text("Qabul qiluvchi (Do'kon rahbari / Ta'sischi): ________________________ (Imzo va Muhr)", 14, currentSignY + 16);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Hujjat avtomatik tarzda Do'kon Tovar va Hisob-Kitob tizimi orqali shakllantirildi.", 14, currentSignY + 24);

  return doc;
}
