import React, { useState } from 'react';

export interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
}

interface AccuratePieChartProps {
  data: PieDataPoint[];
  title?: string;
  donut?: boolean;
  size?: number;
  currencyPrefix?: string;
}

// Harmonious Green Shades for theme coherence
const GREEN_SHADES = [
  '#047857', // Deep Emerald
  '#10B981', // Emerald
  '#34D399', // Mint Green
  '#064E3B', // Deep Forest
  '#6EE7B7', // Soft Sage
  '#059669', // Rich Green
  '#A7F3D0', // Pale Mint
  '#15803D'  // Dark Olive-Green
];

export const AccuratePieChart: React.FC<AccuratePieChartProps> = ({
  data,
  title,
  donut = true,
  size = 250,
  currencyPrefix = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-xs text-slate-400">
        <span>No data available</span>
      </div>
    );
  }

  // Radius configuration - responsive and well-proportioned
  const center = size / 2;
  const radius = (size / 2) - 14;
  const innerRadius = donut ? radius * 0.64 : 0;
  const isCompact = size <= 210;

  // Polar to Cartesian Helper
  const polarToCartesian = (cx: number, cy: number, r: number, angleDegrees: number) => {
    const angleRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleRadians),
      y: cy + r * Math.sin(angleRadians),
    };
  };

  // Build accurate SVG arc paths
  let accumulatedAngle = 0;
  const slices = data.map((item, idx) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;

    const percentage = ((item.value / total) * 100).toFixed(1);
    const color = item.color || GREEN_SHADES[idx % GREEN_SHADES.length];
    const isHovered = hoveredIdx === idx;

    // Outer & Inner arc points
    const rOuter = isHovered ? radius + 4 : radius;
    const p1 = polarToCartesian(center, center, rOuter, startAngle);
    const p2 = polarToCartesian(center, center, rOuter, endAngle);
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    let pathD = '';
    if (innerRadius > 0) {
      const p3 = polarToCartesian(center, center, innerRadius, endAngle);
      const p4 = polarToCartesian(center, center, innerRadius, startAngle);
      pathD = [
        `M ${p1.x} ${p1.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
        'Z'
      ].join(' ');
    } else {
      pathD = [
        `M ${center} ${center}`,
        `L ${p1.x} ${p1.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
        'Z'
      ].join(' ');
    }

    return {
      ...item,
      percentage,
      pathD,
      color,
      isHovered,
      midAngle: startAngle + sliceAngle / 2
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-5 justify-between w-full min-w-0 overflow-hidden">
      {/* SVG Donut / Pie with Separate Radial Entrance Animation */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          key={`pie-${slices.length}-${total}`}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none drop-shadow-xs anim-pie-container"
        >
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathD}
              fill={slice.color}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              className="cursor-pointer transition-all duration-200 hover:opacity-95 anim-pie-slice"
              style={{ animationDelay: `${idx * 0.09}s` }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Donut Label with Pop Animation */}
        {donut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 anim-pie-center">
            {activeSlice ? (
              <>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate max-w-[92px]">
                  {activeSlice.label}
                </span>
                <span className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-slate-900 tabular-nums my-0.5 leading-none`}>
                  {activeSlice.percentage}%
                </span>
                <span className="text-[11px] text-emerald-800 font-bold tabular-nums truncate max-w-[92px]">
                  {currencyPrefix}{activeSlice.value.toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Total
                </span>
                <span className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-slate-900 tabular-nums my-0.5 leading-none`}>
                  {currencyPrefix}{total.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold leading-tight">
                  100% Breakdown
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Interactive Legend with Exact Numbers & % — min-w-0 prevents flex overflow */}
      <div className="flex-1 min-w-0 w-full space-y-2">
        {title && (
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 truncate">
            {title}
          </h4>
        )}
        <div className="space-y-2 text-xs">
          {slices.map((slice, idx) => {
            const staggerClass = `stagger-${(idx % 6) + 1}`;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl transition cursor-pointer border min-w-0 overflow-hidden ${staggerClass} ${
                  hoveredIdx === idx
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-emerald-50/40 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span
                    className="font-bold text-slate-800 text-xs leading-snug truncate"
                    title={slice.label}
                  >
                    {slice.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-600 tabular-nums font-semibold text-xs">
                    {currencyPrefix}{slice.value.toLocaleString()}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-900 text-[11px] tabular-nums bg-emerald-100/80 px-1.5 py-0.5 rounded-md border border-emerald-300/60">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
