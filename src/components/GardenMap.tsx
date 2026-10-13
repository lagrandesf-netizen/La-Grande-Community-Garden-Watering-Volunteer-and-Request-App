import React, { useState } from 'react';
import { Droplet, Check, Clock, X, Compass, Filter } from 'lucide-react';
import { AppState, ItemState } from '../types';

interface GardenMapProps {
  state: AppState;
  isLeader: boolean;
  onToggleWatered: (id: string, watered: boolean) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
}

export const GardenMap: React.FC<GardenMapProps> = ({
  state,
  isLeader,
  onToggleWatered,
  onToggleCheck,
}) => {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);

  const selectedItem: ItemState | null = selectedPlotId
    ? state.items[selectedPlotId] || { id: selectedPlotId, checked: false, watered: false }
    : null;

  // Determine styling for each plot shape
  const getPlotClasses = (id: string, isPublicArea: boolean = false) => {
    const item = state.items[id];
    const isChecked = item?.checked;
    const isWatered = item?.watered;
    const isPending = isChecked && !isWatered;

    if (filterPendingOnly && !isPending) {
      return {
        fill: '#f3f4f6',
        stroke: '#d1d5db',
        strokeWidth: 1,
        opacity: 0.35,
        textColor: '#9ca3af',
      };
    }

    if (isWatered) {
      return {
        fill: '#10b981', // emerald-500
        stroke: '#047857', // emerald-700
        strokeWidth: 2,
        opacity: 1,
        textColor: '#ffffff',
      };
    }

    if (isPending) {
      return {
        fill: '#f59e0b', // amber-500 (Needs water!)
        stroke: '#b45309', // amber-700
        strokeWidth: 2.5,
        opacity: 1,
        textColor: '#ffffff',
        pulse: true,
      };
    }

    if (isChecked) {
      return {
        fill: '#fde68a', // amber-200
        stroke: '#d97706',
        strokeWidth: 1.5,
        opacity: 1,
        textColor: '#78350f',
      };
    }

    if (isPublicArea || id === 'Herbs' || id === 'Apple Tree Area' || id === 'Flowers') {
      return {
        fill: '#86efac', // light green for public
        stroke: '#16a34a',
        strokeWidth: 1.2,
        opacity: 0.95,
        textColor: '#14532d',
      };
    }

    // Default unwatered / available plot
    return {
      fill: '#ffffff',
      stroke: '#0f172a',
      strokeWidth: 1.2,
      opacity: 0.95,
      textColor: '#0f172a',
    };
  };

  const handlePlotClick = (id: string) => {
    setSelectedPlotId(id);
  };

  // Render SVG rectangle with text
  const renderRect = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    label?: string,
    isPublicArea: boolean = false,
    multiline?: string[]
  ) => {
    const style = getPlotClasses(id, isPublicArea);
    const item = state.items[id];
    const isSelected = selectedPlotId === id;
    const isPending = item?.checked && !item?.watered;

    return (
      <g
        key={id}
        onClick={() => handlePlotClick(id)}
        className="cursor-pointer transition-transform hover:opacity-90 select-none group"
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={2}
          fill={style.fill}
          stroke={isSelected ? '#2563eb' : style.stroke}
          strokeWidth={isSelected ? 3 : style.strokeWidth}
          opacity={style.opacity}
          className="transition-colors duration-200"
        />
        {/* Pulse outline for pending plots */}
        {isPending && (
          <rect
            x={x - 2}
            y={y - 2}
            width={width + 4}
            height={height + 4}
            rx={4}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 2"
            className="animate-pulse pointer-events-none"
          />
        )}
        {multiline ? (
          <text
            x={x + width / 2}
            y={y + height / 2 - (multiline.length - 1) * 6}
            textAnchor="middle"
            fill={style.textColor}
            fontSize={width < 45 || height < 40 ? 9 : 10}
            fontWeight="bold"
            className="pointer-events-none select-none font-sans"
          >
            {multiline.map((line, idx) => (
              <tspan key={idx} x={x + width / 2} dy={idx === 0 ? 0 : 12}>
                {line}
              </tspan>
            ))}
          </text>
        ) : (
          <text
            x={x + width / 2}
            y={y + height / 2 + 4}
            textAnchor="middle"
            fill={style.textColor}
            fontSize={width < 32 || height < 30 ? 10 : 12}
            fontWeight="bold"
            className="pointer-events-none select-none font-sans"
          >
            {label || id}
          </text>
        )}
      </g>
    );
  };

  // Render SVG Polygon with text
  const renderPolygon = (
    id: string,
    points: string,
    centerX: number,
    centerY: number,
    label?: string
  ) => {
    const style = getPlotClasses(id);
    const item = state.items[id];
    const isSelected = selectedPlotId === id;
    const isPending = item?.checked && !item?.watered;

    return (
      <g
        key={id}
        onClick={() => handlePlotClick(id)}
        className="cursor-pointer transition-transform hover:opacity-90 select-none group"
      >
        <polygon
          points={points}
          fill={style.fill}
          stroke={isSelected ? '#2563eb' : style.stroke}
          strokeWidth={isSelected ? 3 : style.strokeWidth}
          opacity={style.opacity}
          className="transition-colors duration-200"
        />
        {isPending && (
          <polygon
            points={points}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 2"
            className="animate-pulse pointer-events-none"
          />
        )}
        <text
          x={centerX}
          y={centerY + 4}
          textAnchor="middle"
          fill={style.textColor}
          fontSize={12}
          fontWeight="bold"
          className="pointer-events-none select-none font-sans"
        >
          {label || id}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-8">
      {/* Map Header & Controls */}
      <div className="bg-stone-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-700 rounded-lg text-white">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              La Grande Community Garden Plot Plan
            </h3>
            <p className="text-xs text-stone-300">
              Interactive map updated to official 10.12.2026 plot plan
            </p>
          </div>
        </div>

        {/* Filter button */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              filterPendingOnly
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterPendingOnly ? 'Showing Needs Water Only' : 'Highlight Needs Water'}</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="p-4 sm:p-6 overflow-x-auto bg-stone-50/50 flex justify-center">
        <div className="w-full max-w-[850px] relative bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <svg
            viewBox="0 0 850 860"
            className="w-full h-auto drop-shadow-2xs bg-white rounded-lg"
            style={{ minWidth: '620px' }}
          >
            {/* Compass in top-right */}
            <g transform="translate(425, 95)">
              <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="-25" y1="-25" x2="25" y2="25" stroke="#0f172a" strokeWidth="1.2" />
              <line x1="-25" y1="25" x2="25" y2="-25" stroke="#0f172a" strokeWidth="1.2" />
              {/* Arrows */}
              <polygon points="-25,-25 -20,-24 -24,-20" fill="#0f172a" />
              <polygon points="25,25 20,24 24,20" fill="#0f172a" />
              <polygon points="-25,25 -20,24 -24,28" fill="#0f172a" />
              <polygon points="25,-25 20,-24 24,-28" fill="#0f172a" />
              <text x="-32" y="-28" fontSize="11" fontWeight="bold" fill="#0f172a">E</text>
              <text x="27" y="-28" fontSize="11" fontWeight="bold" fill="#0f172a">S</text>
              <text x="-32" y="36" fontSize="11" fontWeight="bold" fill="#0f172a">N</text>
              <text x="27" y="36" fontSize="11" fontWeight="bold" fill="#0f172a">W</text>
            </g>

            {/* Perimeter boundary line */}
            <polygon
              points="70,115 370,110 445,190 150,650 68,540 70,115"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* TOP-LEFT: Apple Tree Area (Public) */}
            {renderRect(
              'Apple Tree Area',
              80,
              120,
              45,
              24,
              undefined,
              true,
              ['Apple Tree', 'Area']
            )}

            {/* Columns under Apple Tree Area */}
            {/* 38B & 38A */}
            {renderRect('38B', 77, 148, 22, 45, '38B')}
            {renderRect('38A', 77, 196, 22, 45, '38A')}

            {/* 30B & 30A */}
            {renderRect('30B', 102, 148, 22, 45, '30B')}
            {renderRect('30A', 102, 196, 22, 45, '30A')}

            {/* UPPER HORIZONTAL BLOCK */}
            {/* Row 29, 28, 27, 26A/26B */}
            {renderRect('29', 128, 134, 52, 22, '29')}
            {renderRect('28', 128, 163, 52, 22, '28')}
            {renderRect('27', 128, 192, 52, 22, '27')}
            {renderRect('26A', 128, 221, 25, 20, '26A')}
            {renderRect('26B', 155, 221, 25, 20, '26B')}

            {/* Row 25, 24, 23, 22 */}
            {renderRect('25', 188, 134, 54, 22, '25')}
            {renderRect('24', 188, 163, 54, 22, '24')}
            {renderRect('23', 188, 192, 54, 22, '23')}
            {renderRect('22', 188, 221, 54, 20, '22')}

            {/* Row 21, 20, 19, 18 */}
            {renderRect('21', 250, 134, 54, 22, '21')}
            {renderRect('20', 250, 163, 54, 22, '20')}
            {renderRect('19', 250, 192, 54, 22, '19')}
            {renderRect('18', 250, 221, 54, 20, '18')}

            {/* Row 16 & Wedge 17 */}
            {renderRect('16', 312, 134, 54, 22, '16')}
            {renderPolygon('17', '312,163 366,163 312,238', 330, 185, '17')}

            {/* MIDDLE BLOCK: Columns 37, 33, 32, 31, A, B, C, D */}
            {/* 37B & 37A */}
            {renderRect('37B', 77, 275, 18, 48, '37B')}
            {renderRect('37A', 77, 326, 18, 48, '37A')}

            {/* 33B & 33A */}
            {renderRect('33B', 101, 275, 18, 48, '33B')}
            {renderRect('33A', 101, 326, 18, 48, '33A')}

            {/* 32B & 32A */}
            {renderRect('32B', 123, 275, 18, 48, '32B')}
            {renderRect('32A', 123, 326, 18, 48, '32A')}

            {/* 31B & 31A */}
            {renderRect('31B', 150, 275, 18, 48, '31B')}
            {renderRect('31A', 150, 326, 18, 48, '31A')}

            {/* 39B (top) & 39A (bottom) */}
            {renderRect('39B', 174, 275, 18, 48, '39B')}
            {renderRect('39A', 174, 326, 18, 48, '39A')}

            {/* 40B (top) & 40A (bottom) */}
            {renderRect('40B', 196, 275, 18, 48, '40B')}
            {renderRect('40A', 196, 326, 18, 48, '40A')}

            {/* Plot 42 (vertical rectangle) */}
            {renderRect('42', 222, 275, 18, 70, '42')}

            {/* Plot 43 (wedge triangle right of 42) */}
            {renderPolygon('43', '247,275 292,275 247,345', 260, 298, '43')}

            {/* LOWER BLOCK */}
            {/* Herbs (Public) on left edge */}
            {renderRect('Herbs', 70, 380, 18, 52, 'Herbs', true)}

            {/* 36B & 36A */}
            {renderRect('36B', 101, 380, 18, 42, '36B')}
            {renderRect('36A', 101, 425, 18, 42, '36A')}

            {/* 35B & 35A */}
            {renderRect('35B', 123, 380, 18, 42, '35B')}
            {renderRect('35A', 123, 425, 18, 42, '35A')}

            {/* Plot 34 (tall trapezoid/wedge) */}
            {renderPolygon('34', '150,380 168,380 168,460 150,475', 159, 425, '34')}

            {/* Plot 41 (triangle under 39A, 40A, 42) */}
            {renderPolygon('41', '174,380 222,380 174,455', 188, 402, '41')}

            {/* Tool Shed at bottom-left */}
            <g transform="translate(68, 502)">
              <rect x="0" y="0" width="22" height="28" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" rx="2" />
              <text x="11" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0f172a">Tool</text>
              <text x="11" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0f172a">Shed</text>
            </g>

            {/* DIAGONAL PLOT STRIP ALONG THE FENCE (Plots 2 to 15 + Flowers/Beehive) */}
            {/* Angled at -47.5 degrees, parallel to the hypotenuse of 17, D, E, 34 */}
            <g transform="translate(142, 605) rotate(-47.5)">
              {/* Plot 2 */}
              {renderRect('2', 0, 0, 36, 30, '2')}

              {/* 3A & 3B (split) */}
              {renderRect('3A', 42, 0, 18, 30, '3A')}
              {renderRect('3B', 62, 0, 18, 30, '3B')}

              {/* 4A & 4B (split) */}
              {renderRect('4A', 86, 0, 18, 30, '4A')}
              {renderRect('4B', 106, 0, 18, 30, '4B')}

              {/* 5A & 5B (split) */}
              {renderRect('5A', 130, 0, 18, 30, '5A')}
              {renderRect('5B', 150, 0, 18, 30, '5B')}

              {/* 6A & 6B (split) */}
              {renderRect('6A', 174, 0, 18, 30, '6A')}
              {renderRect('6B', 194, 0, 18, 30, '6B')}

              {/* Plot 7 (direct after 6B as in new map!) */}
              {renderRect('7', 220, 0, 34, 30, '7')}

              {/* Plot 8 */}
              {renderRect('8', 260, 0, 34, 30, '8')}

              {/* Plot 9 */}
              {renderRect('9', 300, 0, 34, 30, '9')}

              {/* Plot 10 */}
              {renderRect('10', 340, 0, 34, 30, '10')}

              {/* Plot 11 */}
              {renderRect('11', 380, 0, 34, 30, '11')}

              {/* Plot 12 */}
              {renderRect('12', 420, 0, 34, 30, '12')}

              {/* Plot 13 */}
              {renderRect('13', 460, 0, 34, 30, '13')}

              {/* Plot 14 */}
              {renderRect('14', 500, 0, 34, 30, '14')}

              {/* Plot 15 */}
              {renderRect('15', 540, 0, 34, 30, '15')}

              {/* Flowers / Bee-hive (Public green box linked to item 'Flowers') */}
              {renderRect('Flowers', 580, 0, 42, 30, undefined, true, ['Flowers', 'Bee-hive'])}
            </g>

            {/* PUBLIC LEGEND (Matching lower right on map) */}
            <g transform="translate(345, 630)">
              <rect x="0" y="0" width="36" height="22" rx="2" fill="#86efac" stroke="#16a34a" strokeWidth="1.2" />
              <text x="48" y="15" fontSize="10" fontWeight="bold" fill="#0f172a">PUBLIC</text>
            </g>

            {/* OFFICIAL MAP TITLE (Matching bottom of uploaded map) */}
            <g transform="translate(50, 755)">
              <text x="0" y="0" fontSize="26" fontWeight="900" fill="#0f172a" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                LA GRANDE COMMUNITY GARDEN
              </text>
              <text x="150" y="30" fontSize="20" fontWeight="bold" fill="#0f172a" fontFamily="system-ui, sans-serif" letterSpacing="0.03em">
                PLOT PLAN
              </text>
              <text x="350" y="32" fontSize="11" fontWeight="bold" fill="#334155" fontFamily="monospace">
                10.12.2026
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Selected Plot Drawer / Modal Details */}
      {selectedItem && (
        <div className="bg-stone-900 text-stone-100 p-4 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-3">
            <div className={`px-3.5 py-2 rounded-xl flex items-center justify-center font-black text-base shadow-xs shrink-0 ${
              selectedItem.watered
                ? 'bg-emerald-600 text-white'
                : selectedItem.checked
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-700 text-stone-200'
            }`}>
              {selectedItem.id}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-white">
                  {['Herbs', 'Apple Tree Area', 'Flowers'].includes(selectedItem.id)
                    ? (selectedItem.id === 'Flowers' ? 'Flowers (Bee-hive)' : selectedItem.id)
                    : `Plot ${selectedItem.id}`}
                </h4>
                {selectedItem.watered ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                    <Droplet className="w-3 h-3 fill-emerald-300" />
                    <span>Watered</span>
                  </span>
                ) : selectedItem.checked ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Requested • Needs Water</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-stone-700 text-stone-300 text-xs font-medium">
                    Not Requested
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 mt-1">
                {selectedItem.checked && (
                  <span>
                    Requested by: <strong className="text-stone-200">{selectedItem.checkedBy || 'Request'}</strong>
                  </span>
                )}
                {selectedItem.watered && (
                  <>
                    {selectedItem.wateredAt && (
                      <span>
                        Watered at: <strong className="text-emerald-300 font-mono">{new Date(selectedItem.wateredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} PST</strong>
                      </span>
                    )}
                    {selectedItem.wateredBy && (
                      <span>
                        Watered by: <strong className="text-emerald-300 font-semibold">{selectedItem.wateredBy}</strong>
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons in drawer */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isLeader ? (
              <button
                type="button"
                onClick={() => onToggleWatered(selectedItem.id, !selectedItem.watered)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  selectedItem.watered
                    ? 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Droplet className="w-4 h-4" />
                <span>{selectedItem.watered ? 'Unmark Watered' : 'Mark as Watered'}</span>
              </button>
            ) : (
              state.available && (
                <button
                  type="button"
                  onClick={() => onToggleCheck(selectedItem.id, !selectedItem.checked)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    selectedItem.checked
                      ? 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                      : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{selectedItem.checked ? 'Cancel Request' : 'Request to Water'}</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setSelectedPlotId(null)}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
