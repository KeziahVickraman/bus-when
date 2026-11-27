import {
  Accessibility,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Pause,
  Pin,
  Play,
  RefreshCw,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatMinutesAway } from '../services/busArrivalService';
import {
  BusArrivalResponse,
  BusServiceArrival,
  BusType,
  LoadStatus,
  NextBusInfo,
  SingaporeRegion,
} from '../types/bus';

interface ArrivalBoardProps {
  arrivalData: BusArrivalResponse | null;
  isLoading: boolean;
  nowMs: number;
  secondsToNextRefresh: number;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  isFavorite: boolean;
  pinnedServices: string[];
  onToggleFavorite: (stop: {
    BusStopCode: string;
    Description: string;
    RoadName: string;
    Region: SingaporeRegion;
  }) => void;
  onTogglePinService: (busStopCode: string, serviceNo: string) => void;
  onOpenApiModal: () => void;
  onSelectFallbackStop: (code: string) => void;
}

type BoardFilter = 'all' | 'seats' | 'wab';

function getLoadDisplay(load: LoadStatus): {
  label: string;
  textClass: string;
  barClass: string;
} {
  switch (load) {
    case 'SEA':
      return {
        label: 'Seats',
        textClass: 'text-emerald-700',
        barClass: 'bg-emerald-600',
      };
    case 'SDA':
      return {
        label: 'Standing',
        textClass: 'text-amber-700',
        barClass: 'bg-amber-500',
      };
    case 'LSD':
      return {
        label: 'Full',
        textClass: 'text-red-700',
        barClass: 'bg-red-600',
      };
    default:
      return {
        label: 'No data',
        textClass: 'text-slate-500',
        barClass: 'bg-slate-300',
      };
  }
}

function getBusTypeLabel(type: BusType): string {
  switch (type) {
    case 'DD':
      return 'Double Deck';
    case 'BD':
      return 'Bendy';
    case 'SD':
      return 'Single Deck';
    default:
      return 'Bus';
  }
}

function getBusTypeShort(type: BusType): string {
  return type || '—';
}

