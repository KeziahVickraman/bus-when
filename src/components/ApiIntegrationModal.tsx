import { Code2, X } from 'lucide-react';
import { useEffect } from 'react';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiIntegrationModal({ isOpen, onClose }: ApiIntegrationModalProps) {
  useEffect(() => {
    if (!isOpen) return;
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
              LTA DataMall API Adapter
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
          <p className="leading-relaxed">
            This frontend uses the exact Singapore LTA DataMall Bus Arrival v3 data structure
            (<span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">NextBus</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Load</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Feature</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Type</span>)
            inside <span className="font-mono text-xs text-slate-900">src/services/busArrivalService.ts</span>.
          </p>

          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              01. Recommended Backend Proxy Route
            </h3>
            <p className="text-slate-600">
              Keep your <span className="font-mono text-xs">LTA_ACCOUNT_KEY</span> on a backend
              endpoint (e.g. Express <span className="font-mono text-xs">/api/bus-arrivals</span>)
              to avoid exposing credentials or hitting browser CORS restrictions:
            </p>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=01012
Headers:
  AccountKey: process.env.LTA_ACCOUNT_KEY
  accept: application/json`}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              02. Swap In Live Fetch
            </h3>
            <p className="text-slate-600">
              Update <span className="font-mono text-xs">fetchBusStopArrivals(busStopCode)</span> in{' '}
              <span className="font-mono text-xs">src/services/busArrivalService.ts</span> to call
              your proxy endpoint and return the mapped <span className="font-mono text-xs">BusArrivalResponse</span>.
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
