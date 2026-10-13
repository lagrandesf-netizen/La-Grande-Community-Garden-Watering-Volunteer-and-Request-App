import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  CheckSquare, 
  Square, 
  Search, 
  Filter, 
  UserCheck, 
  Clock, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { PLOT_ITEMS, AppState, ItemState } from '../types';

interface ItemGridProps {
  state: AppState;
  isLeader: boolean;
  volunteerName: string;
  onSetVolunteerName: (name: string) => void;
  onToggleCheck: (id: string, newChecked: boolean) => void;
  onToggleWatered: (id: string, newWatered: boolean) => void;
  onSelectMultiple?: (ids: string[], checked: boolean) => void;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  state,
  isLeader,
  volunteerName,
  onSetVolunteerName,
  onToggleCheck,
  onToggleWatered,
}) => {
  const [search, setSearch] = useState('');
  // Leader should see by default only plots that have been checked for watering and not checked as watered
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending' | 'watered'>(() => {
    return isLeader ? 'pending' : 'all';
  });

  // When role changes, ensure leader defaults to pending
  React.useEffect(() => {
    if (isLeader) {
      setFilter('pending');
    }
  }, [isLeader]);

  // Filter items
  const filteredItems = useMemo(() => {
    return PLOT_ITEMS.filter((id) => {
      const item: ItemState = state.items[id] || {
        id,
        checked: false,
        watered: false,
      };

      // Search matching
      if (search.trim() !== '') {
        const q = search.toLowerCase().trim();
        const matchesId = id.toLowerCase().includes(q);
        const matchesUser = item.checkedBy?.toLowerCase().includes(q);
        if (!matchesId && !matchesUser) return false;
      }

      // Filter matching
      if (filter === 'checked' && !item.checked) return false;
      if (filter === 'pending' && (!item.checked || item.watered)) return false;
      if (filter === 'watered' && !item.watered) return false;

      return true;
    });
  }, [state.items, search, filter]);

  const validItems: ItemState[] = PLOT_ITEMS.map(
    (id) => state.items[id] || { id, checked: false, watered: false }
  );
  const totalCount = PLOT_ITEMS.length;
  const checkedCount = validItems.filter((i) => i.checked).length;
  const pendingCount = validItems.filter((i) => i.checked && !i.watered).length;
  const wateredCount = validItems.filter((i) => i.watered).length;

  return (
    <div className="space-y-5">
      {/* Request to Water Mode Header / Instructions */}
      {!isLeader && (
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AVAILABLE is ON</span>
                <span>•</span>
                <span>Request to Water Active</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900">
                Request Plots to be Watered
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                Select one or multiple plots from the list below. The water volunteer will see your requests and confirm when watered.
              </p>
            </div>

            {/* Optional Volunteer / Plot Owner Name */}
            <div className="sm:w-64 bg-stone-50 border border-stone-200 rounded-xl p-2.5">
              <label htmlFor="volunteer-name-input" className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                Your Name / Plot Owner (optional)
              </label>
              <input
                id="volunteer-name-input"
                type="text"
                placeholder="e.g. Maria, Plot 3A"
                value={volunteerName}
                onChange={(e) => onSetVolunteerName(e.target.value)}
                className="w-full text-xs sm:text-sm px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500">
              Requested plots: <strong className="text-emerald-700 font-bold">{checkedCount}</strong> of {totalCount}
            </span>
            {checkedCount > 0 && (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Water volunteer is notified in real time</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plot # (e.g. 2, 3A, 26B, 43)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('checked')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              filter === 'checked'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'text-stone-600 hover:text-amber-700'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>Requested ({checkedCount})</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              filter === 'pending'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-stone-600 hover:text-blue-700'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Needs Water ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilter('watered')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              filter === 'watered'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-stone-600 hover:text-emerald-700'
            }`}
          >
            <Droplet className="w-3 h-3 fill-current" />
            <span>Watered ({wateredCount})</span>
          </button>
        </div>
      </div>

      {/* Grid of Plots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredItems.map((id) => {
          const item: ItemState = state.items[id] || {
            id,
            checked: false,
            watered: false,
          };
          const isChecked = item.checked;
          const isWatered = item.watered;

          return (
            <div
              key={id}
              className={`rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                isWatered
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                  : isChecked
                  ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-200'
                  : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              {/* Top Row: Plot ID + Status badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`${id.length > 5 ? 'text-base' : 'text-xl'} font-extrabold text-stone-900 tracking-tight leading-snug`}>
                    {id}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
                    {['Herbs', 'Apple Tree Area', 'Flowers'].includes(id) ? 'Public' : 'Plot'}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1">
                  {isWatered && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                      <Droplet className="w-3 h-3 fill-white" />
                      <span>Watered</span>
                    </span>
                  )}
                  {!isWatered && isChecked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Section: Checkbox controls */}
              <div className="space-y-2.5">
                {/* 1. Item Selection Checkbox (For other users / volunteers) */}
                <div
                  onClick={() => onToggleCheck(id, !isChecked)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-white border-amber-400 text-amber-950 font-medium'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold">
                      {isChecked ? 'Requested to Water' : 'Request to Water'}
                    </span>
                  </div>
                  {isChecked && item.checkedBy && (
                    <span className="text-[11px] text-amber-800 font-normal truncate max-w-[90px]" title={item.checkedBy}>
                      by {item.checkedBy}
                    </span>
                  )}
                </div>

                {/* 2. WATER VOLUNTEER "WATERED" CHECKBOX */}
                {isLeader ? (
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      isChecked
                        ? isWatered
                          ? 'bg-emerald-100/90 border-emerald-400'
                          : 'bg-blue-50/80 border-blue-300'
                        : 'bg-stone-50/60 border-stone-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label 
                        className={`flex items-center gap-2 text-xs font-bold cursor-pointer select-none ${
                          isChecked ? 'text-stone-900' : 'text-stone-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatered(id, !isWatered);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isWatered}
                          onChange={(e) => onToggleWatered(id, e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          <Droplet className={`w-3.5 h-3.5 ${isWatered ? 'fill-emerald-600 text-emerald-600' : 'text-stone-400'}`} />
                          <span>Water Volunteer: Mark Watered</span>
                        </span>
                      </label>

                      {isWatered && (
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-emerald-800 block">
                            {item.wateredAt ? new Date(item.wateredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'}
                          </span>
                          {item.wateredBy && (
                            <span className="text-[10px] font-semibold text-emerald-900 block">
                              by {item.wateredBy}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isChecked && (
                      <p className="text-[10px] text-stone-400 mt-1 pl-6">
                        (Plot not requested yet)
                      </p>
                    )}
                  </div>
                ) : (
                  /* Gardener view: if already watered, display confirmation */
                  isWatered && (
                    <div className="bg-emerald-100/60 border border-emerald-300 rounded-lg p-2 text-xs text-emerald-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <Droplet className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span>Watered by {item.wateredBy || 'Water Volunteer'}</span>
                      </span>
                      {item.wateredAt && (
                        <span className="text-[10px] font-mono text-emerald-700">
                          {new Date(item.wateredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Bottom footer: timestamps */}
              <div className="mt-3 pt-2 border-t border-stone-200/50 flex items-center justify-between text-[10px] text-stone-400">
                {isChecked && item.checkedAt ? (
                  <span className="truncate">
                    Checked {new Date(item.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span>Available</span>
                )}

                {isWatered && (
                  <span className="text-emerald-700 font-semibold">✓ Completed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-stone-200 text-stone-500 max-w-lg mx-auto shadow-2xs">
          {isLeader && filter === 'pending' ? (
            <div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-stone-900">No Plots Currently Pending Watering</h4>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-sm mx-auto">
                All plots checked by volunteers have already been marked as watered, or volunteers haven't checked any plots yet.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  View All {totalCount} Plots
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('watered')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  View Watered Plots ({wateredCount})
                </button>
              </div>
            </div>
          ) : (
            <div>
              <HelpCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No plots found matching current criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
                className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
