import { Bus, MapPin, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiIntegrationModal } from './components/ApiIntegrationModal';
import { ArrivalBoard } from './components/ArrivalBoard';
import { FavoritesPanel } from './components/FavoritesPanel';
import { ActiveSection, Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { StopDirectoryPanel } from './components/StopDirectoryPanel';
import { fetchBusStopArrivals, getBusStopByCode } from './services/busArrivalService';
import { BusArrivalResponse, FavoriteStop, SingaporeRegion } from './types/bus';

const STORAGE_FAVORITES_KEY = 'nextbus_sg_favorites_v1';
const STORAGE_RECENT_KEY = 'nextbus_sg_recent_v1';
const STORAGE_ACTIVE_STOP_KEY = 'nextbus_sg_active_stop_v1';
const STORAGE_PINNED_SERVICES_KEY = 'nextbus_sg_pinned_services_v1';

const REFRESH_INTERVAL_SEC = 15;

const DEFAULT_FAVORITES: FavoriteStop[] = [
  {
    BusStopCode: '01012',
    Description: 'Hotel Grand Pacific',
    RoadName: 'Victoria St',
    Region: 'Central',
    Nickname: 'City Commute',
    AddedAt: 1,
  },
  {
    BusStopCode: '09048',
    Description: 'Orchard Stn / Tang Plaza',
    RoadName: 'Orchard Rd',
    Region: 'Central',
    AddedAt: 2,
  },
  {
    BusStopCode: '14141',
    Description: 'HarbourFront Stn / VivoCity',
    RoadName: 'Telok Blangah Rd',
    Region: 'Central',
    AddedAt: 3,
  },
];

function loadInitialFavorites(): FavoriteStop[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
    if (raw === null) return DEFAULT_FAVORITES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FAVORITES;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

function loadInitialRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_KEY);
    if (!raw) return ['01012', '09048', '14141', '75009'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ['01012', '09048'];
  } catch {
    return ['01012', '09048'];
  }
}

function loadInitialActiveStop(): string {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_STOP_KEY) || '01012';
  } catch {
    return '01012';
  }
}

