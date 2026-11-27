import { Code2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiHealthStatus, checkApiHealth } from '../services/busArrivalService';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiIntegrationModal({ isOpen, onClose }: ApiIntegrationModalProps) {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setChecking(true);
    void checkApiHealth()
      .then((res) => setHealth(res))
      .finally(() => setChecking(false));

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-blue-700" aria-hidden="true" />
            <h2 id="api-modal-title" className="font-display text-lg font-bold text-slate-900">
              LTA DataMall v3 Serverless Connection
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close API setup dialog"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-700 max-h-[75vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-semibold text-slate-500">
              Server Health (/api/health)
            </div>
            {checking ? (
              <p className="text-sm text-slate-700">Checking serverless endpoint...</p>
            ) : health ? (
              <p className="text-sm text-slate-900">
                Endpoint reachable ·{' '}
                <span
                  className={
                    health.ltaConfigured
                      ? 'font-semibold text-emerald-700'
                      : 'font-semibold text-amber-700'
                  }
                >
                  {health.ltaConfigured
                    ? 'LTA_ACCOUNT_KEY configured'
                    : 'LTA_ACCOUNT_KEY not set yet (using sample preview for directory stops)'}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-700">Unable to reach /api/health endpoint.</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              01. Serverless Endpoints Created
            </h3>
            <ul className="space-y-1.5 text-slate-600 font-mono text-xs">
              <li>GET /api/health — health & key configuration check</li>
              <li>GET /api/busarrival?BusStopCode=04121&amp;ServiceNo=7 — LTA DataMall v3 proxy</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              02. Add Your LTA_ACCOUNT_KEY Secret
            </h3>
            <p className="text-slate-600 leading-relaxed">
              No API keys are hardcoded in the repository. Add your LTA DataMall key as{' '}
              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                LTA_ACCOUNT_KEY
              </span>{' '}
              in your environment secrets (or local <span className="font-mono text-xs">.env</span>{' '}
              file), and <span className="font-mono text-xs">/api/busarrival.ts</span> will pass it
              server-side via the <span className="font-mono text-xs">AccountKey</span> header.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
