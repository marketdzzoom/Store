import React from 'react';

export default function Logo({ className = "h-11", showText = true }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer select-none">
      {/* Official Attached Zoom Market DZ Logo Image */}
      <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-white shadow-md border-2 border-brand-navy flex items-center justify-center transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
        <img
          src="./logo.jpg"
          alt="Zoom Market DZ Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-xl md:text-2xl tracking-tight text-brand-navy dark:text-white font-sans">
              ZOOM<span className="text-brand-orange">.</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-orange text-white">
              MARKET
            </span>
          </div>
          <span className="text-[10px] font-extrabold tracking-widest text-brand-navy dark:text-slate-300 uppercase -mt-0.5">
            BOUTIQUE EN LIGNE DZ 🇩🇿
          </span>
        </div>
      )}
    </div>
  );
}
