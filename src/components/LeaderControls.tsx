import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Check, 
  RotateCcw, 
  Droplets, 
  Link as LinkIcon, 
  Share2, 
  AlertCircle,
  Clock,
  Moon,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { PLOT_ITEMS, ALPHABETIZED_PLOTS, AppState, ItemState } from '../types';

interface LeaderControlsProps {
  state: AppState;
  onToggleAvailable: (val?: boolean, plot?: string) => void;
  onWaterAllChecked: () => void;
  onReset: (type: 'checked' | 'watered' | 'all') => void;
  onTriggerNightlyReset: () => void;
  onToggleWatered: (id: string, watered: boolean, volunteerPlot?: string) => void;
}

export const LeaderControls: React.FC<LeaderControlsProps> = ({
  state,
  onToggleAvailable,
  onWaterAllChecked,
  onReset,
  onTriggerNightlyReset,
  onToggleWatered,
}) => {
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState<'checked' | 'watered' | 'all' | 'nightly' | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<string>(() => {
    if (!state.available) return '';
    return state.activeVolunteerPlot || (typeof window !== 'undefined' ? localStorage.getItem('water_volunteer_plot') || '' : '');
  });
  const [plotError, setPlotError] = useState(false);

  // Sync if active volunteer plot changes or if AVAILABLE is turned off
  React.useEffect(() => {
    if (!state.available) {
      setSelectedPlot('');
      setPlotError(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('water_volunteer_plot');
      }
    } else if (state.activeVolunteerPlot) {
      setSelectedPlot(state.activeVolunteerPlot);
    }
  }, [state.available, state.activeVolunteerPlot]);

  // Compute public request URL (without any leader param)
  const getVolunteerUrl = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.delete('role');
    url.searchParams.delete('pin');
    url.searchParams.set('role', 'volunteer');
    return url.toString();
  };

  const volunteerUrl = getVolunteerUrl();

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(volunteerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleClick = () => {
    if (!state.available) {
      // Trying to turn ON: Require choosing a plot first!
      if (!selectedPlot) {
        setPlotError(true);
        return;
      }
      setPlotError(false);
      onToggleAvailable(true, selectedPlot);
    } else {
      // Turning OFF: Reset dropdown menu to 'Choose Plot'
      setPlotError(false);
      setSelectedPlot('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('water_volunteer_plot');
      }
      onToggleAvailable(false, '');
    }
  };

  // Stats calculation strictly scoped to the valid 60 garden plots
  const validPlots: ItemState[] = PLOT_ITEMS.map(
    (id) => state.items[id] || { id, checked: false, watered: false }
  );
  const totalItems = PLOT_ITEMS.length;
  const checkedItems: ItemState[] = validPlots.filter((it) => it.checked);
  const checkedCount = checkedItems.length;
  const wateredCount = validPlots.filter((it) => it.watered).length;
  const checkedAndWateredCount = validPlots.filter((it) => it.checked && it.watered).length;
  const pendingWateringItems = checkedItems.filter((it) => !it.watered);
  const pendingWateringCount = pendingWateringItems.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-8">
      {/* Water Volunteer Mode Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-stone-100 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-wider">
            Water Volunteer
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Water Volunteer Control Panel</h2>
            <p className="text-xs text-stone-300">
              Select your plot, manage availability, review requested plots, and record completed watering.
            </p>
          </div>
        </div>

        {/* Available Toggle & Alphabetized Plot Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-stone-800/95 border border-stone-700 p-3 rounded-xl self-stretch lg:self-auto">
          {/* Alphabetized Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="volunteer-plot-dropdown" className="text-xs font-semibold text-stone-200 whitespace-nowrap">
              Your Plot:
            </label>
            <select
              id="volunteer-plot-dropdown"
              value={selectedPlot}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPlot(val);
                setPlotError(false);
                if (val && typeof window !== 'undefined') {
                  localStorage.setItem('water_volunteer_plot', val);
                }
              }}
              className={`bg-stone-900 text-stone-100 text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer ${
                plotError
                  ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/40 text-rose-200'
                  : 'border-stone-600 hover:border-stone-500'
              }`}
            >
              <option value="">Choose Plot</option>
              {ALPHABETIZED_PLOTS.map((plotId) => (
                <option key={plotId} value={plotId}>
                  Plot {plotId}
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-stone-700 hidden sm:block"></div>

          {/* Available Toggle Switch */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs font-bold text-stone-200">
              AVAILABLE:
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={state.available}
              onClick={handleToggleClick}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                state.available ? 'bg-emerald-600' : 'bg-stone-600'
              }`}
              title={!selectedPlot && !state.available ? 'Choose your plot from the list to turn ON' : 'Toggle Available'}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  state.available ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              state.available 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                : 'bg-stone-900 text-stone-400 border border-stone-700'
            }`}>
              {state.available ? 'ON (Open)' : 'OFF (Closed)'}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Prompt if toggled ON without choosing plot */}
      {plotError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-6 py-2.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Please choose your plot from the alphabetized drop down list before turning AVAILABLE on.</span>
          </div>
          <button
            type="button"
            onClick={() => setPlotError(false)}
            className="text-rose-600 hover:text-rose-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* State Explanation Banner */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          state.available
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${state.available ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div className="text-sm leading-relaxed">
            {state.available ? (
              <>
                <strong className="font-semibold text-emerald-950">AVAILABLE is currently ON:</strong> Gardeners can submit requests to water one or many plots. 
                {state.activeVolunteerPlot && (
                  <span className="ml-1 text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                    Water Volunteer on duty: Plot {state.activeVolunteerPlot}
                  </span>
                )}
              </>
            ) : (
              <>
                <strong className="font-semibold text-amber-950">AVAILABLE is currently OFF (Default):</strong> Gardeners viewing the page <span className="underline decoration-amber-400 font-semibold">only see which items were watered</span> along with timestamps. Select your plot above to turn AVAILABLE ON when starting watering duty.
              </>
            )}
          </div>
        </div>

        {/* Share URL Section */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-700" />
              <h3 className="font-semibold text-sm text-stone-900">
                Shareable URL for Request to Water
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              Gardeners opening this link can submit requests to water (when ON) or view the watered log (when OFF).
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-700 font-mono text-xs sm:text-sm select-all overflow-hidden truncate">
              <LinkIcon className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
              <span className="truncate">{volunteerUrl}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href={volunteerUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Open request view in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Test Link</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="text-xs font-medium text-stone-500 mb-1">Total Plots</div>
            <div className="text-2xl font-bold text-stone-900">{totalItems}</div>
            <div className="text-xs text-stone-500 mt-1">{totalItems} plots tracked</div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
            <div className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Requested to Water</span>
            </div>
            <div className="text-2xl font-bold text-amber-950">{checkedCount}</div>
            <div className="text-xs text-amber-700 mt-1">
              {checkedCount > 0 ? `${checkedCount} plots requested` : 'None requested yet'}
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80">
            <div className="text-xs font-medium text-blue-800 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Needs Water</span>
            </div>
            <div className="text-2xl font-bold text-blue-950">{pendingWateringCount}</div>
            <div className="text-xs text-blue-700 mt-1">Requested but not yet watered</div>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80">
            <div className="text-xs font-medium text-emerald-800 mb-1 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Watered</span>
            </div>
            <div className="text-2xl font-bold text-emerald-950">{wateredCount}</div>
            <div className="text-xs text-emerald-700 mt-1">
              {wateredCount} plots verified
            </div>
          </div>
        </div>

        {/* DEDICATED SEPARATE MECHANISM: Plots Needing Water Queue */}
        {pendingWateringCount > 0 && (
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-xl p-4.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-blue-950">
                    Water Volunteer Station: {pendingWateringCount} Requested Plots Pending Water
                  </h4>
                  <p className="text-xs text-blue-800">
                    Use these 1-click controls to mark each requested plot as watered:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onWaterAllChecked}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All ({pendingWateringCount}) Watered</span>
              </button>
            </div>

            {/* Quick list of pending items */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {pendingWateringItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-blue-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-2xs hover:border-blue-400 transition-all"
                >
                  <div>
                    <div className="font-black text-sm text-stone-900 leading-tight">Plot {item.id}</div>
                    <div className="text-[10px] text-stone-500 truncate max-w-[80px]" title={item.checkedBy || 'Request'}>
                      {item.checkedBy ? `by ${item.checkedBy}` : 'Requested'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleWatered(item.id, true, selectedPlot)}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    title={`Mark Plot ${item.id} as Watered`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Water</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nightly Reset & Leader Action Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-3 border-t border-stone-200">
          {/* Nightly 10 PM PST Reset schedule info */}
          <div className="flex items-center gap-2.5 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl">
            <Moon className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span><strong>Nightly Reset:</strong> All watered plots reset every night at <strong>10:00 PM PST</strong>.</span>
              {state.lastNightlyReset && (
                <span className="text-stone-500 block text-[11px]">
                  Last reset ran: {new Date(state.lastNightlyReset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} PST
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm('nightly')}
              className="ml-auto text-[11px] font-bold text-blue-700 hover:text-blue-900 underline shrink-0"
              title="Test the 10 PM PST reset function immediately"
            >
              Test 10 PM Reset
            </button>
          </div>

          {/* Reset Confirmation / Buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-rose-800 font-medium">
                  {showResetConfirm === 'nightly' 
                    ? 'Execute 10 PM PST reset now?' 
                    : `Confirm reset ${showResetConfirm}?`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (showResetConfirm === 'nightly') {
                      onTriggerNightlyReset();
                    } else {
                      onReset(showResetConfirm);
                    }
                    setShowResetConfirm(null);
                  }}
                  className="px-2 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                >
                  Yes, Execute
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(null)}
                  className="px-2 py-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm('checked')}
                  className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 flex items-center gap-1 transition-colors"
                  title="Clear plot requests"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Requests</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm('watered')}
                  className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 flex items-center gap-1 transition-colors"
                  title="Clear all watered markers"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Watered</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm('all')}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-1 transition-colors font-medium"
                  title="Clear both checks and watered"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>New Day Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
