import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Check,
  AlertCircle,
  Percent,
  Trash2,
  FileText,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { ExtractedReceiptItem, Product, ReceiptScanResult } from '../types';
import { formatNumber, formatSom } from '../utils/formatters';
import { useLanguage } from '../i18n/LanguageContext';

interface AiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExtractedProducts: (products: Partial<Product>[]) => void;
}

export const AiScannerModal: React.FC<AiScannerModalProps> = ({
  isOpen,
  onClose,
  onAddExtractedProducts,
}) => {
  const { t, language, transUnit } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [markupPercent, setMarkupPercent] = useState<number>(20);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle File Selection (Drag or Input)
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg(
        language === 'uz-cyrl'
          ? 'Илтимос, фақат расм файлини юкланг (JPG, PNG, WebP)'
          : 'Iltimos, faqat rasm faylini yuklang (JPG, PNG, WebP)'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      setErrorMsg(null);
      triggerScan(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Vision API
  const triggerScan = async (base64Data: string, mimeType: string = 'image/jpeg') => {
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            (language === 'uz-cyrl' ? `Сервер хатоси: ${res.status}` : `Server xatosi: ${res.status}`)
        );
      }

      const data = await res.json();
      if (data.result && Array.isArray(data.result.items)) {
        setScanResult(data.result);
      } else {
        throw new Error(
          language === 'uz-cyrl'
            ? 'Расмда товарлар маълумотлари аниқланмади.'
            : "Rasmda tovarlar ma'lumotlari aniqlanmadi."
        );
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(
        err.message ||
          (language === 'uz-cyrl'
            ? 'Расм сканерлашда хатолик юз берди'
            : 'Rasm skanerlashda xatolik yuz berdi')
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Demo Sample Invoice Generator
  const handleLoadDemoReceipt = (type: 'nakladnoy' | 'chek') => {
    // Generate an SVG invoice image data URL
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 700);

      // Border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 580, 680);

      // Header
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(type === 'nakladnoy' ? 'HİSOB-FAKTURA (NAKLADNOY №104)' : 'SAVDO CHEKI №782', 30, 60);

      ctx.font = '14px Arial';
      ctx.fillStyle = '#475569';
      ctx.fillText(`Yetkazib beruvchi: ${type === 'nakladnoy' ? "Baraka Oziq-Ovqat Ta'minot MCHJ" : "Farg'ona Agro Savdo"}`, 30, 95);
      ctx.fillText(`Sana: ${new Date().toISOString().split('T')[0]} | Toshkent sh.`, 30, 120);

      // Line
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 140);
      ctx.lineTo(570, 140);
      ctx.stroke();

      // Items table
      ctx.font = 'bold 14px Arial';
      ctx.fillText('№  Tovar nomi                   Miqdor    Birlik     Narxi (so\'m)', 30, 170);

      ctx.font = '13px Arial';
      ctx.fillStyle = '#1e293b';

      const items =
        type === 'nakladnoy'
          ? [
              '1. Shakar Oq Saralangan          100       qop       380 000',
              '2. Kungaboqar yog\'i 5L           60        dona      72 000',
              '3. Guruch Alanga Toshkent        200       kg        19 500',
              '4. Choy Qora Akbar 100g          80        quti      16 000',
            ]
          : [
              '1. Olma Golden 1-nav             150       kg        11 000',
              '2. Kartoshka Navoiy              350       kg        4 200',
              '3. Sabzi Qizil Saralangan        120       kg        3 000',
              '4. Piyoz Sariq                   200       kg        2 800',
            ];

      items.forEach((it, idx) => {
        ctx.fillText(it, 30, 210 + idx * 35);
      });

      // Total
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#065f46';
      ctx.fillText('JAMI TO\'LOV SUMMASI: SO\'M', 30, 420);

      const demoBase64 = canvas.toDataURL('image/jpeg');
      setSelectedImage(demoBase64);
      triggerScan(demoBase64, 'image/jpeg');
    }
  };

  // Remove item from extracted list
  const handleRemoveItem = (index: number) => {
    if (!scanResult) return;
    const updated = [...scanResult.items];
    updated.splice(index, 1);
    setScanResult({ ...scanResult, items: updated });
  };

  // Item field editing
  const handleItemChange = (index: number, field: keyof ExtractedReceiptItem, value: any) => {
    if (!scanResult) return;
    const updated = [...scanResult.items];
    updated[index] = { ...updated[index], [field]: value };
    setScanResult({ ...scanResult, items: updated });
  };

  // Confirm and Add to inventory
  const handleConfirmAdd = () => {
    if (!scanResult || scanResult.items.length === 0) return;

    const newProducts: Partial<Product>[] = scanResult.items.map((it) => {
      const qty = Math.max(0, Number(it.quantity) || 1);
      const cost = Math.max(0, Number(it.unitCost) || 0);
      return {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: it.name,
        category: it.category || 'Oziq-ovqat',
        quantity: qty,
        unit: it.unit || 'dona',
        unitCost: cost,
        markupPercent: markupPercent,
        supplier:
          scanResult.supplier ||
          (language === 'uz-cyrl' ? 'Дўкон омбори (AI Сканер)' : "Do'kon ombori (AI Skaner)"),
        date: scanResult.date || new Date().toISOString().split('T')[0],
        notes:
          language === 'uz-cyrl'
            ? `Фактура орқали AI (Gemini Vision) билан киритилди. Фактура № ${scanResult.invoiceNumber || 'б/н'}`
            : `Faktura orqali AI (Gemini Vision) bilan kiritildi. Faktura № ${scanResult.invoiceNumber || 'b/n'}`,
      };
    });

    onAddExtractedProducts(newProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-ai-scanner"
        className="bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-800 overflow-hidden my-6 animate-scale-up text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 text-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                {t('scannerModalTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('scannerModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Step 1: Upload or Demo Selection */}
          {!scanResult && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/50 hover:bg-emerald-950/20 rounded-2xl p-8 text-center cursor-pointer transition group"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="mt-3 text-sm sm:text-base font-semibold text-slate-200">
                  {t('uploadInvoicePrompt')}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {t('uploadInvoiceDesc')}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-xs"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>{t('takePhoto')}</span>
                  </button>
                </div>
              </div>

              {/* Instant Test Preset Buttons */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    {t('demoInvoicePrompt')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadDemoReceipt('nakladnoy')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 shadow-2xs transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('demoInvoiceNakladnoy')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadDemoReceipt('chek')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 shadow-2xs transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('demoInvoiceChek')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Progress */}
          {isScanning && (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-100 mt-3">
                {t('analyzingInvoice')}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {t('analyzingInvoiceDesc')}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 2: Extracted Results & Markup Prompt */}
          {scanResult && (
            <div className="space-y-5 animate-fade-in">
              {/* Scan Info Summary */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    🏢 {t('supplierFound')} <span className="font-bold text-slate-200">{scanResult.supplier || (language === 'uz-cyrl' ? 'Номаълум' : "Noma'lum")}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    📅 {t('invoiceDate')} {scanResult.date || (language === 'uz-cyrl' ? 'Бугун' : 'Bugun')} | № {scanResult.invoiceNumber || (language === 'uz-cyrl' ? 'б/н' : 'b/n')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {t('detectedItems')}
                  </span>
                  <div className="text-base font-bold text-emerald-400">
                    {scanResult.items.length} {t('itemsCount')} {language === 'uz-cyrl' ? 'маҳсулот' : 'mahsulot'}
                  </div>
                </div>
              </div>

              {/* CRITICAL REQUIREMENT: Ask user for markup % */}
              <div
                id="markup-selection-card"
                className="p-4 bg-slate-950 text-slate-100 rounded-xl space-y-3 border border-slate-800 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {t('askMarkupHeading')}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {t('askMarkupSubheading')}
                      </p>
                    </div>
                  </div>

                  {/* Markup Percent Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[15, 20, 25, 30].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMarkupPercent(p)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                          markupPercent === p
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        +{p}%
                      </button>
                    ))}
                    <div className="flex items-center ml-1">
                      <input
                        type="number"
                        min="0"
                        value={markupPercent}
                        onChange={(e) => setMarkupPercent(Number(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted Items Table with Calculated Selling Price & Profit */}
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">{t('colName')}</th>
                        <th className="p-2.5 text-right">{t('colQuantity')}</th>
                        <th className="p-2.5 text-right">{t('colUnitCost')}</th>
                        <th className="p-2.5 text-right">{t('colTotalCost')}</th>
                        <th className="p-2.5 text-right font-bold text-emerald-400 bg-emerald-950/30">
                          {language === 'uz-cyrl' ? 'Сотиш Нархи' : 'Sotish Narxi'} (+{markupPercent}%)
                        </th>
                        <th className="p-2.5 text-right font-bold text-teal-300 bg-teal-950/30">
                          {t('colExpectedProfit')}
                        </th>
                        <th className="p-2.5 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {scanResult.items.map((item, idx) => {
                        const qty = Number(item.quantity) || 0;
                        const cost = Number(item.unitCost) || 0;
                        const totalCost = qty * cost;
                        const sellingPrice = Math.round(cost * (1 + markupPercent / 100));
                        const totalRevenue = qty * sellingPrice;
                        const profit = totalRevenue - totalCost;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/50 text-slate-200">
                            <td className="p-2.5 font-medium text-slate-100">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-800 rounded-lg bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                  className="w-16 px-1.5 py-1 text-xs text-right border border-slate-800 rounded-lg bg-slate-950 text-slate-100 focus:outline-none"
                                />
                                <span className="text-slate-400 text-[11px]">{transUnit(item.unit || 'dona')}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap font-mono">
                              <input
                                type="number"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                                className="w-20 px-1.5 py-1 text-xs text-right border border-slate-800 rounded-lg bg-slate-950 text-slate-100 focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-right font-mono font-medium text-amber-400">
                              {formatSom(totalCost, language)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-400 bg-emerald-950/20">
                              {formatSom(sellingPrice, language)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-teal-300 bg-teal-950/20">
                              +{formatSom(profit, language)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition"
                                title={t('delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    setSelectedImage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 hover:underline"
                >
                  {t('uploadAnotherImage')}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-add-scanned-items"
                    onClick={handleConfirmAdd}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('addToInventoryBtn')} ({scanResult.items.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