function ArrivalSlot({
  bus,
  slotLabel,
  nowMs,
  primary = false,
}: {
  bus: NextBusInfo;
  slotLabel: string;
  nowMs: number;
  primary?: boolean;
}) {
  const eta = formatMinutesAway(bus.EstimatedArrival, nowMs);
  const load = getLoadDisplay(bus.Load);

  return (
    <div className="flex flex-col items-end justify-center min-w-[78px] sm:min-w-[92px]">
      <span className="text-[11px] font-medium text-slate-400 mb-0.5">{slotLabel}</span>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono tabular-nums font-bold leading-none ${
            primary
              ? eta.isArriving
                ? 'text-xl text-blue-700'
                : 'text-xl text-slate-950'
              : eta.isArriving
                ? 'text-base text-blue-700'
                : 'text-base text-slate-800'
          }`}
        >
          {eta.label}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={`w-3 h-1 rounded-xs ${load.barClass}`} aria-hidden="true" />
        <span className={`text-[11px] font-semibold ${load.textClass}`}>{load.label}</span>
        <span className="text-[11px] font-mono text-slate-400">{getBusTypeShort(bus.Type)}</span>
      </div>
    </div>
  );
}

export function ArrivalBoard({
  arrivalData,
  isLoading,
  nowMs,
  secondsToNextRefresh,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onManualRefresh,
  isFavorite,
  pinnedServices,
  onToggleFavorite,
  onTogglePinService,
  onOpenApiModal,
  onSelectFallbackStop,
}: ArrivalBoardProps) {
  const [serviceFilter, setServiceFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const pinnedSet = useMemo(() => new Set(pinnedServices), [pinnedServices]);

  const displayedServices = useMemo(() => {
    if (!arrivalData) return [];

    const query = serviceFilter.trim().toLowerCase();
    const filtered = arrivalData.Services.filter((svc) => {
      const matchesText =
        !query ||
        svc.ServiceNo.toLowerCase().includes(query) ||
        svc.DestinationName.toLowerCase().includes(query);

      if (!matchesText) return false;

      if (boardFilter === 'seats') {
        return svc.NextBus.Load === 'SEA';
      }
      if (boardFilter === 'wab') {
        return svc.NextBus.Feature === 'WAB';
      }
      return true;
    });

    // Keep pinned services sorted to the top, preserving soonest arrival order within each group
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedSet.has(a.ServiceNo) ? 0 : 1;
      const bPinned = pinnedSet.has(b.ServiceNo) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      return (
        new Date(a.NextBus.EstimatedArrival).getTime() -
        new Date(b.NextBus.EstimatedArrival).getTime()
      );
    });
  }, [arrivalData, serviceFilter, boardFilter, pinnedSet]);

  async function handleCopyCode() {
    if (!arrivalData) return;
    try {
      await navigator.clipboard.writeText(arrivalData.BusStopCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  }

  if (isLoading && !arrivalData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-64 bg-slate-200 rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!arrivalData) return null;

  const updatedLabel = new Date(arrivalData.LastUpdated).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <section
      aria-labelledby="arrival-board-heading"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      {/* Active Bus Stop Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono tabular-nums font-bold text-slate-900">
                Stop {arrivalData.BusStopCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{arrivalData.RoadName}</span>
              <span aria-hidden="true">·</span>
              <span>{arrivalData.Region}</span>
            </div>

            <h1
              id="arrival-board-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance"
            >
              {arrivalData.StopName}
            </h1>

            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 tabular-nums">
              <span>Updated {updatedLabel}</span>
              <span aria-hidden="true">·</span>
              <span>
                {autoRefreshEnabled
                  ? `Next update in ${secondsToNextRefresh}s`
                  : 'Auto-refresh paused'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onToggleFavorite({
                  BusStopCode: arrivalData.BusStopCode,
                  Description: arrivalData.StopName,
                  RoadName: arrivalData.RoadName,
                  Region: arrivalData.Region,
                })
              }
              className={`inline-flex items-center gap-2 px-4 py-2 min-h-[42px] text-sm font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                isFavorite
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/70'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Star
                className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500'}`}
                aria-hidden="true"
              />
              <span>{isFavorite ? 'Saved' : 'Save Stop'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy 5-digit bus stop code"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] text-sm font-medium rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{arrivalData.BusStopCode}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleAutoRefresh}
              aria-label={autoRefreshEnabled ? 'Pause auto-refresh' : 'Resume auto-refresh'}
              title={autoRefreshEnabled ? 'Pause auto-refresh' : 'Resume auto-refresh'}
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              {autoRefreshEnabled ? (
                <Pause className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Service Filter Toolbar */}
        {arrivalData.IsKnownStop && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                placeholder="Filter bus no. or destination..."
                aria-label="Filter bus services at this stop"
                className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-700"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBoardFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  boardFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({arrivalData.Services.length})
              </button>
              <button
                type="button"
                onClick={() => setBoardFilter('seats')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  boardFilter === 'seats'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>Seats Only</span>
              </button>
              <button
                type="button"
                onClick={() => setBoardFilter('wab')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  boardFilter === 'wab'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Accessibility className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                <span>Wheelchair</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom / Outside-Directory Stop State */}
      {!arrivalData.IsKnownStop ? (
        <div className="p-8 sm:p-10 text-center space-y-4">
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Stop {arrivalData.BusStopCode} ready for live API connection
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This 5-digit bus stop code is not in the offline sample directory yet. You can still save it to Favorites now, and live arrivals will load automatically once you connect your LTA DataMall API key.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenApiModal}
              className="px-4 py-2 min-h-[40px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View API Integration Guide
            </button>
            <button
              type="button"
              onClick={() => onSelectFallbackStop('01012')}
              className="px-4 py-2 min-h-[40px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg transition-colors"
            >
              Load Sample Stop 01012
            </button>
          </div>
        </div>
      ) : displayedServices.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            No bus services match your current filter
          </p>
          <p className="text-xs text-slate-500">
            Try clearing the service filter or switching back to all services.
          </p>
          <button
            type="button"
            onClick={() => {
              setServiceFilter('');
              setBoardFilter('all');
            }}
            className="px-4 py-2 min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Reset filters
          </button>
        </div>
      ) : (
        /* Bus Arrival Rows */
        <ul className="divide-y divide-slate-200">
          {displayedServices.map((svc: BusServiceArrival) => {
            const isPinned = pinnedSet.has(svc.ServiceNo);
            const isExpanded = expandedService === svc.ServiceNo;
            const eta1 = formatMinutesAway(svc.NextBus.EstimatedArrival, nowMs);
            const eta2 = formatMinutesAway(svc.NextBus2.EstimatedArrival, nowMs);
            const eta3 = formatMinutesAway(svc.NextBus3.EstimatedArrival, nowMs);

            return (
              <li
                key={svc.ServiceNo}
                className={`transition-colors ${
                  isPinned ? 'bg-blue-50/30' : 'bg-white'
                }`}
              >
                <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  {/* Left: Service Plate, Destination & Metadata */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="font-mono tabular-nums font-bold text-lg text-white bg-slate-900 min-w-[64px] h-11 px-2.5 rounded-lg flex items-center justify-center tracking-tight">
                        {svc.ServiceNo}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-slate-950 truncate">
                          To {svc.DestinationName}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{svc.Operator}</span>
                        <span aria-hidden="true">·</span>
                        <span>{getBusTypeLabel(svc.NextBus.Type)}</span>
                        {svc.NextBus.Feature === 'WAB' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Accessibility className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                              <span>Wheelchair</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: 3-Bus Arrival Horizon + Row Controls */}
                  <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <ArrivalSlot bus={svc.NextBus} slotLabel="Next" nowMs={nowMs} primary />
                      <div className="w-px h-9 bg-slate-200" aria-hidden="true" />
                      <ArrivalSlot bus={svc.NextBus2} slotLabel="2nd" nowMs={nowMs} />
                      <div className="w-px h-9 bg-slate-200 hidden sm:block" aria-hidden="true" />
                      <div className="hidden sm:block">
                        <ArrivalSlot bus={svc.NextBus3} slotLabel="3rd" nowMs={nowMs} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onTogglePinService(arrivalData.BusStopCode, svc.ServiceNo)}
                        aria-label={
                          isPinned
                            ? `Unpin service ${svc.ServiceNo}`
                            : `Pin service ${svc.ServiceNo} to top`
                        }
                        title={isPinned ? 'Unpin service' : 'Pin service to top'}
                        className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                          isPinned
                            ? 'text-blue-700 bg-blue-100/70 hover:bg-blue-100'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className={`w-4 h-4 ${isPinned ? 'fill-blue-700' : ''}`} aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedService(isExpanded ? null : svc.ServiceNo)
                        }
                        aria-expanded={isExpanded}
                        aria-label={`Show route details for bus ${svc.ServiceNo}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Route & Exact ETA Strip */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-800">Upcoming stops along route:</span>
                      <div className="text-slate-600">
                        {svc.UpcomingStops && svc.UpcomingStops.length > 0
                          ? svc.UpcomingStops.join(' → ')
                          : 'Upcoming stop sequence will populate from live route feed.'}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-slate-600 flex items-center gap-3 shrink-0">
                      <span>1st: {eta1.clockTime}</span>
                      <span>2nd: {eta2.clockTime}</span>
                      <span>3rd: {eta3.clockTime}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Board Footer Legend */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-xs bg-emerald-600" aria-hidden="true" />
            <span>Seats Available</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-xs bg-amber-500" aria-hidden="true" />
            <span>Standing Available</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-xs bg-red-600" aria-hidden="true" />
            <span>Limited Standing</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onManualRefresh}
          className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-950 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sync now</span>
        </button>
      </div>
    </section>
  );
}
