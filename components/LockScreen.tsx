import React from 'react';
import { Lock, AlertTriangle, ArrowLeft } from 'lucide-react';

interface LockScreenProps {
  title?: string;
  message?: string;
  onBack: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ 
  title = "RESTRICTED AREA", 
  message = "이 구역은 현재 보안 점검 및 개장 준비 중입니다.\n관리자의 승인 없이는 접근할 수 없습니다.",
  onBack 
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020f0a] text-[#f9eabb] p-6 animate-fade-in relative overflow-hidden">
      
      {/* 배경 장식 (은은한 금빛) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37]/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8 border border-[#d4af37]/30 bg-black/80 backdrop-blur-md p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* 자물쇠 아이콘 */}
        <div className="flex justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-[#d4af37] blur-md opacity-20 animate-pulse"></div>
                <Lock className="w-16 h-16 text-[#d4af37]" strokeWidth={1.5} />
                <div className="absolute -bottom-2 -right-2 bg-[#020f0a] border border-[#d4af37] p-1 rounded-full">
                    <AlertTriangle size={12} className="text-red-500" />
                </div>
            </div>
        </div>

        {/* 텍스트 내용 */}
        <div className="space-y-4">
            <h2 className="text-3xl font-['Cinzel'] font-bold text-[#d4af37] tracking-widest border-b border-[#d4af37]/30 pb-4">
                {title}
            </h2>
            <p className="text-gray-400 font-mono text-sm leading-relaxed whitespace-pre-line">
                {message}
            </p>
        </div>

        {/* 돌아가기 버튼 */}
        <div className="pt-4">
            <button 
                onClick={onBack}
                className="group relative px-8 py-3 bg-transparent border border-[#d4af37] text-[#d4af37] font-bold uppercase tracking-widest text-xs hover:bg-[#d4af37] hover:text-black transition-all duration-300"
            >
                <span className="flex items-center gap-2">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Return to Lobby
                </span>
            </button>
        </div>

        {/* 모서리 장식 */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]"></div>
      </div>
    </div>
  );
};