import { RefreshCw } from 'lucide-react';

export type ActiveSection = 'board' | 'favorites' | 'directory';

interface HeaderProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  onOpenApiModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({
  activeSection,
  onNavigate,
  onOpenApiModal,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  return (
    <header className="md:sticky md:top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('board');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-sm"
        >
          NextBus SG
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onNavigate('board')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
              activeSection === 'board'
                ? 'text-slate-950 border-blue-700'
                : 'border-transparent hover:text-slate-950 hover:border-slate-300'
            }`}
          >
            Live Board
          </button>
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
              activeSection === 'favorites'
                ? 'text-slate-950 border-blue-700'
                : 'border-transparent hover:text-slate-950 hover:border-slate-300'
            }`}
          >
            Favorites
          </button>
          <button
            type="button"
            onClick={() => onNavigate('directory')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
              activeSection === 'directory'
                ? 'text-slate-950 border-blue-700'
                : 'border-transparent hover:text-slate-950 hover:border-slate-300'
            }`}
          >
            Stop Directory
          </button>
          <button
            type="button"
            onClick={onOpenApiModal}
            className="py-1 border-b-2 border-transparent hover:text-slate-950 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            API Setup
          </button>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
