import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UnicornBackground } from './UnicornBackground';
import { Coins, Bell, Dices, Map, Skull, Gift, Beaker, ShieldAlert, Users, TrendingUp, Trophy, Zap, Check, X, Calendar } from 'lucide-react';
import { CharacterProfile } from '../types';

interface MainPagePostProps {
    profile: CharacterProfile;
    onNavigate: (tab: any) => void;
}

const SHORTCUTS = [
    { id: 'casino', label: 'Casino Floor', description: 'Test your luck', iconName: 'Dices' },
    { id: 'investigation', label: 'Investigation', description: 'Explore the city', iconName: 'Map' },
    { id: 'parts_shop', label: 'Black Market', description: 'Buy parts', iconName: 'Skull' },
    { id: 'crafting', label: 'Synthesis Lab', description: 'Craft items', iconName: 'Beaker' },
    { id: 'gift_shop', label: 'Gift Shop', description: 'Send gifts', iconName: 'Gift' },
    { id: 'members', label: 'Members', description: 'View agents', iconName: 'Users' },
];

type RankTab = 'rich' | 'gambler' | 'jackpot';

export const MainPagePost: React.FC<MainPagePostProps> = ({ profile, onNavigate }) => {
    const [scrolled, setScrolled] = useState(false);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [rankData, setRankData] = useState<any[]>([]);
    const [currentRankTab, setCurrentRankTab] = useState<RankTab>('rich');
    const [rankLoading, setRankLoading] = useState(false);
    
    // [수정] DB에서 가져온 일정 데이터를 담을 state
    const [scheduleData, setScheduleData] = useState<any[]>([]);

    // Attendance States
    const [attendanceStartDate, setAttendanceStartDate] = useState<string>('');
    const [attendanceGrid, setAttendanceGrid] = useState<string[]>([]);
    const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
    const [todayStr, setTodayStr] = useState('');
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [loadingCheckIn, setLoadingCheckIn] = useState(false);
    
    // Modal State
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardMessage, setRewardMessage] = useState('');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchSystemSettings();
            fetchLogs();
            fetchRankings(currentRankTab);
            fetchSchedules(); // [수정] 일정 가져오기 실행
        };
        init();
        
        const interval = setInterval(fetchLogs, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (attendanceStartDate) {
            generateAttendanceGrid(attendanceStartDate);
            fetchAttendanceStatus();
        }
    }, [attendanceStartDate]);

    useEffect(() => {
        fetchRankings(currentRankTab);
    }, [currentRankTab]);

    // [New] Supabase에서 일정 가져오기 및 활성화 로직
    const fetchSchedules = async () => {
        const { data } = await supabase
            .from('schedules')
            .select('*')
            .order('sort_date', { ascending: true });

        if (data) {
            const now = new Date();
            
            // "Active" 로직:
            // 1. 현재 시간이 일정 시간보다 지났지만, 다음 일정보다는 전인 경우 (진행 중)
            // 2. 만약 진행 중인 게 없다면, 가장 가까운 미래의 일정 (다가오는 일정)
            
            let activeIndex = -1;

            // 1. 진행 중인 일정 찾기
            for (let i = 0; i < data.length; i++) {
                const itemDate = new Date(data[i].sort_date);
                const nextItem = data[i + 1];
                const nextDate = nextItem ? new Date(nextItem.sort_date) : new Date(9999, 11, 31);

                if (now >= itemDate && now < nextDate) {
                    activeIndex = i;
                    break;
                }
            }

            // 2. 진행 중인 게 없다면, 아직 오지 않은 가장 첫 번째 일정 찾기 (Upcoming)
            if (activeIndex === -1) {
                for (let i = 0; i < data.length; i++) {
                    const itemDate = new Date(data[i].sort_date);
                    if (now < itemDate) {
                        activeIndex = i;
                        break;
                    }
                }
            }

            // 3. 데이터 가공
            const processed = data.map((item, index) => ({
                ...item,
                active: index === activeIndex
            }));

            setScheduleData(processed);
        }
    };

    const fetchSystemSettings = async () => {
        const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'attendance_start_date')
            .single();
        
        const startDate = data?.value || new Date().toISOString().split('T')[0];
        setAttendanceStartDate(startDate);
        
        const today = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
        setTodayStr(today.toISOString().split('T')[0]);
    };

    const generateAttendanceGrid = (startDateStr: string) => {
        const dates = [];
        const startObj = new Date(startDateStr);
        
        for (let i = 0; i < 14; i++) {
            const d = new Date(startObj);
            d.setDate(startObj.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        setAttendanceGrid(dates);
    };

    const fetchLogs = async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: logs } = await supabase
            .from('activity_logs')
            .select('type, description, amount, created_at, profiles(name_kr)')
            .gte('created_at', yesterday) 
            .order('created_at', { ascending: false })
            .limit(50);

        if (!logs) return;

        const filteredLogs = logs.filter(log => {
            if (log.type === 'GAME_RESULT' && log.amount >= 1000) return true;
            if (['INVEST', 'CRAFT', 'SYSTEM', 'ADMIN_GIFT'].includes(log.type)) return true;
            return false;
        }).slice(0, 20);

        const processedLogs = filteredLogs.map(log => {
            let cleanDesc = log.description;
            if (log.type === 'INVEST' && cleanDesc.includes('에서')) {
                const parts = cleanDesc.split('에서');
                if (parts.length > 1) cleanDesc = parts[1].trim();
            }
            return { ...log, description: cleanDesc };
        });

        setRecentLogs(processedLogs);
    };

    const fetchRankings = async (tab: RankTab) => {
        setRankLoading(true);
        setRankData([]); 
        try {
            if (tab === 'rich' || tab === 'gambler') {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, name_kr, coin, image_url, role')
                    .order('coin', { ascending: false })
                    .limit(5);
                if (data) setRankData(data);
            } else if (tab === 'jackpot') {
                const { data } = await supabase
                    .from('activity_logs')
                    .select('amount, created_at, profiles(id, name_kr, image_url, role)')
                    .gt('amount', 4999)
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (data) {
                    const formatted = data.map((log: any) => ({
                        id: log.profiles?.id,
                        name_kr: log.profiles?.name_kr,
                        image_url: log.profiles?.image_url,
                        role: 'Jackpot Winner',
                        coin: log.amount,
                        isJackpotLog: true
                    }));
                    setRankData(formatted);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRankLoading(false);
        }
    };

    const fetchAttendanceStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase.from('attendance_logs').select('check_in_date').eq('user_id', user.id);
        if (data) {
            const checkedSet = new Set(data.map(d => d.check_in_date));
            setCheckedDates(checkedSet);
            if (checkedSet.has(todayStr)) setHasCheckedInToday(true);
        }
    };

    const handleCheckIn = async () => {
        if (hasCheckedInToday || loadingCheckIn) return;
        setLoadingCheckIn(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.rpc('perform_daily_checkin');
            
            if (!error && data.success) {
                await supabase.from('activity_logs').insert([{
                    user_id: user.id,
                    type: 'ATTENDANCE',
                    description: `일일 출석체크 완료: ${data.message}`,
                    amount: 0,
                    created_at: new Date().toISOString()
                }]);
                
                setRewardMessage(data.message);
                setShowRewardModal(true);
                setHasCheckedInToday(true);
                setCheckedDates(prev => new Set(prev).add(todayStr));
            } else {
                alert(data?.message || '출석 실패');
            }
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        } finally {
            setLoadingCheckIn(false);
        }
    };

    const formatCoin = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

    return (
        <div className="relative min-h-screen bg-[#020f0a] text-[#f9eabb] font-sans selection:bg-[#d4af37] selection:text-black overflow-x-hidden">
            <UnicornBackground />

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 max-w-[1600px] mx-auto w-full z-40 transition-all duration-300 border-b ${scrolled ? 'bg-[#020f0a]/95 backdrop-blur-md border-[#d4af37]/20 py-3' : 'bg-transparent border-transparent py-6'}`}>
                <div className="w-full px-6 md:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-5 cursor-pointer group" onClick={() => onNavigate('main')}>
                        <div className="relative w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
                            <div className="w-9 h-9 bg-[#d4af37] transform rotate-45 shadow-[0_0_20px_rgba(212,175,55,0.3)]"></div>
                            <div className="absolute w-4 h-4 bg-[#020f0a]"></div>
                        </div>
                        <div className="flex flex-col leading-none justify-center">
                            <span className="font-['Cinzel'] font-bold text-base tracking-[0.15em] text-[#d4af37] group-hover:text-[#f9eabb] transition-colors">SHOW ME</span>
                            <span className="font-['Cinzel'] font-bold text-base tracking-[0.15em] text-[#d4af37] mt-1 group-hover:text-[#f9eabb] transition-colors">THE BODY</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Assets</span>
                            <div className="flex items-center gap-2 text-[#d4af37] font-mono font-bold text-xl tracking-tighter">
                                <Coins size={18} className="text-yellow-500" />
                                {formatCoin(profile.coin || 0)}
                            </div>
                        </div>
                        <div className="w-10 h-10 border border-[#d4af37]/50 bg-black cursor-pointer hover:border-[#d4af37] transition-colors flex items-center justify-center group" onClick={() => onNavigate('mypage')}>
                            <img src={profile.image_url || '/default_avatar.png'} alt="User" className="w-full h-full object-cover p-[2px] opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 flex flex-col items-center w-full pt-20 md:pt-0">

                {/* Hero Section */}
                <section className="w-full h-[50vh] min-h-[400px] flex flex-col justify-center items-center text-center px-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020f0a] z-0 pointer-events-none" />
                    <div className="relative z-10 animate-fade-in-up space-y-6 max-w-5xl">
                        <div className="inline-flex items-center gap-3 border-b border-[#d4af37]/40 pb-2 px-8 mb-2">
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></div>
                            <span className="text-sm font-['Cinzel'] text-[#d4af37] tracking-[0.3em] uppercase">High Stakes Community</span>
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></div>
                        </div>
                        <h1 className="font-['Cinzel'] text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-[#d4af37] to-yellow-900 drop-shadow-2xl tracking-tighter">
                            SHOW ME<br/>THE BODY
                        </h1>
                        <p className="font-light text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Welcome, <span className="text-[#f9eabb] font-['Playfair_Display'] italic text-2xl mx-1">{profile.name_kr}</span>.<br/>
                            <span className="text-[#d4af37] font-mono text-sm tracking-widest mt-2 block">Stake your soul, claim your fortune.</span>
                        </p>
                    </div>
                </section>

                {/* LIVE FEED */}
                <section className="w-full bg-[#020f0a] border-y border-[#d4af37]/20 h-14 flex items-center overflow-hidden relative z-20">
                    <div className="bg-[#020f0a] px-6 h-full flex items-center justify-center z-10 border-r border-[#d4af37]/20 shadow-[10px_0_20px_-5px_rgba(0,0,0,1)]">
                        <Bell size={18} className="text-[#d4af37] animate-pulse" />
                        <span className="font-bold text-[#d4af37] text-xs ml-3 tracking-widest font-['Cinzel'] hidden md:inline">LIVE FEED</span>
                    </div>
                    <div className="whitespace-nowrap overflow-hidden flex-1 relative bg-[#020f0a]/50 backdrop-blur-sm">
                        <div className="animate-marquee inline-block pt-1">
                            {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                                <span key={i} className="mx-12 font-sans text-sm tracking-wide">
                                    <span className={`font-bold mr-3 ${
                                        log.type === 'GAME_RESULT' ? 'text-purple-400' : 
                                        log.type === 'SYSTEM' ? 'text-red-500' : 
                                        log.type === 'CRAFT' ? 'text-green-400' :
                                        log.type === 'INVEST' ? 'text-blue-400' : 'text-[#d4af37]'
                                    }`}>
                                        [{log.type === 'GAME_RESULT' ? 'JACKPOT' : log.type}]
                                    </span>
                                    <span className="text-gray-200 font-medium">
                                        <span className="text-[#f9eabb] font-bold">{log.profiles?.name_kr}</span>: {log.description}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-3 font-mono">
                                        / {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </span>
                            )) : <span className="mx-12 text-gray-500">조용한 밤입니다...</span>}
                        </div>
                    </div>
                </section>

                {/* Main Content: Schedule & Attendance */}
                <section className="w-full max-w-7xl mx-auto px-6 mt-16 mb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                        
                        {/* Left: Schedule (From DB) */}
                        <div className="flex flex-col">
                            <div className="flex items-center mb-8">
                                <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45 mr-3"></div>
                                <h2 className="font-['Cinzel'] text-2xl text-[#d4af37] tracking-[0.2em]">POST-OPENING</h2>
                            </div>
                            
                            <div className="relative border-l border-[#d4af37]/30 ml-3 space-y-8 py-2">
                                {scheduleData.map((item, idx) => (
                                    <div key={idx} className="relative pl-8 group">
                                        <span className={`
                                            absolute -left-[5px] top-1.5 h-2.5 w-2.5 rotate-45 border border-[#d4af37] transition-all duration-300
                                            ${item.active ? 'bg-[#d4af37] shadow-[0_0_10px_#d4af37] scale-125' : 'bg-[#020f0a] group-hover:bg-[#d4af37]/50'}
                                        `}></span>
                                        
                                        <div className="flex justify-between items-baseline border-b border-[#d4af37]/10 pb-2">
                                            <span className={`font-['Cinzel'] font-bold text-sm tracking-widest ${item.active ? 'text-[#d4af37]' : 'text-gray-500'}`}>
                                                {item.title}
                                            </span>
                                            <span className={`font-mono text-xs ${item.active ? 'text-[#f9eabb]' : 'text-gray-600'}`}>
                                                {item.date_label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Daily Attendance */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45 mr-3"></div>
                                    <h2 className="font-['Cinzel'] text-2xl text-[#d4af37] tracking-[0.2em]">DAILY ATTENDANCE</h2>
                                </div>
                            </div>

                            <div className="bg-[#020f0a]/40 border border-[#d4af37]/20 p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-3xl -z-10"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Status</p>
                                        <div className={`font-['Cinzel'] text-lg font-bold ${hasCheckedInToday ? 'text-green-500' : 'text-red-400'}`}>
                                            {hasCheckedInToday ? 'ATTENDANCE COMPLETE' : 'NOT CHECKED IN'}
                                        </div>
                                    </div>
                                    <Calendar className="text-[#d4af37] opacity-50" size={24} />
                                </div>

                                <div className="grid grid-cols-7 gap-2 mb-6">
                                    {attendanceGrid.map((dateStr, index) => {
                                        const isChecked = checkedDates.has(dateStr);
                                        const isToday = dateStr === todayStr;
                                        const dateLabel = dateStr.substring(5).replace('-', '/');

                                        return (
                                            <div key={index} className={`
                                                aspect-square flex flex-col items-center justify-center border relative
                                                ${isChecked 
                                                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' 
                                                    : isToday 
                                                        ? 'border-[#d4af37] text-white animate-pulse' 
                                                        : 'border-gray-800 text-gray-700'}
                                            `}>
                                                <span className="text-[9px] font-mono absolute top-0.5 left-1 opacity-70">{dateLabel}</span>
                                                {isChecked ? <div className="w-2 h-2 bg-[#d4af37] rotate-45 mt-2"></div> : null}
                                            </div>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={handleCheckIn}
                                    disabled={hasCheckedInToday || loadingCheckIn}
                                    className={`
                                        w-full py-4 font-['Cinzel'] font-bold tracking-[0.2em] border transition-all duration-300 relative overflow-hidden
                                        ${hasCheckedInToday 
                                            ? 'bg-transparent border-gray-800 text-gray-600 cursor-not-allowed' 
                                            : 'bg-[#d4af37] border-[#d4af37] text-black hover:bg-white hover:text-black hover:scale-[1.02]'}
                                    `}
                                >
                                    {loadingCheckIn ? 'PROCESSING...' : hasCheckedInToday ? 'COME BACK TOMORROW' : 'CHECK IN NOW'}
                                </button>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Hall of Fame */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-24">
                    <div className="flex flex-col items-center mb-10">
                        <h2 className="font-['Cinzel'] text-2xl text-[#d4af37] tracking-[0.3em] font-semibold">HALL OF FAME</h2>
                        <div className="flex items-center gap-2 mt-3 opacity-50">
                            <div className="w-8 h-[1px] bg-[#d4af37]"></div>
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></div>
                            <div className="w-8 h-[1px] bg-[#d4af37]"></div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 mb-0 border-b border-[#d4af37]/20">
                        {[
                            { id: 'rich', label: 'RICH LIST' },
                            { id: 'gambler', label: 'TOP GAMBLERS' },
                            { id: 'jackpot', label: 'JACKPOT WINNERS' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentRankTab(tab.id as RankTab)}
                                className={`pb-4 px-2 font-['Cinzel'] text-xs tracking-[0.2em] font-bold transition-all relative
                                    ${currentRankTab === tab.id ? 'text-[#d4af37]' : 'text-gray-600 hover:text-gray-400'}
                                `}
                            >
                                {tab.label}
                                {currentRankTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d4af37] shadow-[0_0_10px_#d4af37]" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="border-x border-b border-[#d4af37]/10 bg-[#020f0a]/40 backdrop-blur-sm min-h-[300px] relative">
                        {rankLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                                <div className="animate-spin w-8 h-8 border-2 border-[#d4af37] rounded-full border-t-transparent"></div>
                            </div>
                        )}

                        {rankData.map((user, idx) => (
                            <div 
                                key={idx} 
                                className={`
                                    group flex items-center p-5 border-b border-[#d4af37]/5 hover:bg-white/[0.02] transition-all duration-300
                                    ${idx < 3 ? 'py-6' : 'py-4'}
                                `}
                            >
                                <div className="w-20 flex justify-center">
                                    <span className={`font-mono text-lg tracking-widest ${
                                        idx === 0 ? 'text-[#d4af37] font-bold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]' :
                                        idx === 1 ? 'text-gray-300 font-semibold' :
                                        idx === 2 ? 'text-amber-700 font-semibold' : 'text-gray-700'
                                    }`}>
                                        0{idx + 1}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 flex-1">
                                    <div className={`relative transition-transform duration-300 group-hover:scale-105 ${idx === 0 ? 'w-14 h-14' : 'w-10 h-10'}`}>
                                        <img src={user.image_url || '/default_avatar.png'} alt={user.name_kr} className="w-full h-full object-cover filter grayscale sepia-[0.5] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500 shadow-lg border border-[#d4af37]/20" />
                                    </div>
                                    <div>
                                        <h3 className={`font-['Cinzel'] font-bold tracking-wide transition-colors ${idx === 0 ? 'text-xl text-[#d4af37]' : 'text-base text-gray-300 group-hover:text-white'}`}>
                                            {user.name_kr || 'Unknown'}
                                        </h3>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">
                                            {user.isJackpotLog ? 'Big Win' : user.role || 'Agent'}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-40 text-right font-mono text-base tracking-tighter text-gray-400 group-hover:text-[#d4af37] transition-colors">
                                    {formatCoin(user.coin || 0)}
                                </div>
                                <div className="w-16 flex justify-end pr-4">
                                    {currentRankTab === 'jackpot' ? <Zap size={14} className="text-[#d4af37]" /> :
                                     currentRankTab === 'rich' ? <TrendingUp size={14} className="text-gray-800 group-hover:text-green-600 transition-colors" /> :
                                     <Trophy size={14} className="text-gray-800" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full max-w-6xl mx-auto px-6 mb-24">
                    <div className="flex flex-col items-center mb-16">
                        <h2 className="font-['Cinzel'] text-3xl text-white">Access Points</h2>
                        <div className="h-[1px] w-full max-w-xs bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SHORTCUTS.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className="group flex items-center bg-transparent border-l-2 border-gray-800 hover:border-[#d4af37] pl-6 py-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent text-left"
                            >
                                {/* 아이콘은 생략 없이 위와 동일 */}
                                {item.id === 'casino' && <Dices className="w-6 h-6 text-gray-500 group-hover:text-[#d4af37] transition-colors mr-4" strokeWidth={1.5} />}
                                {item.id === 'investigation' && <Map className="w-6 h-6 text-gray-500 group-hover:text-[#d4af37] transition-colors mr-4" strokeWidth={1.5} />}
                                {item.id === 'parts_shop' && <Skull className="w-6 h-6 text-gray-500 group-hover:text-[#d4af37] transition-colors mr-4" strokeWidth={1.5} />}
                                {item.id === 'crafting' && <Beaker className="w-6 h-6 text-gray-500 group-hover:text-[#d4af37] transition-colors mr-4" strokeWidth={1.5} />}
                                {item.id === 'gift_shop' && <Gift className="w-6 h-6 text-gray-500 group-hover:text-[#d4af37] transition-colors mr-4" strokeWidth={1.5} />}
                                {item.id === 'members' && <Users className="w-6 h-6 text-gray-500 group-hover:text-[#d4af37] transition-colors mr-4" strokeWidth={1.5} />}
                                
                                <div className="flex flex-col">
                                    <span className="font-['Cinzel'] text-lg font-bold text-gray-300 group-hover:text-white tracking-wider">{item.label}</span>
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest group-hover:text-[#d4af37]/70">{item.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <footer className="w-full bg-black py-16 border-t border-gray-900 mt-20 relative z-20">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-gray-600 text-xs font-mono text-center md:text-right space-y-2">
                            <p>THE HOUSE ALWAYS WINS. PLAY RESPONSIBLY.</p>
                            <p>© 2025 SHOW ME THE BODY. NOIR CASINO PROJECT.</p>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Global Modal */}
            {showRewardModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowRewardModal(false)} />
                    <div className="relative bg-[#0a0a0a] border border-[#d4af37] p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.2)] animate-fade-in-up">
                        <button onClick={() => setShowRewardModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-[#d4af37]/10 border border-[#d4af37] rotate-45 mx-auto flex items-center justify-center mb-8">
                                <Check size={32} className="text-[#d4af37] -rotate-45" />
                            </div>
                            <div>
                                <h3 className="font-['Cinzel'] text-2xl text-[#d4af37] font-bold mb-2">ATTENDANCE COMPLETE</h3>
                                <div className="w-12 h-0.5 bg-[#d4af37]/50 mx-auto"></div>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 border border-gray-800">
                                <p className="text-gray-300 font-mono text-sm whitespace-pre-line leading-relaxed">{rewardMessage}</p>
                            </div>
                            <button onClick={() => setShowRewardModal(false)} className="w-full py-3 bg-[#d4af37] text-black font-bold font-['Cinzel'] hover:bg-white transition-colors">CONFIRM</button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};