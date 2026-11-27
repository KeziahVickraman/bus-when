import { ArrowDown, ArrowUp, Check, Pencil, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { FavoriteStop } from '../types/bus';

interface FavoritesPanelProps {
  favorites: FavoriteStop[];
  activeStopCode: string;
  onSelectStop: (code: string) => void;
  onRemoveFavorite: (code: string) => void;
  onUpdateNickname: (code: string, nickname: string) => void;
  onMoveFavorite: (index: number, direction: 'up' | 'down') => void;
  onSeedPopularStops: () => void;
}

export function FavoritesPanel({
  favorites,
  activeStopCode,
  onSelectStop,
  onRemoveFavorite,
  onUpdateNickname,
  onMoveFavorite,
  onSeedPopularStops,
}: FavoritesPanelProps) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draftNickname, setDraftNickname] = useState('');

  function startEditing(fav: FavoriteStop) {
    setEditingCode(fav.BusStopCode);
    setDraftNickname(fav.Nickname ?? '');
  }

  function saveNickname(code: string) {
    onUpdateNickname(code, draftNickname.trim());
    setEditingCode(null);
  }

  return (
    <section
      aria-labelledby="favorites-heading"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 id="favorites-heading" className="font-display text-base font-bold text-slate-900">
            Saved Favorites
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {favorites.length} {favorites.length === 1 ? 'bus stop' : 'bus stops'} saved locally
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Star className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">No favorite stops yet</p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Star any bus stop from the search bar or arrival board for one-tap access during your commute.
            </p>
          </div>
          <button
            type="button"
            onClick={onSeedPopularStops}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Add popular Singapore stops
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {favorites.map((fav, index) => {
            const isActive = fav.BusStopCode === activeStopCode;
            const isEditing = editingCode === fav.BusStopCode;

            return (
              <li
                key={fav.BusStopCode}
                className={`transition-colors ${
                  isActive ? 'bg-blue-50/55' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="px-4 py-3.5 flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectStop(fav.BusStopCode)}
                    className="flex-1 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-lg p-1 -m-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isActive
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {fav.BusStopCode}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {fav.Nickname || fav.Description}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-500 truncate flex items-center gap-1.5">
                      {fav.Nickname && (
                        <>
                          <span className="text-slate-700 font-medium truncate">
                            {fav.Description}
                          </span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span>{fav.RoadName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{fav.Region}</span>
                    </div>

                    {fav.PinnedServices && fav.PinnedServices.length > 0 && (
                      <div className="mt-1.5 text-xs text-slate-600 font-mono tabular-nums truncate">
                        Pinned: {fav.PinnedServices.join(', ')}
                      </div>
                    )}
                  </button>

                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onMoveFavorite(index, 'up')}
                      disabled={index === 0}
                      aria-label={`Move ${fav.Description} up`}
                      className="min-h-[36px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-md transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveFavorite(index, 'down')}
                      disabled={index === favorites.length - 1}
                      aria-label={`Move ${fav.Description} down`}
                      className="min-h-[36px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-md transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(fav)}
                      aria-label={`Rename ${fav.Description}`}
                      className="min-h-[36px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(fav.BusStopCode)}
                      aria-label={`Remove ${fav.Description} from favorites`}
                      className="min-h-[36px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-3.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={draftNickname}
                      onChange={(e) => setDraftNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNickname(fav.BusStopCode);
                        if (e.key === 'Escape') setEditingCode(null);
                      }}
                      placeholder="Label (e.g. Home, Office, MRT)"
                      aria-label="Custom stop nickname"
                      autoFocus
                      className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => saveNickname(fav.BusStopCode)}
                      aria-label="Save nickname"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCode(null)}
                      aria-label="Cancel nickname edit"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
