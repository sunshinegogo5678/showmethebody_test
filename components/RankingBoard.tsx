
import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { MOCK_RANKINGS } from '../constants';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Zap, DollarSign, Medal } from 'lucide-react';
import { RankingEntry } from '../types';

type RankingType = 'wealth' | 'gambler' | 'lucky';

export const RankingBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RankingType>('wealth');

  const getRankings = () => {
    return MOCK_RANKINGS[activeTab];
  };

  const tabs = [
    { id: 'wealth', label: 'Rich List', icon: <DollarSign size={14}/> },
    { id: 'gambler', label: 'Top Gamblers', icon: <Crown size={14}/> },
    { id: 'lucky', label: 'Jackpot Winners', icon: <Zap size={14}/> },
  ];

  const rankings = getRankings().slice(0, 5); // Display Top 5

  return (
    <div className="mt-12">
        <div className="text-center mb-8">
            <h3 className="text-xl font-['Cinzel'] text-[#d4af37] tracking-widest mb-2 flex items-center justify-center gap-2">
                <Trophy size={20} /> HALL OF FAME
            </h3>
            <div className="h-px w-16 bg-[#d4af37]/40 mx-auto"></div>
        </div>

        <SectionCard noPadding>
            {/* Tabs */}
            <div className="flex border-b border-[#d4af37]/20">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as RankingType)}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 ${
                            activeTab === tab.id 
                            ? 'bg-[#d4af37]/10 text-[#d4af37] border-b-2 border-[#d4af37]' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Vertical List Layout */}
            <div className="flex flex-col">
                {rankings.map((item) => {
                    const isTopRank = item.rank <= 3;
                    
                    return (
                        <div 
                            key={item.id} 
                            className="flex items-center justify-between p-4 md:px-8 border-b border-[#d4af37]/10 last:border-none hover:bg-[#d4af37]/5 transition-colors group"
                        >
                            {/* Left Side: Rank, Avatar, Name */}
                            <div className="flex items-center gap-4 md:gap-6">
                                {/* Rank Indicator */}
                                <div className="w-6 flex justify-center shrink-0">
                                    {item.rank === 1 ? (
                                        <Medal size={20} className="text-[#FFD700] fill-[#FFD700]/10 drop-shadow-sm" strokeWidth={1.5} />
                                    ) : item.rank === 2 ? (
                                        <Medal size={20} className="text-[#C0C0C0] fill-[#C0C0C0]/10 drop-shadow-sm" strokeWidth={1.5} />
                                    ) : item.rank === 3 ? (
                                        <Medal size={20} className="text-[#CD7F32] fill-[#CD7F32]/10 drop-shadow-sm" strokeWidth={1.5} />
                                    ) : (
                                        <span className="font-['Cinzel'] font-bold text-gray-500 text-sm">{item.rank}</span>
                                    )}
                                </div>
                                
                                {/* Avatar */}
                                <div className={`relative rounded-full p-px ${item.rank === 1 ? 'bg-gradient-to-tr from-[#d4af37] to-transparent' : 'bg-transparent'}`}>
                                    <img 
                                        src={item.avatarUrl} 
                                        alt={item.name} 
                                        className="w-10 h-10 rounded-full object-cover border border-[#d4af37]/20 group-hover:border-[#d4af37]/50 transition-colors" 
                                    />
                                    {item.rank === 1 && <Crown size={10} className="absolute -top-1 -right-1 text-[#d4af37] fill-[#d4af37]" />}
                                </div>

                                {/* Name */}
                                <span className={`font-serif text-sm tracking-wide ${
                                    item.rank === 1 ? 'text-[#f9eabb] font-bold' : 
                                    item.rank <= 3 ? 'text-gray-200' :
                                    'text-gray-400'
                                } group-hover:text-[#d4af37] transition-colors`}>
                                    {item.name}
                                </span>
                            </div>

                            {/* Right Side: Value, Trend */}
                            <div className="flex items-center gap-4 md:gap-8">
                                <span className={`font-mono text-xs md:text-sm tracking-wider ${item.rank === 1 ? 'text-[#d4af37] font-bold' : 'text-[#d4af37]/80'}`}>
                                    {item.value}
                                </span>
                                <div className="w-5 flex justify-center">
                                    {item.change === 'up' ? <TrendingUp size={14} className="text-green-500/70" /> :
                                     item.change === 'down' ? <TrendingDown size={14} className="text-red-500/70" /> :
                                     <Minus size={14} className="text-gray-600" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    </div>
  );
};
