import React from 'react';
import { SectionCard } from './SectionCard';
import { Dices, Trophy, TrendingUp } from 'lucide-react';

interface GameStat {
    id: string;
    game_type: string;
    play_count: number;
    win_count: number;
    profit_total: number;
}

interface GameTableProps {
    stats: GameStat[];
}

export const GameTable: React.FC<GameTableProps> = ({ stats }) => {
    // ✅ 안전장치: stats가 null이면 빈 배열로 처리
    const safeStats = stats || [];

    return (
        <SectionCard title="Combat / Game Records" className="h-full" icon={<Dices size={16}/>}>
             <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                    <thead>
                        <tr className="border-b border-[#d4af37]/20 text-[#d4af37]">
                            <th className="py-2 text-left font-serif font-normal">Game</th>
                            <th className="py-2 text-center font-serif font-normal">Plays</th>
                            <th className="py-2 text-center font-serif font-normal">Wins</th>
                            <th className="py-2 text-right font-serif font-normal">Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {safeStats.length === 0 ? (
                             <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-600 italic">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            safeStats.map((stat) => (
                                <tr key={stat.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-gray-300 font-bold">{stat.game_type}</td>
                                    <td className="py-3 text-center text-gray-400">{stat.play_count}</td>
                                    <td className="py-3 text-center text-[#d4af37]">{stat.win_count}</td>
                                    <td className={`py-3 text-right font-mono ${stat.profit_total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stat.profit_total > 0 ? '+' : ''}{stat.profit_total.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
        </SectionCard>
    );
};