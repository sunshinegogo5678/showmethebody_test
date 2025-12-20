import React from 'react';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className = '', noPadding = false }) => {
  return (
    // ✅ className에 전달된 높이/너비 속성(예: h-full)이 여기서 적용됨
    <div className={`relative bg-[#05140e]/60 backdrop-blur-xl border border-[#d4af37]/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden group flex flex-col ${className}`}>
      
      {/* Top Highlight (Glass Edge effect) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
      
      {/* Decorative Corner Accents (Finer, more elegant) */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/40 transition-all duration-500 group-hover:border-[#d4af37]/80"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/40 transition-all duration-500 group-hover:border-[#d4af37]/80"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/40 transition-all duration-500 group-hover:border-[#d4af37]/80"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/40 transition-all duration-500 group-hover:border-[#d4af37]/80"></div>

      {title && (
        <div className="relative py-3 px-4 border-b border-[#d4af37]/10 shrink-0">
           {/* Title Background Gradient */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/5 to-transparent"></div>
           
           <div className="relative flex items-center justify-center gap-2">
             <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4af37]/40"></div>
             <h3 className="text-[#f9eabb] font-['Cinzel'] tracking-[0.2em] uppercase text-xs font-bold drop-shadow-sm">
               {title}
             </h3>
             <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4af37]/40"></div>
           </div>
        </div>
      )}
      
      {/* ✅ 핵심 수정: flex-1을 사용하여 남은 높이를 모두 채우고, h-full로 높이를 상속 */}
      <div className={`relative flex-1 h-full ${noPadding ? '' : 'p-5'}`}>
        {/* Inner subtle texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        {/* ✅ children이 높이를 100% 사용하도록 h-full 추가 */}
        <div className="relative z-10 w-full h-full">
            {children}
        </div>
      </div>
    </div>
  );
};