function loadPinnedServices(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_PINNED_SERVICES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function App() {
  const [activeStopCode, setActiveStopCode] = useState<string>(loadInitialActiveStop);
  const [favorites, setFavorites] = useState<FavoriteStop[]>(loadInitialFavorites);
  const [recentCodes, setRecentCodes] = useState<string[]>(loadInitialRecent);
  const [pinnedServicesByStop, setPinnedServicesByStop] = useState<Record<string, string[]>>(
    loadPinnedServices
  );

  const [arrivalData, setArrivalData] = useState<BusArrivalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [secondsToRefresh, setSecondsToRefresh] = useState<number>(REFRESH_INTERVAL_SEC);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  const [activeSection, setActiveSection] = useState<ActiveSection>('board');
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const favoriteCodes = useMemo(
    () => new Set(favorites.map((fav) => fav.BusStopCode)),
    [favorites]
  );

  // Persist user preferences in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(recentCodes));
    } catch {
      // Ignore storage quota errors
    }
  }, [recentCodes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_STOP_KEY, activeStopCode);
    } catch {
      // Ignore storage quota errors
    }
  }, [activeStopCode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_PINNED_SERVICES_KEY,
        JSON.stringify(pinnedServicesByStop)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [pinnedServicesByStop]);

  const loadArrivals = useCallback(async (stopCode: string) => {
    setIsLoading(true);
    try {
      const now = new Date();
      const response = await fetchBusStopArrivals(stopCode, now);
      setArrivalData(response);
      setNowMs(now.getTime());
      setSecondsToRefresh(REFRESH_INTERVAL_SEC);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArrivals(activeStopCode);
  }, [activeStopCode, loadArrivals]);

  // Live 1-second clock & auto-refresh countdown
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      if (!autoRefreshEnabled) return;
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          void loadArrivals(activeStopCode);
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeStopCode, autoRefreshEnabled, loadArrivals]);

  const handleSelectStop = useCallback((code: string) => {
    const clean = code.trim();
    if (!clean) return;
    setActiveStopCode(clean);
    setActiveSection('board');
    setRecentCodes((prev) => [clean, ...prev.filter((c) => c !== clean)].slice(0, 6));
  }, []);

  const handleToggleFavorite = useCallback(
    (stop: {
      BusStopCode: string;
      Description: string;
      RoadName: string;
      Region: SingaporeRegion;
    }) => {
      setFavorites((prev) => {
        const exists = prev.some((item) => item.BusStopCode === stop.BusStopCode);
        if (exists) {
          return prev.filter((item) => item.BusStopCode !== stop.BusStopCode);
        }
        const directoryMatch = getBusStopByCode(stop.BusStopCode);
        const newFav: FavoriteStop = {
          BusStopCode: stop.BusStopCode,
          Description: directoryMatch?.Description ?? stop.Description,
          RoadName: directoryMatch?.RoadName ?? stop.RoadName,
          Region: directoryMatch?.Region ?? stop.Region,
          PinnedServices: pinnedServicesByStop[stop.BusStopCode] ?? [],
          AddedAt: Date.now(),
        };
        return [newFav, ...prev];
      });
    },
    [pinnedServicesByStop]
  );

  const handleRemoveFavorite = useCallback((code: string) => {
    setFavorites((prev) => prev.filter((item) => item.BusStopCode !== code));
  }, []);

  const handleUpdateNickname = useCallback((code: string, nickname: string) => {
    setFavorites((prev) =>
      prev.map((item) =>
        item.BusStopCode === code ? { ...item, Nickname: nickname || undefined } : item
      )
    );
  }, []);

  const handleMoveFavorite = useCallback((index: number, direction: 'up' | 'down') => {
    setFavorites((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const handleTogglePinService = useCallback((busStopCode: string, serviceNo: string) => {
    setPinnedServicesByStop((prev) => {
      const current = prev[busStopCode] ?? [];
      const exists = current.includes(serviceNo);
      const updated = exists
        ? current.filter((s) => s !== serviceNo)
        : [...current, serviceNo];

      setFavorites((favs) =>
        favs.map((f) =>
          f.BusStopCode === busStopCode ? { ...f, PinnedServices: updated } : f
        )
      );

      return { ...prev, [busStopCode]: updated };
    });
  }, []);

  const handleNavigate = useCallback((section: ActiveSection) => {
    setActiveSection(section);
    if (section === 'favorites') {
      document.getElementById('favorites-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'directory') {
      document.getElementById('directory-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F6F7F9] text-slate-900 pb-20 lg:pb-0">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onRefresh={() => void loadArrivals(activeStopCode)}
        isRefreshing={isLoading}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Top Search & Quick Stop Entry */}
        <section aria-label="Bus stop search" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-950">
                Real-Time Singapore Bus Arrivals
              </h2>
              <p className="text-sm text-slate-600">
                Look up any 5-digit bus stop code, MRT interchange, or road name.
              </p>
            </div>
          </div>

          <SearchBar
            activeStopCode={activeStopCode}
            recentCodes={recentCodes}
            favoriteCodes={favoriteCodes}
            onSelectStop={handleSelectStop}
            onToggleFavorite={handleToggleFavorite}
            inputRef={searchInputRef}
          />
        </section>

        {/* Main 2-Column Commuter Workspace (Desktop) / Tab-Focused (Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Primary Live Arrival Board */}
          <div
            className={`lg:col-span-8 ${
              activeSection === 'board' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ArrivalBoard
              arrivalData={arrivalData}
              isLoading={isLoading}
              nowMs={nowMs}
              secondsToNextRefresh={secondsToRefresh}
              autoRefreshEnabled={autoRefreshEnabled}
              onToggleAutoRefresh={() => setAutoRefreshEnabled((prev) => !prev)}
              onManualRefresh={() => void loadArrivals(activeStopCode)}
              isFavorite={favoriteCodes.has(activeStopCode)}
              pinnedServices={pinnedServicesByStop[activeStopCode] ?? []}
              onToggleFavorite={handleToggleFavorite}
              onTogglePinService={handleTogglePinService}
              onOpenApiModal={() => setIsApiModalOpen(true)}
              onSelectFallbackStop={handleSelectStop}
            />
          </div>

          {/* Right Rail: Saved Favorites & Stop Directory */}
          <aside className="lg:col-span-4 space-y-6">
            <div className={activeSection === 'favorites' ? 'block' : 'hidden lg:block'}>
              <FavoritesPanel
                favorites={favorites}
                activeStopCode={activeStopCode}
                onSelectStop={handleSelectStop}
                onRemoveFavorite={handleRemoveFavorite}
                onUpdateNickname={handleUpdateNickname}
                onMoveFavorite={handleMoveFavorite}
                onSeedPopularStops={() => setFavorites(DEFAULT_FAVORITES)}
              />
            </div>

            <div className={activeSection === 'directory' ? 'block' : 'hidden lg:block'}>
              <StopDirectoryPanel
                activeStopCode={activeStopCode}
                favoriteCodes={favoriteCodes}
                onSelectStop={handleSelectStop}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="hidden lg:block border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between text-xs text-slate-500">
          <span>NextBus SG · Singapore Transit Arrival Board (Frontend Preview)</span>
          <button
            type="button"
            onClick={() => setIsApiModalOpen(true)}
            className="font-medium text-slate-700 hover:text-slate-950 underline underline-offset-4 transition-colors"
          >
            LTA DataMall API Integration Guide
          </button>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar (Thumb Zone, compact 56px height) */}
      <nav
        aria-label="Mobile view switcher"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3"
      >
        <button
          type="button"
          onClick={() => setActiveSection('board')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeSection === 'board' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <Bus className="w-4 h-4" aria-hidden="true" />
          <span>Live Board</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('favorites')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeSection === 'favorites' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <Star
            className={`w-4 h-4 ${activeSection === 'favorites' ? 'fill-blue-700' : ''}`}
            aria-hidden="true"
          />
          <span>Favorites ({favorites.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('directory')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            activeSection === 'directory' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-4 h-4" aria-hidden="true" />
          <span>Directory</span>
        </button>
      </nav>

      <ApiIntegrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}
