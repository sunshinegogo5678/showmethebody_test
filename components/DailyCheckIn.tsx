import React from 'react';
import { SectionCard } from './SectionCard';
import { Calendar, CheckCircle } from 'lucide-react';

interface DailyCheckInProps {
    checks: {
        lastCheck: string | null;
        streak: number;
        history: string[]; // 날짜 목록
    };
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ checks }) => {
    // ✅ 안전장치: checks나 history가 없으면 빈 배열로 처리
    const safeHistory = checks?.history || [];
    const safeStreak = checks?.streak || 0;

    const today = new Date().toISOString().split('T')[0];
    const isChecked = safeHistory.includes(today);

    return (
        <SectionCard title="Daily Attendance" className="w-full" icon={<Calendar size={16}/>}>
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isChecked ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-[#020f0a] border-[#d4af37]/30 text-[#d4af37]'}`}>
                        <CheckCircle size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] uppercase text-gray-500 tracking-widest">Current Streak</p>
                        <p className="text-2xl font-mono text-[#f9eabb] font-bold">{safeStreak} Days</p>
                     </div>
                </div>
                
                {/* 최근 5일 기록 표시 (여기가 에러 원인일 수 있음) */}
                <div className="flex gap-1">
                    {safeHistory.slice(-5).map((date, idx) => (
                        <div key={idx} className="w-2 h-8 bg-[#d4af37] rounded-sm opacity-50" title={date}></div>
                    ))}
                    {/* 기록이 없으면 빈 박스 보여주기 */}
                    {safeHistory.length === 0 && (
                        <span className="text-xs text-gray-600 italic">No records</span>
                    )}
                </div>
            </div>
        </SectionCard>
    );
};