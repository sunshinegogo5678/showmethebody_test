import React from 'react';
import { SectionCard } from './SectionCard';
import { Scroll, Clock, AlertCircle } from 'lucide-react';

interface LogItem {
    id: string;
    category: string;
    content: string;
    created_at: string;
    amount?: number;
    balance_after?: number;
}

interface ActivityLogProps {
    logs: LogItem[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const safeLogs = logs || [];

  // 날짜 포맷 함수 (월-일 시:분)
  const formatTime = (dateString: string) => {
    const date = new window.Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <SectionCard title="Activity Log" className="h-full" icon={<Scroll size={16}/>}>
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {safeLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-600 italic text-xs">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={20} />
                    <p>No activity recorded yet.</p>
                </div>
            ) : (
                safeLogs.map((log) => {
                    // [핵심 수정] 금액 변동이 있고(undefined/null 아님), 0원이 아닐 때만 true
                    const hasFinancialChange = log.amount !== undefined && log.amount !== null && log.amount !== 0;

                    return (
                        <div key={log.id} className="relative pl-4 border-l border-[#d4af37]/20 pb-4 last:pb-0">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#020f0a] border border-[#d4af37]"></div>
                            
                            {/* 헤더: 카테고리 + 날짜 */}
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wider bg-[#d4af37]/10 px-1.5 rounded">
                                    {log.category}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Clock size={10} />
                                    {formatTime(log.created_at)}
                                </span>
                            </div>
                            
                            {/* 내용 */}
                            <p className="text-sm text-gray-300 leading-snug">{log.content}</p>
                            
                            {/* 금액 및 잔액 표시 (변동이 0이 아닐 때만 표시) */}
                            {hasFinancialChange && (
                                 <div className="flex justify-between items-center mt-1 border-t border-[#d4af37]/10 pt-1">
                                    {/* 변동 금액 */}
                                    <span className={`text-xs font-mono ${log.amount! > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {log.amount! > 0 ? '+' : ''}{log.amount!.toLocaleString()} Coin
                                    </span>
                                    
                                    {/* 잔액 표시 */}
                                    {log.balance_after !== undefined && (
                                        <span className="text-[10px] font-mono text-gray-400">
                                            Total: <span className="text-[#d4af37]">{log.balance_after.toLocaleString()}</span>
                                        </span>
                                    )}
                                 </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    </SectionCard>
  );
};