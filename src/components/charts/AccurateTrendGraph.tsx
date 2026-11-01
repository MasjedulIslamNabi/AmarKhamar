import React, { useState } from 'react';

export interface TrendPoint {
  date: string;
  weight: number;
  label?: string;
  tagNumber?: string;
}

interface AccurateTrendGraphProps {
  points: TrendPoint[];
  title?: string;
  height?: number;
  unit?: string;
}

export const AccurateTrendGraph: React.FC<AccurateTrendGraphProps> = ({
  points,
  title,
  height = 320,
  unit = 'kg'
}) => {
  const [activePoint, setActivePoint] = useState<TrendPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        No weight trend data available
      </div>
    );
  }

  // Calculate actual min & max with generous margins
  const weights = points.map((p) => p.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  // Round grid bounds
  const yMin = Math.max(0, Math.floor((minWeight - 30) / 50) * 50);
  const yMax = Math.ceil((maxWeight + 30) / 50) * 50;
  const yRange = yMax - yMin || 100;

  // SVG coordinate system - expansive and prominent
  const svgWidth = 720;
  const svgHeight = height;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Map each data point accurately
  const coordinates = points.map((p, index) => {
    const x = paddingLeft + (index / (points.length - 1 || 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((p.weight - yMin) / yRange) * plotHeight;
    return { x, y, ...p };
  });

  // Smooth Bezier Curve Path
  const linePath = coordinates.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cx = (prev.x + curr.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${paddingTop + plotHeight} L ${coordinates[0].x} ${paddingTop + plotHeight} Z`;

  // Y-axis tick intervals (5 clear steps)
  const yTicks = [
    yMin,
    Math.round(yMin + yRange * 0.25),
    Math.round(yMin + yRange * 0.50),
    Math.round(yMin + yRange * 0.75),
    yMax
  ];

  // Format date ticks cleanly (e.g. YYYY-MM -> May '26, YYYY-MM-DD -> May 14)
  const formatTickDate = (rawDate: string) => {
    if (!rawDate) return '';
    if (/^\d{4}-\d{2}$/.test(rawDate)) {
      const [year, month] = rawDate.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} '${year.slice(2)}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [, month, day] = rawDate.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} ${parseInt(day, 10)}`;
    }
    return rawDate;
  };

  return (
    <div className="w-full relative">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {title}
          </h4>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300/60 px-2.5 py-1 rounded-lg">
            Unit: {unit}
          </span>
        </div>
      )}

      {/* Interactive Tooltip Overlay (Smooth, Flicker-Free) */}
      {activePoint && hoverPos && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-white text-slate-800 rounded-2xl px-4 py-2.5 shadow-xl border-2 border-emerald-400 text-xs transition-all duration-150 ease-out"
          style={{ 
            left: `${(hoverPos.x / svgWidth) * 100}%`, 
            top: `${Math.max(12, hoverPos.y - 10)}px` 
          }}
        >
          <div className="font-black text-sm text-emerald-800 tabular-nums">
            {activePoint.weight} {unit}
          </div>
          <div className="text-xs text-slate-500 font-mono font-semibold mt-0.5">
            {formatTickDate(activePoint.date)} {activePoint.tagNumber ? `· ${activePoint.tagNumber}` : ''}
          </div>
          {activePoint.label && (
            <div className="text-xs text-slate-600 mt-1 font-medium">{activePoint.label}</div>
          )}
        </div>
      )}

      {/* SVG Canvas with Separate Entrance Animations */}
      <svg
        key={`graph-${points.length}-${points[points.length - 1]?.weight}`}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible select-none drop-shadow-xs"
        onMouseLeave={() => {
          setActivePoint(null);
          setHoverPos(null);
        }}
      >
        <defs>
          <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Y-Gridlines & Labels */}
        {yTicks.map((val, idx) => {
          const y = paddingTop + plotHeight - ((val - yMin) / yRange) * plotHeight;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs font-bold fill-slate-500 tabular-nums"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Vertical Guideline on active point */}
        {activePoint && hoverPos && (
          <line
            x1={hoverPos.x}
            y1={paddingTop}
            x2={hoverPos.x}
            y2={paddingTop + plotHeight}
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.75"
            className="pointer-events-none"
          />
        )}

        {/* Shaded Area - Separate smooth reveal */}
        <path d={areaPath} fill="url(#emeraldAreaGradient)" className="anim-chart-area pointer-events-none" />

        {/* Line Curve - Separate SVG stroke animation */}
        <path
          d={linePath}
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-chart-line pointer-events-none"
        />

        {/* Data Points - Separate staggered bounce/pop animation */}
        {coordinates.map((pt, idx) => {
          const isSelected = activePoint === pt;
          return (
            <g
              key={idx}
              className="anim-chart-dot pointer-events-none"
              style={{ animationDelay: `${0.35 + idx * 0.12}s` }}
            >
              {/* Outer Glow on hover */}
              {isSelected && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="#A7F3D0"
                  opacity="0.8"
                />
              )}
              {/* Point Circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 7.5 : 5.5}
                fill="#FFFFFF"
                stroke={isSelected ? "#064E3B" : "#047857"}
                strokeWidth={isSelected ? 4 : 3}
              />

              {/* X-axis date labels */}
              <text
                x={pt.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className={`text-xs font-mono transition-colors ${isSelected ? 'font-black fill-emerald-900' : 'font-bold fill-slate-600'}`}
              >
                {formatTickDate(pt.date)}
              </text>
            </g>
          );
        })}

        {/* Seamless Full-Height Column Hit Zones for 100% Glitch-Free Hover Response */}
        {coordinates.map((pt, idx) => {
          const colWidth = plotWidth / (coordinates.length || 1);
          const colX = pt.x - colWidth / 2;
          return (
            <rect
              key={`hit-${idx}`}
              x={colX}
              y={paddingTop - 10}
              width={colWidth}
              height={plotHeight + 20}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => {
                setActivePoint(pt);
                setHoverPos({ x: pt.x, y: pt.y });
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};
