import React from 'react';
import { CharacterProfile } from '../types';
import { SectionCard } from './SectionCard';
import { Coins, Ruler, Trophy, Crosshair, Lock } from 'lucide-react';

interface ProfileSectionProps {
  profile: CharacterProfile;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile }) => {
  const safeBelongings = profile.belongings || [];

  // 키 포맷팅
  const formatHeight = (val: string | number | undefined) => {
    if (!val) return 'Unknown';
    const strVal = String(val).trim();
    if (strVal.toLowerCase().endsWith('cm') || isNaN(Number(strVal))) return strVal;
    return `${strVal}cm`;
  };

  // 몸무게 포맷팅
  const formatWeight = (val: string | number | undefined) => {
    if (!val) return 'Unknown';
    const strVal = String(val).trim();
    if (strVal.toLowerCase().endsWith('kg')) return strVal;
    if (!isNaN(Number(strVal))) return `${strVal}kg`;
    return strVal;
  };

  return (
    <SectionCard className="h-full">
      <div className="flex flex-col gap-6">
        {/* Image Container */}
        <div className="relative p-1 border border-[#d4af37]/20 bg-[#020f0a]">
            <div className="relative aspect-[3/4] w-full overflow-hidden group cursor-pointer">
                <img 
                    src={profile.image_url} 
                    alt={profile.name_kr} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-in-out grayscale-[20%] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020f0a] via-transparent to-transparent opacity-90 pointer-events-none" />
                <div className="absolute inset-0 border-[0.5px] border-[#d4af37]/30 m-2 pointer-events-none opacity-50"></div>
            </div>
            <div className="absolute top-0 left-0 w-1 h-1 bg-[#d4af37]"></div>
            <div className="absolute top-0 right-0 w-1 h-1 bg-[#d4af37]"></div>
            <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#d4af37]"></div>
            <div className="absolute bottom-0 right-0 w-1 h-1 bg-[#d4af37]"></div>
        </div>

        {/* Core Stats Table */}
        <div className="space-y-4 font-sans text-sm px-1">
            
            {/* 1. Total Assets */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/10 pb-3 group">
                <span className="flex items-center gap-3 text-[#d4af37]/60 uppercase tracking-wider text-[10px] font-bold group-hover:text-[#d4af37] transition-colors">
                    <Coins size={14} /> TOTAL ASSETS
                </span>
                <span className="text-[#f9eabb] font-bold font-mono text-xl tracking-wide drop-shadow-sm">
                    {profile.coin?.toLocaleString() || 0}
                </span>
            </div>

            {/* 2. Spec */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/10 pb-3 group">
                <span className="flex items-center gap-3 text-gray-500 uppercase tracking-wider text-[10px] font-bold group-hover:text-gray-400 transition-colors">
                    <Ruler size={14} /> Spec
                </span>
                <span className="text-gray-300 font-serif italic text-xs">
                    {formatHeight(profile.height)} / {formatWeight(profile.weight)}
                </span>
            </div>

            {/* 3. Position (여기가 핵심) */}
             <div className="flex items-center justify-between border-b border-[#d4af37]/10 pb-3 group">
                <span className="flex items-center gap-3 text-gray-500 uppercase tracking-wider text-[10px] font-bold group-hover:text-gray-400 transition-colors">
                    <Crosshair size={14} /> Position
                </span>
                {/* 관리자 여부(isAdmin)와 상관없이, 입력된 텍스트(role)를 그대로 보여줍니다. */}
                <span className="text-[#d4af37] font-serif text-xs uppercase tracking-widest">{profile.role}</span>
            </div>

            {/* 4. Rank */}
            <div className="flex items-center justify-between pb-3 group">
                <span className="flex items-center gap-3 text-gray-500 uppercase tracking-wider text-[10px] font-bold group-hover:text-gray-400 transition-colors">
                    <Trophy size={14} /> Rank
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-['Cinzel'] font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#f9eabb] to-[#d4af37]">
                        #{profile.rank}
                    </span>
                </div>
            </div>

            {/* 5. Belongings */}
            {safeBelongings.length > 0 && (
                <div className="pt-3 border-t border-[#d4af37]/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={10} className="text-[#d4af37]/40" />
                        <span className="text-[9px] uppercase tracking-widest text-[#d4af37]/40 font-bold">Signature Items</span>
                    </div>
                    <div className="space-y-1 pl-1">
                        {safeBelongings.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                                <div className="w-1 h-1 bg-[#d4af37]/60 rounded-full group-hover:bg-[#d4af37] transition-colors"></div>
                                <span className="text-gray-300 font-serif text-xs italic group-hover:text-[#f9eabb] transition-colors cursor-default">
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </SectionCard>
  );
};