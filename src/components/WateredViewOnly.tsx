import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Search, 
  Clock, 
  Calendar, 
  Moon, 
  ShieldAlert, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { PLOT_ITEMS, AppState, ItemState } from '../types';

interface WateredViewOnlyProps {
  state: AppState;
}

// Format date and time in Pacific Time (PST/PDT)
function formatPstDateTime(isoString?: string | null): { date: string; time: string; full: string } {
  if (!isoString) return { date: 'N/A', time: 'N/A', full: 'N/A' };
  try {
    const d = new Date(isoString);
    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);

    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(d);

    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr} at ${timeStr}`,
    };
  } catch {
    return { date: 'Recent', time: 'Recently', full: 'Recently' };
  }
}

export const WateredViewOnly: React.FC<WateredViewOnlyProps> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // By default, as requested, users should only see which items have been marked as watered
  const [viewMode, setViewMode] = useState<'watered_only' | 'all'>('watered_only');

  const wateredPlots: ItemState[] = useMemo(() => {
    return PLOT_ITEMS.map((id) => state.items[id] || { id, watered: false, checked: false })
      .filter((item) => item.watered);
  }, [state.items]);

  const filteredItems = useMemo(() => {
    const sourceList = viewMode === 'watered_only' 
      ? wateredPlots 
      : PLOT_ITEMS.map((id) => state.items[id] || { id, watered: false, checked: false });

    if (!searchTerm.trim()) return sourceList;

    const q = searchTerm.toLowerCase().trim();
    return sourceList.filter((item) => item.id.toLowerCase().includes(q));
  }, [viewMode, wateredPlots, state.items, searchTerm]);

  const lastResetInfo = formatPstDateTime(state.lastNightlyReset);

  return (
    <div className="space-y-6">
      {/* Off State & Nightly Reset Schedule Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-stone-100 rounded-2xl p-6 border border-amber-800/40 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-300 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1.5">
                <span>AVAILABLE: OFF</span>
                <span>•</span>
                <span>Watered Status View</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Completed Watering Log
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
                Plot selection is closed. Below is the live record of all plots marked as watered, including the exact date and time.
              </p>
            </div>
          </div>

          {/* Nightly 10 PM PST Reset badge */}
          <div className="bg-stone-800/90 border border-stone-700/80 rounded-xl p-3.5 shrink-0 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg">
              <Moon className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Nightly Reset</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-900/60 text-blue-200 rounded font-mono">10 PM PST</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                All watered plots reset every night at 10:00 PM PST
              </div>
              {state.lastNightlyReset && (
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Last reset: {lastResetInfo.date} {lastResetInfo.time}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control bar: Search & View Toggle */}
      <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search watered plot # (e.g. 3A, 14, 35B)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('watered_only')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'watered_only'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 fill-current" />
            <span>Watered Only ({wateredPlots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'all'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full Garden ({PLOT_ITEMS.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content: Watered Items List */}
      {viewMode === 'watered_only' ? (
        wateredPlots.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-1">
              <span>Displaying {filteredItems.length} of {wateredPlots.length} Watered Plots</span>
              <span className="text-emerald-700">All times displayed in Pacific Standard/Daylight Time (PST/PDT)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const { date, time } = formatPstDateTime(item.wateredAt);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-emerald-300/80 shadow-xs p-4 flex flex-col justify-between hover:shadow-sm transition-all ring-1 ring-emerald-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`${item.id.length > 5 ? 'px-2.5 py-1.5' : 'w-12 h-12'} rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0 text-center`}>
                          <span className={`${item.id.length > 5 ? 'text-xs' : 'text-base'} leading-tight`}>{item.id}</span>
                          {!item.id.includes('Plot') && (
                            <span className="text-[9px] font-normal uppercase opacity-80 mt-0.5">Plot</span>
                          )}
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WATERED</span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                            <span>Watered by:</span>
                            <strong className="text-emerald-800 font-bold">{item.wateredBy || 'Water Volunteer'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Droplet className="w-5 h-5 fill-emerald-500 text-emerald-600" />
                      </div>
                    </div>

                    {/* Date and Time Section (Prominent as requested) */}
                    <div className="mt-4 pt-3 border-t border-stone-100 bg-emerald-50/50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-xl">
                      <div className="flex items-center justify-between text-xs text-stone-700 mb-1">
                        <span className="flex items-center gap-1 text-stone-500 font-medium">
                          <Droplet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Watered by:</span>
                        </span>
                        <span className="font-bold text-emerald-900 font-mono text-xs">
                          {item.wateredBy || 'Water Volunteer'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-700 mb-1">
                        <span className="flex items-center gap-1 text-stone-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Date:</span>
                        </span>
                        <span className="font-semibold text-stone-900 font-mono text-[11px] sm:text-xs">
                          {date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-700">
                        <span className="flex items-center gap-1 text-stone-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Time:</span>
                        </span>
                        <span className="font-bold text-emerald-900 font-mono text-xs">
                          {time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State when no items have been marked as watered */
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Droplet className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">No Watered Plots Recorded Yet</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              No plots have been marked as watered for this session. When the water volunteer marks plots as watered, they will appear here with the exact date and time.
            </p>
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-stone-500">
              <Moon className="w-3.5 h-3.5 text-blue-500" />
              <span>All watered plots reset automatically every night at <strong>10:00 PM PST</strong>.</span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Browse Full {PLOT_ITEMS.length} Plot Directory
            </button>
          </div>
        )
      ) : (
        /* Full Grid Directory (If user clicks Full Garden) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredItems.map((item) => {
            const isWatered = item.watered;
            const { date, time } = formatPstDateTime(item.wateredAt);

            return (
              <div
                key={item.id}
                className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                  isWatered
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                    : 'bg-white border-stone-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Plot</span>
                    <div className="text-lg font-black text-stone-900">{item.id}</div>
                  </div>
                  {isWatered ? (
                    <div className="p-1 bg-emerald-600 text-white rounded-md">
                      <Droplet className="w-3.5 h-3.5 fill-white" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold">Unwatered</span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 text-xs">
                  {isWatered ? (
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800">💧 Watered by {item.wateredBy || 'Volunteer'}</div>
                      <div className="text-[10px] font-mono text-emerald-700 mt-0.5 truncate">{date}</div>
                      <div className="text-[10px] font-mono text-emerald-900 font-bold truncate">{time}</div>
                    </div>
                  ) : (
                    <span className="text-stone-400 text-[11px]">Not marked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
