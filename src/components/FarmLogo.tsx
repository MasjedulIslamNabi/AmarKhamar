import React from 'react';

export const FarmLogo: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = "" }) => {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xs ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-4/5 h-4/5"
      >
        {/* Subtle geometric barn / bull silhouette and sprout */}
        <path
          d="M12 18C10 11 17 8 20 13C22 16 23 18 24 21C25 18 26 16 28 13C31 8 38 11 36 18C34 26 31 33 24 36C17 33 14 26 12 18Z"
          fill="#FFFFFF"
        />
        {/* Agricultural sprout leaf */}
        <path
          d="M24 34C24 27 19 22 19 22C22 22 24 26 24 34Z"
          fill="#10B981"
        />
        <path
          d="M24 34C24 27 29 22 29 22C26 22 24 26 24 34Z"
          fill="#34D399"
        />
        {/* Golden horn ear highlights */}
        <circle cx="24" cy="17" r="1.5" fill="#F59E0B" />
        <path d="M14 19C10 20 10 23 12 25" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M34 19C38 20 38 23 36 25" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};
