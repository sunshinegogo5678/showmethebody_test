import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Check, Lock, Gift, Calendar, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { SectionCard } from './SectionCard';

// 날짜 포맷 함수 (MM/DD)
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const DailyAttendance: React.FC = () => {
    const [startDate, setStartDate] = useState<string | null>(null);
    const [logs, setLogs] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [todayStr, setTodayStr] = useState('');

    // [NEW] 결과 모달 상태 관리
    const [resultModal, setResultModal] = useState<{
        open: boolean;
        success: boolean;
        title: string;
        message: string;
    }>({ open: false, success: true, title: '', message: '' });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        setLoading(true);
        const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'event_start_date').single();
        const start = setting?.value || new Date().toISOString().split('T')[0];
        setStartDate(start);

        const { data: myLogs } = await supabase.from('attendance_logs').select('check_in_date');
        if (myLogs) {
            const logSet = new Set(myLogs.map((l: any) => l.check_in_date));
            setLogs(logSet);
        }

        setTodayStr(new Date().toISOString().split('T')[0]);
        setLoading(false);
    };

    const handleCheckIn = async () => {
        if (checkingIn) return;
        setCheckingIn(true);

        try {
            // 1. 유저 정보 (로그용)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            // 2. RPC 실행
            const { data, error } = await supabase.rpc('perform_daily_checkin');
            
            if (error) throw error;

            if (data.success) {
                // 3. 로그 저장
                await supabase.from('activity_logs').insert([
                    {
                        user_id: user.id,
                        type: 'ATTENDANCE',
                        description: `일일 출석체크 완료: ${data.message}`,
                        amount: 0,
                        created_at: new Date().toISOString()
                    }
                ]);

                // [수정] alert 대신 모달 띄우기
                setResultModal({
                    open: true,
                    success: true,
                    title: "REWARD ACQUIRED",
                    message: data.message
                });
                
                // 로컬 상태 업데이트 (체크 표시 즉시 반영)
                setLogs(prev => new Set(prev).add(todayStr));
                
            } else {
                // 실패 모달
                setResultModal({
                    open: true,
                    success: false,
                    title: "CHECK-IN FAILED",
                    message: data.message
                });
            }
        } catch (e: any) {
            setResultModal({
                open: true,
                success: false,
                title: "SYSTEM ERROR",
                message: e.message
            });
        } finally {
            setCheckingIn(false);
        }
    };

    // 모달 닫기 핸들러 (성공했으면 새로고침)
    const closeResultModal = () => {
        setResultModal({ ...resultModal, open: false });
        if (resultModal.success) {
            window.location.reload();
        }
    };

    if (loading || !startDate) return <div className="h-24 flex items-center justify-center text-[#d4af37]"><Calendar className="animate-pulse" size={20}/></div>;

    // 달력 그리드 생성 로직
    const gridItems = [];
    const startObj = new Date(startDate);
    const todayObj = new Date(todayStr);

    for (let i = 0; i < 14; i++) {
        const currentItemDate = new Date(startObj);
        currentItemDate.setDate(startObj.getDate() + i);
        const dateString = currentItemDate.toISOString().split('T')[0];
        
        const isPastString = dateString < todayStr;
        const isTodayString = dateString === todayStr;
        const isChecked = logs.has(dateString);

        gridItems.push({
            dayIndex: i + 1,
            dateString,
            isPast: isPastString,
            isToday: isTodayString,
            isChecked
        });
    }

    return (
        <SectionCard title="DAILY ATTENDANCE" className="w-full">
            <div className="flex justify-center p-4">
                <div className="grid grid-cols-7 gap-2 w-full max-w-[400px]">
                    {gridItems.map((item) => {
                        let boxClass = "relative aspect-square border transition-all duration-300 flex items-center justify-center group";
                        let icon = null;
                        let dateClass = "absolute top-0.5 left-1 text-[8px] font-mono tracking-tighter opacity-50";

                        if (item.isChecked) {
                            boxClass += " bg-[#d4af37] border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.4)]";
                            icon = <Check size={18} className="text-[#020f0a] stroke-[3]" />;
                            dateClass += " text-[#020f0a]";
                        } 
                        else if (item.isToday) {
                            boxClass += " bg-[#d4af37]/10 border-[#d4af37] cursor-pointer hover:bg-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse-slow";
                            icon = checkingIn ? <RefreshCw size={16} className="text-[#d4af37] animate-spin"/> : <Gift size={18} className="text-[#f9eabb] animate-bounce" />;
                            dateClass += " text-[#d4af37]";
                        } 
                        else if (item.isPast) {
                            boxClass += " bg-black/40 border-gray-800 opacity-40 grayscale";
                            icon = <X size={14} className="text-gray-600" />;
                            dateClass += " text-gray-600";
                        } 
                        else {
                            boxClass += " bg-black/20 border-[#d4af37]/10 opacity-60";
                            icon = <Lock size={12} className="text-[#d4af37]/30" />;
                            dateClass += " text-[#d4af37]/30";
                        }

                        return (
                            <div 
                                key={item.dayIndex} 
                                onClick={() => item.isToday && !item.isChecked && handleCheckIn()}
                                className={boxClass}
                            >
                                <span className={dateClass}>{formatDate(item.dateString)}</span>
                                {icon}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- [NEW] RESULT MODAL --- */}
            {resultModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
                    <div className={`w-full max-w-sm bg-[#020f0a] border p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center ${resultModal.success ? 'border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.2)]'}`}>
                        
                        {/* Icon */}
                        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${resultModal.success ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' : 'border-red-900 bg-red-900/20 text-red-500'}`}>
                            {resultModal.success ? <Gift size={40} className="animate-bounce"/> : <AlertTriangle size={40}/>}
                        </div>

                        {/* Title */}
                        <h3 className={`text-2xl font-['Cinzel'] font-bold mb-4 ${resultModal.success ? 'text-[#f9eabb]' : 'text-red-500'}`}>
                            {resultModal.title}
                        </h3>

                        {/* Message */}
                        <div className="bg-black/40 border border-white/10 p-4 mb-6 rounded">
                            <p className="text-gray-300 font-bold whitespace-pre-wrap leading-relaxed text-sm">
                                {resultModal.message}
                            </p>
                        </div>

                        {/* Button */}
                        <button 
                            onClick={closeResultModal}
                            className={`w-full py-3 font-bold uppercase tracking-widest text-xs transition-all
                                ${resultModal.success 
                                    ? 'bg-[#d4af37] text-black hover:bg-[#f9eabb]' 
                                    : 'bg-red-900 text-red-100 hover:bg-red-800'}`}
                        >
                            CONFIRM
                        </button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
};