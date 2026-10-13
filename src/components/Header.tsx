import React from 'react';
import { Droplet, Shield, User, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isLeader: boolean;
  onToggleRole: () => void;
  isOnline: boolean;
  available: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isLeader,
  onToggleRole,
  isOnline,
  available,
}) => {
  return (
    <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-700/80 rounded-xl shadow-inner border border-emerald-500/30 text-emerald-200">
              <Droplet className="w-6 h-6 fill-emerald-300 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Plot & Plant Watering
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  available 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${available ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {available ? 'AVAILABLE' : 'OFF / VIEW-ONLY'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/80">
                Community Garden Watering Checklist & Status Board
              </p>
            </div>
          </div>

          {/* Connection status for mobile */}
          <div className="sm:hidden flex items-center">
            {isOnline ? (
              <span title="Live connected" className="text-emerald-400 p-1">
                <Wifi className="w-4 h-4" />
              </span>
            ) : (
              <span title="Offline" className="text-amber-400 p-1">
                <WifiOff className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* Right side: Role switch & status */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="hidden sm:flex items-center text-xs text-emerald-200 bg-emerald-950/60 px-2.5 py-1.5 rounded-lg border border-emerald-700/50">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Wifi className="w-3.5 h-3.5" />
                <span>Live Sync</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Reconnecting...</span>
              </span>
            )}
          </div>

          {/* Role Mode Toggle Button */}
          <button
            onClick={onToggleRole}
            type="button"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${
              isLeader
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 border border-amber-400 font-semibold'
                : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700 border border-emerald-600'
            }`}
          >
            {isLeader ? (
              <>
                <Shield className="w-4 h-4 text-stone-950" />
                <span>Water Volunteer</span>
                <span className="text-xs opacity-75 ml-1">(Switch to Request to Water)</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-emerald-200" />
                <span>Request to Water</span>
                <span className="text-xs opacity-75 ml-1">(Switch to Water Volunteer)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
