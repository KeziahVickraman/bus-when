import { Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeStops';
import { SingaporeRegion } from '../types/bus';

const REGIONS: Array<'All' | SingaporeRegion> = [
  'All',
  'Central',
  'East',
  'West',
  'North-East',
  'North',
];

interface StopDirectoryPanelProps {
  activeStopCode: string;
  favoriteCodes: Set<string>;
  onSelectStop: (code: string) => void;
  onToggleFavorite: (stop: {
    BusStopCode: string;
    Description: string;
    RoadName: string;
    Region: SingaporeRegion;
  }) => void;
}

export function StopDirectoryPanel({
  activeStopCode,
  favoriteCodes,
  onSelectStop,
  onToggleFavorite,
}: StopDirectoryPanelProps) {
  const [selectedRegion, setSelectedRegion] = useState<'All' | SingaporeRegion>('All');

  const filteredStops = useMemo(() => {
    if (selectedRegion === 'All') return SINGAPORE_BUS_STOPS;
    return SINGAPORE_BUS_STOPS.filter((stop) => stop.Region === selectedRegion);
  }, [selectedRegion]);

  return (
    <section
      aria-labelledby="directory-heading"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 space-y-3">
        <div>
          <h2 id="directory-heading" className="font-display text-base font-bold text-slate-900">
            Singapore Stop Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Major interchanges and MRT bus stops across Singapore
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filter stops by Singapore region"
          className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg"
        >
          {REGIONS.map((region) => {
            const active = selectedRegion === region;
            return (
              <button
                key={region}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedRegion(region)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {filteredStops.map((stop) => {
          const isActive = stop.BusStopCode === activeStopCode;
          const isFav = favoriteCodes.has(stop.BusStopCode);

          return (
            <li
              key={stop.BusStopCode}
              className={`flex items-center justify-between gap-2 px-4 py-3 transition-colors ${
                isActive ? 'bg-blue-50/55' : 'hover:bg-slate-50/80'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectStop(stop.BusStopCode)}
                className="flex-1 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-lg p-1 -m-1"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {stop.BusStopCode}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {stop.Description}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500 truncate">
                  {stop.RoadName} · {stop.Services.length} services
                </div>
              </button>

              <button
                type="button"
                aria-label={isFav ? `Remove ${stop.Description} from favorites` : `Save ${stop.Description} to favorites`}
                onClick={() =>
                  onToggleFavorite({
                    BusStopCode: stop.BusStopCode,
                    Description: stop.Description,
                    RoadName: stop.RoadName,
                    Region: stop.Region,
                  })
                }
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50/70 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <Star
                  className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
