import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  Users,
  Package,
  ExternalLink,
  ShieldCheck,
  X,
  Copy,
  Check,
  Activity,
  Zap,
  Wifi,
  Clock,
  XCircle,
} from 'lucide-react';

interface DbStatusData {
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

interface PingResult {
  ok: boolean;
  connected: boolean;
  mode?: string;
  latencyMs?: number;
  message: string;
  timestamp: string;
  databaseName?: string;
  error?: string;
}

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<DbStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB status:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ping function that reaches backend health check endpoint (/api/database/ping)
   * to verify whether MongoDB connection is active and measure round-trip latency.
   */
  const ping = async () => {
    setPingLoading(true);
    try {
      const res = await fetch('/api/database/ping');
      const data: PingResult = await res.json();
      setPingResult(data);

      // Refresh full status info in parallel
      const statusRes = await fetch('/api/database/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (err: any) {
      setPingResult({
        ok: false,
        connected: false,
        message: err.message || "Serverga bog'lanishda xatolik yuz berdi",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setPingLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = status?.connected ?? false;

  const copyEnvVar = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="database-status-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="database-status-modal-dialog"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                MongoDB Ma'lumotlar Bazasi
              </h2>
              <p className="text-xs text-slate-400">
                Doimiy ma'lumotlar saqlanishi va Railway integratsiyasi
              </p>
            </div>
          </div>
          <button
            id="close-db-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-semibold text-slate-100">
                {isConnected
                  ? 'MongoDB Muvaffaqiyatli Ulangan! 🍃'
                  : 'Mahalliy JSON xotira rejimida ishlamoqda'}
              </p>
              <p className="text-xs mt-1 text-slate-300">
                {isConnected
                  ? `Baza nomi: "${status?.databaseName}". Barcha tovarlar, foydalanuvchilar va savdolar to'liq bulutli MongoDB bazasida xavfsiz saqlanadi.`
                  : "Hozirda ma'lumotlar server xotirasida (JSON) saqlanmoqda. Railway'da to'liq doimiy MongoDB'ga ulash uchun quyidagi ko'rsatmalardan foydalaning."}
              </p>
            </div>
          </div>

          {/* Live Ping & Health Check Section */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">
                    MongoDB Bog'lanishini Tekshirish (Live Ping)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    /api/database/ping orqali server va MongoDB orasidagi aloqani sinash
                  </p>
                </div>
              </div>

              <button
                id="ping-db-btn"
                onClick={ping}
                disabled={pingLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition shadow-xs"
                title="MongoDB ga ping so'rovi yuborish"
              >
                <Zap className={`w-3.5 h-3.5 ${pingLoading ? 'animate-bounce' : ''}`} />
                <span>{pingLoading ? 'Tekshirilmoqda...' : 'Ping yuborish'}</span>
              </button>
            </div>

            {/* Ping Result Banner if available */}
            {pingResult && (
              <div
                id="ping-result-display"
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  pingResult.ok && pingResult.connected
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                {pingResult.ok && pingResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-slate-100">
                      {pingResult.connected
                        ? 'MongoDB faol va so\'rovlarga javob bermoqda'
                        : 'MongoDB bilan to\'g\'ridan-to\'g\'ri aloqa mavjud emas'}
                    </span>
                    {pingResult.latencyMs !== undefined && (
                      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] bg-slate-900 border border-slate-700 text-emerald-400 font-bold">
                        {pingResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {pingResult.message}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Oxirgi tekshiruv: {new Date(pingResult.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Tovarlar bazasi</p>
                <p className="text-base font-bold text-slate-100">
                  {status?.productCount ?? 0} ta
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Foydalanuvchilar</p>
                <p className="text-base font-bold text-slate-100">
                  {status?.userCount ?? 0} ta
                </p>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Ishlash rejimi:</span>
              <span className="font-medium px-2 py-0.5 rounded bg-slate-700/60 text-slate-200">
                {status?.mode === 'mongodb' ? '🍃 MongoDB Database' : '💾 Local File Fallback'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Baza nomi (Database):</span>
              <span className="font-mono text-emerald-400">{status?.databaseName || 'smartsavdo'}</span>
            </div>

            {status?.maskedUri && (
              <div className="flex flex-col gap-1 text-slate-300">
                <span className="text-slate-400">Ulangan URI:</span>
                <span className="font-mono text-[11px] bg-slate-900/90 p-2 rounded border border-slate-700/50 break-all text-slate-300">
                  {status.maskedUri}
                </span>
              </div>
            )}
          </div>

          {/* Railway Connection Guide */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" />
                Railway.com da MongoDB ulash (1 daqiqada):
              </h3>
              <button
                onClick={() => copyEnvVar('MONGODB_URI=')}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Nusxalandi' : 'Env nusxalash'}
              </button>
            </div>

            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-200">Railway Dashboard</strong> ga kiring va loyihangizni oching.
              </li>
              <li>
                <strong className="text-slate-200">+ New</strong> tugmasini bosing va <strong className="text-slate-200">Database &rarr; Add MongoDB</strong> ni tanlang.
              </li>
              <li>
                Railway avtomatik ravishda <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">MONGO_URL</code> yoki <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">MONGODB_URI</code> o'zgaruvchisini ulaydi.
              </li>
              <li>
                SmartSavdo serveri qayta ishga tushganda o'z-o'zidan MongoDB'ga ulanadi va barcha tovarlarni bazaga sinxronlaydi!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              id="refresh-db-status-btn"
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Holatni yangilash
            </button>
            <button
              id="footer-ping-db-btn"
              onClick={ping}
              disabled={pingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-emerald-400 ${pingLoading ? 'animate-bounce' : ''}`} />
              Ping
            </button>
          </div>
          <button
            id="close-db-dialog-btn"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-100 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  );
};
