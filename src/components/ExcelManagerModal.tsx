import React, { useRef, useState } from 'react';
import { X, FileSpreadsheet, Download, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { exportProductsToExcel, parseExcelFile } from '../utils/excelManager';
import { useLanguage } from '../i18n/LanguageContext';

interface ExcelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImportProducts: (imported: Partial<Product>[]) => void;
}

export const ExcelManagerModal: React.FC<ExcelManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  onImportProducts,
}) => {
  const { t, language } = useLanguage();
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    const filename = `dokon_tovarlar_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportProductsToExcel(products, filename);
  };

  // Handle Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const parsedItems = await parseExcelFile(file);
      if (parsedItems.length === 0) {
        throw new Error(
          language === 'uz-cyrl'
            ? 'Excel файлида товарлар топилмади ёки жадвал бўш.'
            : "Excel faylida tovarlar topilmadi yoki jadval bo'sh."
        );
      }

      onImportProducts(parsedItems);
      setImportSuccessMsg(
        language === 'uz-cyrl'
          ? `✅ ${parsedItems.length} та товар муваффақиятли базага қўшилди!`
          : `✅ ${parsedItems.length} ta tovar muvaffaqiyatli bazaga qo'shildi!`
      );
    } catch (err: any) {
      console.error('Excel import error:', err);
      setErrorMsg(
        err.message ||
          (language === 'uz-cyrl'
            ? "Excel файлни ўқишда хатолик юз берди"
            : "Excel faylni o'qishda xatolik yuz berdi")
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-excel-manager"
        className="bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden my-8 animate-scale-up text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 text-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">{t('excelModalTitle')}</h3>
              <p className="text-xs text-slate-400">
                {t('excelModalSubtitle')}
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

        <div className="p-6 space-y-6">
          {/* Notifications */}
          {importSuccessMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Export to Excel */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  1. {t('exportExcelTitle')}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'uz-cyrl'
                    ? `Барча ${products.length} та товар, миқдор, таннарх, устама, сотиш нархи ва фойдалар формулалари билан`
                    : `Barcha ${products.length} ta tovar, miqdor, tannarx, ustama, sotish narxi va foydalar formulalari bilan`}
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              id="btn-export-excel-file"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40"
            >
              <Download className="w-4 h-4" />
              <span>{t('exportExcelBtn')}</span>
            </button>
          </div>

          {/* Section 2: Import from Excel */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                2. {t('importExcelTitle')}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('importExcelDesc')}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              id="btn-import-excel-file"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{t('readingExcel')}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{t('importExcelBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
