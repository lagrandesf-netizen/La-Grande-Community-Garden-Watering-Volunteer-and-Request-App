import { useState, useEffect, useCallback, useTransition } from 'react';
import { Header } from './components/Header';
import { LeaderControls } from './components/LeaderControls';
import { ItemGrid } from './components/ItemGrid';
import { WateredViewOnly } from './components/WateredViewOnly';
import { GardenMap } from './components/GardenMap';
import { PinModal } from './components/PinModal';
import { PLOT_ITEMS, AppState, ItemState } from './types';
import { AlertCircle, CheckCircle, RefreshCw, Map as MapIcon, ListChecks, LayoutGrid } from 'lucide-react';

function sanitizeItems(rawItems?: Record<string, ItemState>): Record<string, ItemState> {
  const clean: Record<string, ItemState> = {};
  for (const id of PLOT_ITEMS) {
    clean[id] = rawItems?.[id] || {
      id,
      checked: false,
      checkedAt: null,
      checkedBy: null,
      watered: false,
      wateredAt: null,
      wateredBy: null,
    };
  }
  return clean;
}

function createInitialState(): AppState {
  return {
    available: false, // Default setting for AVAILABLE is off as requested
    activeVolunteerPlot: null,
    items: sanitizeItems(),
    leaderPin: '1234',
    title: 'Plot & Plant Watering Coordinator',
    lastUpdated: new Date().toISOString(),
    lastNightlyReset: null,
    lastNightlyResetDateKey: null,
    notice: 'Welcome! Request plots to water or check watered status.',
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(createInitialState);
  const [isLeader, setIsLeader] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'volunteer') return false;
    if (params.get('role') === 'leader') return true;
    const saved = localStorage.getItem('is_leader_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [volunteerName, setVolunteerName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('volunteer_name') || '';
  });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'map' | 'list' | 'both'>('both');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [, startTransition] = useTransition();

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  }, []);

  // Update volunteer name in localStorage
  const handleSetVolunteerName = (name: string) => {
    setVolunteerName(name);
    localStorage.setItem('volunteer_name', name);
  };

  // Fetch current state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        startTransition(() => {
          setState((prev) => ({
            ...prev,
            ...data,
            items: sanitizeItems(data.items),
          }));
          setIsOnline(true);
        });
      }
    } catch (err) {
      console.warn('Failed to fetch state from server:', err);
      setIsOnline(false);
    }
  }, []);

  // Real-time synchronization via SSE
  useEffect(() => {
    fetchState();

    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/stream');
        eventSource.onopen = () => {
          setIsOnline(true);
        };
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            startTransition(() => {
              setState((prev) => ({
                ...prev,
                ...data,
                items: sanitizeItems(data.items),
              }));
              setIsOnline(true);
            });
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        };
        eventSource.onerror = () => {
          setIsOnline(false);
          eventSource?.close();
          retryTimeout = setTimeout(setupSSE, 4000);
        };
      } catch (err) {
        setIsOnline(false);
        retryTimeout = setTimeout(setupSSE, 5000);
      }
    };

    setupSSE();

    // Secondary fallback poll every 10 seconds
    const interval = setInterval(fetchState, 10000);

    return () => {
      eventSource?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      clearInterval(interval);
    };
  }, [fetchState]);

  // Toggle leader / water volunteer role
  const handleToggleRole = () => {
    if (isLeader) {
      setIsLeader(false);
      localStorage.setItem('is_leader_mode', 'false');
      showToast('Switched to Request to Water view (what garden users see)', 'info');
    } else {
      setShowPinModal(true);
    }
  };

  const handleLeaderUnlockSuccess = () => {
    setIsLeader(true);
    localStorage.setItem('is_leader_mode', 'true');
    showToast('Water Volunteer mode activated', 'success');
  };

  // Water Volunteer: Toggle Available (requires choosing plot before turning ON)
  const handleToggleAvailable = async (targetVal?: boolean, plotParam?: string) => {
    const nextVal = targetVal !== undefined ? targetVal : !state.available;
    const chosenPlot = plotParam || state.activeVolunteerPlot;

    if (nextVal && !chosenPlot) {
      showToast('Please choose your plot from the drop down list before turning AVAILABLE on.', 'error');
      return;
    }

    if (!nextVal && typeof window !== 'undefined') {
      localStorage.removeItem('water_volunteer_plot');
    }

    setState((prev) => ({
      ...prev,
      available: nextVal,
      activeVolunteerPlot: nextVal ? chosenPlot : null,
    }));

    try {
      const res = await fetch('/api/toggle-available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: nextVal, volunteerPlot: chosenPlot }),
      });
      if (res.ok) {
        showToast(
          nextVal 
            ? `AVAILABLE turned ON by Water Volunteer (Plot ${chosenPlot}). Gardeners can now submit requests to water.` 
            : 'AVAILABLE turned OFF. Gardeners can view only what was watered.',
          nextVal ? 'success' : 'info'
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update status');
      }
    } catch (err: unknown) {
      fetchState();
      const msg = err instanceof Error ? err.message : 'Failed to update AVAILABLE status. Please try again.';
      showToast(msg, 'error');
    }
  };

  // Toggle item checkbox (Request to Water)
  const handleToggleCheck = async (id: string, newChecked: boolean) => {
    if (!state.available && !isLeader) {
      showToast('Requests are currently unavailable. The water volunteer has set AVAILABLE to OFF.', 'error');
      return;
    }

    setState((prev) => {
      const existing = prev.items[id] || { id, checked: false, watered: false };
      return {
        ...prev,
        items: {
          ...prev.items,
          [id]: {
            ...existing,
            checked: newChecked,
            checkedAt: newChecked ? new Date().toISOString() : null,
            checkedBy: newChecked ? (volunteerName.trim() || 'Request') : null,
          },
        },
      };
    });

    try {
      const res = await fetch('/api/items/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          checked: newChecked,
          checkedBy: volunteerName.trim() || undefined,
          isLeader,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update plot checkbox');
      }
    } catch (err: unknown) {
      fetchState();
      const message = err instanceof Error ? err.message : 'Network error updating checkbox';
      showToast(message, 'error');
    }
  };

  // Water Volunteer: Toggle Watered for an item (records Watered by with plot number)
  const handleToggleWatered = async (id: string, newWatered: boolean, plotParam?: string) => {
    const volunteerPlotNumber = plotParam || state.activeVolunteerPlot || (typeof window !== 'undefined' ? localStorage.getItem('water_volunteer_plot') : '') || '';
    const recordedWateredBy = newWatered 
      ? (volunteerPlotNumber ? `Plot ${volunteerPlotNumber}` : 'Water Volunteer')
      : null;

    setState((prev) => {
      const existing = prev.items[id] || { id, checked: false, watered: false };
      return {
        ...prev,
        items: {
          ...prev.items,
          [id]: {
            ...existing,
            watered: newWatered,
            wateredAt: newWatered ? new Date().toISOString() : null,
            wateredBy: recordedWateredBy,
          },
        },
      };
    });

    try {
      const res = await fetch('/api/items/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          watered: newWatered,
          wateredBy: recordedWateredBy,
          volunteerPlot: volunteerPlotNumber,
        }),
      });

      if (res.ok) {
        showToast(
          newWatered 
            ? `Plot ${id} marked as Watered (Watered by: ${recordedWateredBy})` 
            : `Plot ${id} unmarked as Watered`,
          'success'
        );
      } else {
        throw new Error('Failed to update watered status');
      }
    } catch (err) {
      fetchState();
      showToast(`Failed to update watered status for Plot ${id}`, 'error');
    }
  };

  // Water Volunteer: Mark All Checked Items Watered (records Watered by with plot number)
  const handleWaterAllChecked = async () => {
    const volunteerPlotNumber = state.activeVolunteerPlot || (typeof window !== 'undefined' ? localStorage.getItem('water_volunteer_plot') : '') || '';
    const recordedWateredBy = volunteerPlotNumber ? `Plot ${volunteerPlotNumber}` : 'Water Volunteer';

    try {
      const res = await fetch('/api/items/water-all-checked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wateredBy: recordedWateredBy,
          volunteerPlot: volunteerPlotNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Marked ${data.updatedCount} requested items as watered (Watered by: ${recordedWateredBy})!`, 'success');
        fetchState();
      }
    } catch (err) {
      showToast('Error marking all checked items as watered', 'error');
    }
  };

  // Leader: Reset Actions
  const handleReset = async (type: 'checked' | 'watered' | 'all') => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        showToast(`Successfully reset ${type === 'all' ? 'all items' : type}!`, 'info');
        fetchState();
      }
    } catch (err) {
      showToast('Failed to perform reset', 'error');
    }
  };

  // Leader: Trigger 10 PM PST Nightly Reset
  const handleTriggerNightlyReset = async () => {
    try {
      const res = await fetch('/api/trigger-nightly-reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`10 PM PST Nightly Reset executed! Reset ${data.resetCount} watered plots.`, 'success');
        fetchState();
      }
    } catch (err) {
      showToast('Error triggering 10 PM PST reset', 'error');
    }
  };

  const pendingCount = PLOT_ITEMS.filter((id) => state.items[id]?.checked && !state.items[id]?.watered).length;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toast.type === 'info'
                ? 'bg-stone-900 text-white border-stone-700'
                : 'bg-emerald-800 text-white border-emerald-600'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* PIN Authentication Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleLeaderUnlockSuccess}
      />

      {/* Main Header */}
      <Header
        isLeader={isLeader}
        onToggleRole={handleToggleRole}
        isOnline={isOnline}
        available={state.available}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Leader Control Panel (Shown when Leader Mode is active) */}
        {isLeader && (
          <LeaderControls
            state={state}
            onToggleAvailable={handleToggleAvailable}
            onWaterAllChecked={handleWaterAllChecked}
            onReset={handleReset}
            onTriggerNightlyReset={handleTriggerNightlyReset}
            onToggleWatered={handleToggleWatered}
          />
        )}

        {/* View Toggle Bar (Plot Map vs. Checklist Queue) */}
        {(isLeader || state.available) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Display Mode:
              </span>
              <div className="inline-flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewTab('map')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                    viewTab === 'map'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Garden Plot Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('list')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                    viewTab === 'list'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {isLeader ? `Needs Water Queue (${pendingCount})` : 'Checklist'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('both')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                    viewTab === 'both'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-stone-600" />
                  <span>Map & Queue</span>
                </button>
              </div>
            </div>

            {isLeader && (
              <div className="text-xs text-stone-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Water Volunteer view: Showing plots requested for watering and not yet watered</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic View Logic:
            1. If AVAILABLE is OFF and user is not Leader:
               When AVAILABLE is off other users can view only what items were watered.
            2. Otherwise, show Map / Queue / Both as selected
        */}
        {!state.available && !isLeader ? (
          <div className="space-y-6">
            <WateredViewOnly state={state} />
            {/* Also allow users in view-only mode to see the plot map with watered highlights */}
            <div className="mt-8">
              <h3 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-emerald-700" />
                <span>Visual Garden Status Map</span>
              </h3>
              <GardenMap
                state={state}
                isLeader={false}
                onToggleWatered={handleToggleWatered}
                onToggleCheck={handleToggleCheck}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show Garden Map if 'map' or 'both' */}
            {(viewTab === 'map' || viewTab === 'both') && (
              <GardenMap
                state={state}
                isLeader={isLeader}
                onToggleWatered={handleToggleWatered}
                onToggleCheck={handleToggleCheck}
              />
            )}

            {/* Show ItemGrid (Default filtered to pending for leader) if 'list' or 'both' */}
            {(viewTab === 'list' || viewTab === 'both') && (
              <div>
                {viewTab === 'both' && (
                  <h3 className="text-base font-bold text-stone-900 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-blue-600" />
                      <span>{isLeader ? 'Water Volunteer Action Queue & Plot List' : 'Request to Water Plot List'}</span>
                    </span>
                    {isLeader && (
                      <span className="text-xs font-normal text-stone-500">
                        Default: Plots requested for watering & not yet watered
                      </span>
                    )}
                  </h3>
                )}
                <ItemGrid
                  state={state}
                  isLeader={isLeader}
                  volunteerName={volunteerName}
                  onSetVolunteerName={handleSetVolunteerName}
                  onToggleCheck={handleToggleCheck}
                  onToggleWatered={handleToggleWatered}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Minimalistic Garden Footer */}
      <footer className="bg-stone-200/80 border-t border-stone-300 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>La Grande Community Garden Plot Coordinator</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px]">{PLOT_ITEMS.length} Total Plots (Plots 2-38B, A-E, Herbs, Apple Tree Area, Flowers)</span>
            <span>•</span>
            <button
              onClick={() => fetchState()}
              className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
