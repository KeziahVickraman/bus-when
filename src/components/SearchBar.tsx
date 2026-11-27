import { ArrowRight, Clock, Search, Star, X } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { searchBusStops } from '../services/busArrivalService';
import { BusStopDirectoryEntry } from '../types/bus';

interface SearchBarProps {
  activeStopCode: string;
  recentCodes: string[];
  favoriteCodes: Set<string>;
  onSelectStop: (busStopCode: string) => void;
  onToggleFavorite: (stop: {
    BusStopCode: string;
    Description: string;
    RoadName: string;
    Region: 'Central' | 'East' | 'West' | 'North-East' | 'North';
  }) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function SearchBar({
  activeStopCode,
  recentCodes,
  favoriteCodes,
  onSelectStop,
  onToggleFavorite,
  inputRef: externalRef,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const internalRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const inputRef = externalRef ?? internalRef;

  const matches = useMemo(() => searchBusStops(query).slice(0, 7), [query]);
  const isFiveDigitCode = /^\d{5}$/.test(query.trim());
  const exactMatchExists = useMemo(
    () => matches.some((m) => m.BusStopCode === query.trim()),
    [matches, query]
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function commitStop(code: string) {
    setValidationError(null);
    setIsOpen(false);
    setQuery('');
    onSelectStop(code);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setValidationError('Enter a 5-digit bus stop code (e.g. 01012) or stop name.');
      return;
    }

    if (/^\d{5}$/.test(trimmed)) {
      commitStop(trimmed);
      return;
    }

    if (matches.length > 0) {
      const target = matches[highlightedIndex] ?? matches[0];
      commitStop(target.BusStopCode);
      return;
    }

    if (/^\d+$/.test(trimmed) && trimmed.length !== 5) {
      setValidationError('Singapore bus stop codes must be 5 digits (e.g. 09048).');
      return;
    }

    setValidationError(`No bus stops matched "${trimmed}". Try a 5-digit code like 01012 or 14141.`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    const totalItems = matches.length + (isFiveDigitCode && !exactMatchExists ? 1 : 0);
    if (totalItems === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function renderResultRow(stop: BusStopDirectoryEntry, index: number) {
    const isSelected = index === highlightedIndex;
    const isFav = favoriteCodes.has(stop.BusStopCode);

    return (
      <div
        key={stop.BusStopCode}
        role="option"
        aria-selected={isSelected}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 ${
          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
        }`}
        onClick={() => commitStop(stop.BusStopCode)}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="font-mono tabular-nums text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
            {stop.BusStopCode}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              {stop.Description}
            </div>
            <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
              <span>{stop.RoadName}</span>
              <span aria-hidden="true">·</span>
              <span>{stop.Region}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {stop.Services.slice(0, 4)
                  .map((s) => s.ServiceNo)
                  .join(', ')}
                {stop.Services.length > 4 ? ` +${stop.Services.length - 4}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label={isFav ? `Remove ${stop.Description} from favorites` : `Save ${stop.Description} to favorites`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite({
                BusStopCode: stop.BusStopCode,
                Description: stop.Description,
                RoadName: stop.RoadName,
                Region: stop.Region,
              });
            }}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <Star
              className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setValidationError(null);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter 5-digit bus stop code (e.g. 01012, 09048) or stop name..."
              aria-label="Search by 5-digit Singapore bus stop code, stop name, road, or service number"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              className="w-full h-12 pl-11 pr-10 bg-white border border-slate-300 rounded-xl text-sm sm:text-base text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 transition-shadow"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => {
                  setQuery('');
                  setValidationError(null);
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="h-12 px-6 bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            <span>Check Arrivals</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {validationError && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {validationError}
        </p>
      )}

      {/* Quick Recent Stop Jumps */}
      {recentCodes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Recent stops
          </span>
          {recentCodes.map((code) => {
            const isCurrent = code === activeStopCode;
            return (
              <button
                key={code}
                type="button"
                onClick={() => commitStop(code)}
                className={`px-2.5 py-1 min-h-[32px] font-mono tabular-nums rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (matches.length > 0 || (isFiveDigitCode && !exactMatchExists)) && (
        <div
          role="listbox"
          aria-label="Matching Singapore bus stops"
          className="absolute left-0 right-0 top-[54px] z-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[380px] overflow-y-auto"
        >
          {isFiveDigitCode && !exactMatchExists && (
            <div
              role="option"
              aria-selected={highlightedIndex === 0}
              onClick={() => commitStop(query.trim())}
              className="flex items-center justify-between gap-3 px-4 py-3.5 bg-blue-50/60 hover:bg-blue-50 cursor-pointer border-b border-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-sm font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md">
                  {query.trim()}
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Look up stop code {query.trim()}
                  </div>
                  <div className="text-xs text-slate-600">
                    Open stop {query.trim()} directly (custom stop lookup)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
            </div>
          )}

          {matches.map((stop, idx) =>
            renderResultRow(
              stop,
              isFiveDigitCode && !exactMatchExists ? idx + 1 : idx
            )
          )}
        </div>
      )}
    </div>
  );
}
