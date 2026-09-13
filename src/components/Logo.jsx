import React from 'react';

export default function Logo({ className = "h-11", showText = true, isDarkBg = false }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer select-none">
      {/* Official Attached Zoom Market DZ Logo Image */}
      <div className={`relative w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-white shadow-md border-2 ${
        isDarkBg ? 'border-white/30 shadow-white/10' : 'border-brand-navy'
      } flex items-center justify-center transition-transform duration-300 group-hover:scale-105 flex-shrink-0`}>
        <img
          src="./logo.jpg"
          alt="Zoom Market DZ Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold text-xl md:text-2xl tracking-tight font-sans ${
              isDarkBg ? 'text-white' : 'text-brand-navy dark:text-white'
            }`}>
              ZOOM<span className="text-brand-orange">.</span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-orange text-white shadow-sm">
              MARKET
            </span>
          </div>
          <span className={`text-[10px] font-extrabold tracking-widest uppercase -mt-0.5 ${
            isDarkBg ? 'text-slate-300' : 'text-brand-navy dark:text-slate-300'
          }`}>
            BOUTIQUE EN LIGNE DZ 🇩🇿
          </span>
        </div>
      )}
    </div>
  );
}
