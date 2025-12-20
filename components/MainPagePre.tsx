import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { UnicornBackground } from './UnicornBackground';
import { Globe, Scale, Bell, Lock, FileText, Users, ClipboardCheck, HelpCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { CharacterProfile } from '../types';

interface MainPagePreProps {
    profile: CharacterProfile;
    onNavigate: (tab: any) => void;
}

export const MainPagePre: React.FC<MainPagePreProps> = ({ profile, onNavigate }) => {
    
    // 라이브 피드 메시지 상태 (기본값 설정으로 화면에 무조건 뜨게 함)
    const [feedMessages, setFeedMessages] = useState<string[]>([
        "시스템 점검 중입니다.", 
        "잠시만 기다려주세요."
    ]);

    useEffect(() => {
        fetchFeeds();
        const interval = setInterval(fetchFeeds, 60000); // 1분마다 갱신
        return () => clearInterval(interval);
    }, []);

    const fetchFeeds = async () => {
        try {
            const messages: string[] = [];

            // 1. 관리자가 등록한 수동 메시지 가져오기 (오류나도 무시하고 진행)
            const { data: adminFeeds, error: feedError } = await supabase
                .from('admin_feeds')
                .select('content')
                .order('created_at', { ascending: false });
            
            if (!feedError && adminFeeds) {
                adminFeeds.forEach(f => messages.push(f.content));
            }

            // 2. 자동 카운트다운 메시지 생성
            const { data: setting, error: settingError } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'app_deadline')
                .single();

            if (!settingError && setting && setting.value) {
                const deadline = new Date(setting.value).getTime();
                const now = new Date().getTime();
                const diff = deadline - now;

                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    let timeStr = "";
                    if (days > 0) timeStr += `${days}일 `;
                    if (hours > 0) timeStr += `${hours}시간 `;
                    timeStr += `${minutes}분`;

                    messages.unshift(`[SYSTEM] 신청서 접수 마감까지 ${timeStr} 남았습니다.`);
                }
            }

            // 메시지가 하나도 없으면 기본 문구 표시
            if (messages.length === 0) {
                messages.push("현재 등록된 공지사항이 없습니다.");
                messages.push("SHOW ME THE BODY - Coming Soon.");
            }

            setFeedMessages(messages);
        } catch (e) {
            console.error("Feed Error:", e);
            // 에러 발생 시에도 기본 메시지 유지
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020f0a] text-[#f9eabb] font-sans selection:bg-[#d4af37] selection:text-black overflow-x-hidden flex flex-col items-center">
            
            <UnicornBackground />

            {/* 1. HERO SECTION */}
            <section className="w-full min-h-[55vh] flex flex-col justify-center items-center text-center px-4 relative mt-24 mb-6">
                <div className="relative z-10 animate-fade-in-up space-y-12 max-w-4xl">
                    
                    {/* 로고 */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 border-b border-[#d4af37]/40 pb-2 px-8 mb-2">
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></div>
                            <span className="text-sm font-['Cinzel'] text-[#d4af37] tracking-[0.3em] uppercase">High Stakes Community</span>
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></div>
                        </div>
                        <h1 className="font-['Cinzel'] text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-[#d4af37] to-yellow-900 drop-shadow-2xl tracking-tighter">
                            SHOW ME<br/>THE BODY
                        </h1>
                    </div>

                    {/* ACCESS RESTRICTED 메시지 */}
                    <div className="bg-black/80 border border-red-900/30 p-8 md:p-10 backdrop-blur-md relative max-w-2xl mx-auto shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <div className="flex flex-col items-center gap-4">
                            <Lock className="w-8 h-8 text-[#d4af37] animate-pulse" />
                            <h2 className="text-2xl font-['Cinzel'] font-bold text-[#d4af37] tracking-widest border-b-2 border-[#d4af37] pb-2">
                                ACCESS RESTRICTED
                            </h2>
                            <div className="space-y-4 text-gray-300 font-light leading-relaxed">
                                <p>
                                    현재 카지노 플로어와 거래소는 <span className="text-red-400 font-bold">보안 점검</span> 및 <span className="text-[#d4af37] font-bold">개장 준비</span> 중입니다.
                                </p>
                                <p className="text-sm md:text-base">
                                    예비 참가자님, 사전에 배포된 <br className="md:hidden"/>
                                    <span className="text-white font-bold border-b border-[#d4af37]/50 mx-1">세계관 가이드</span>와 
                                    <span className="text-white font-bold border-b border-[#d4af37]/50 mx-1">규칙</span>을 먼저 숙지해주십시오.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* [추가] LIVE FEED (Ticker) - 확실하게 보이도록 배경색과 테두리 추가 */}
            <section className="w-full max-w-7xl mx-auto px-6 mb-12 z-20 relative">
                <div className="w-full bg-[#020f0a] border-y border-[#d4af37]/30 h-14 flex items-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                    <div className="bg-[#020f0a] px-6 h-full flex items-center justify-center z-10 border-r border-[#d4af37]/30">
                        <Bell size={16} className="text-[#d4af37] animate-pulse" />
                        <span className="font-bold text-[#d4af37] text-xs ml-3 tracking-widest font-['Cinzel'] hidden md:inline">NOTICE</span>
                    </div>
                    <div className="whitespace-nowrap overflow-hidden flex-1 relative bg-[#020f0a]/80 backdrop-blur-sm flex items-center">
                        <div className="animate-marquee inline-block pt-1">
                            {feedMessages.map((msg, i) => (
                                <span key={i} className="mx-12 font-sans text-sm tracking-wide text-gray-300">
                                    {msg.includes('[SYSTEM]') ? (
                                        <span className="text-[#d4af37] font-bold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">{msg}</span>
                                    ) : (
                                        msg
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. MAIN CONTENT (Schedule + Quick Menu) */}
            <section className="w-full max-w-7xl mx-auto px-6 pb-20 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                    
                    {/* [LEFT COLUMN] OFFICIAL SCHEDULE (비중 2/3) */}
                    <div className="lg:flex-[2] border border-[#d4af37]/20 bg-[#020f0a]/80 backdrop-blur-sm p-8 relative">
                        <h2 className="text-2xl font-['Cinzel'] text-[#d4af37] text-center mb-8 flex items-center justify-center gap-4">
                            <span className="h-px w-8 bg-[#d4af37]/50"></span>
                            OFFICIAL SCHEDULE
                            <span className="h-px w-8 bg-[#d4af37]/50"></span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                            {/* Pre-Opening */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-['Cinzel'] font-bold text-gray-400 text-center uppercase tracking-[0.2em] mb-4">
                                    Pre-Opening
                                </h3>
                                <ul className="space-y-2">
                                    <ScheduleItem title="통합 공지 공개" date="2/5 20:00" />
                                    <ScheduleItem title="MPC 공개" date="2/7 20:00" />
                                    <ScheduleItem title="신청서 접수" date="2/15 ~ 2/20" highlight />
                                    <ScheduleItem title="합격자 발표" date="2/21 20:00" highlightColor="text-[#f9eabb]" />
                                </ul>
                            </div>

                            {/* Post-Opening */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-['Cinzel'] font-bold text-[#d4af37] text-center uppercase tracking-[0.2em] mb-4">
                                    Post-Opening
                                </h3>
                                <ul className="space-y-2">
                                    <ScheduleItem title="텍관 형성 기간" date="2/21 ~ 2/22" />
                                    <ScheduleItem title="인트로 (Intro)" date="2/22 20:00" />
                                    <ScheduleItem title="EVENT 1" date="2/25" />
                                    <ScheduleItem title="EVENT 2" date="2/28" />
                                    <ScheduleItem title="EVENT 3" date="3/4" />
                                    <ScheduleItem title="아웃트로 (Outro)" date="3/7 20:00" />
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* [RIGHT COLUMN] QUICK LINKS (비중 1/3) */}
                    <div className="lg:flex-[1] flex flex-col gap-4 justify-center">
                        <div className="h-full flex flex-col gap-4">
                            <QuickLinkButton 
                                icon={<FileText />} 
                                label="Application" 
                                subLabel="신청서 바로가기" 
                                isExternal
                                onClick={() => window.open('https://google.com', '_blank')} 
                            />
                            <QuickLinkButton 
                                icon={<Users />} 
                                label="Character Guide" 
                                subLabel="캐릭터 설정 가이드" 
                                onClick={() => onNavigate('system')} 
                            />
                            <QuickLinkButton 
                                icon={<ClipboardCheck />} 
                                label="Status Check" 
                                subLabel="신청서 접수 현황" 
                                onClick={() => onNavigate('notice')} 
                            />
                            <QuickLinkButton 
                                icon={<HelpCircle />} 
                                label="Q & A" 
                                subLabel="질의 응답" 
                                onClick={() => onNavigate('world')} 
                            />
                        </div>
                    </div>

                </div>
            </section>

            {/* 3. ACCESS POINTS */}
            <section className="w-full max-w-6xl mx-auto px-6 pb-24 z-10">
                 <div className="flex flex-col items-center mb-8">
                    <h2 className="font-['Cinzel'] text-xl text-gray-500 tracking-[0.2em]">SYSTEM ACCESS</h2>
                    <div className="h-[1px] w-20 bg-[#d4af37]/30 mt-3"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AccessCard 
                        icon={<Globe />} 
                        label="World View" 
                        desc="세계관 가이드 확인" 
                        onClick={() => onNavigate('world')} 
                    />
                    <AccessCard 
                        icon={<Scale />} 
                        label="Rules & System" 
                        desc="규칙 및 시스템" 
                        onClick={() => onNavigate('system')} 
                    />
                    <AccessCard 
                        icon={<Bell />} 
                        label="Notice" 
                        desc="공지사항 확인" 
                        onClick={() => onNavigate('notice')} 
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-black py-10 border-t border-gray-900 relative z-20">
                <div className="text-gray-600 text-xs font-mono text-center space-y-2">
                    <p>THE HOUSE ALWAYS WINS. PLAY RESPONSIBLY.</p>
                    <p>© 2025 SHOW ME THE BODY. NOIR CASINO PROJECT.</p>
                </div>
            </footer>

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
            `}</style>
        </div>
    );
};

// 스케줄 아이템
const ScheduleItem = ({ title, date, highlight = false, highlightColor = "text-[#d4af37]" }: any) => (
    <li className={`flex justify-between items-center border-b border-[#d4af37]/10 py-2.5 px-2 transition-colors hover:bg-[#d4af37]/5 group`}>
        <span className="text-sm tracking-wide text-gray-400 group-hover:text-gray-300">
            {title}
        </span>
        <span className={`font-['Cinzel'] font-bold text-sm tracking-widest ${highlight ? 'text-[#f9eabb]' : highlightColor}`}>
            {date}
        </span>
    </li>
);

// 우측 퀵 메뉴 버튼
const QuickLinkButton = ({ icon, label, subLabel, onClick, isExternal = false }: any) => (
    <button 
        onClick={onClick}
        className="group flex-1 flex items-center justify-between p-6 border border-[#d4af37]/30 bg-[#020f0a]/60 hover:bg-[#d4af37] transition-all duration-300 relative overflow-hidden"
    >
        <div className="flex items-center gap-5 relative z-10">
            <span className="text-[#d4af37] group-hover:text-black transition-colors duration-300">
                {React.cloneElement(icon, { size: 24 })}
            </span>
            <div className="text-left">
                <div className="text-[10px] text-[#d4af37] group-hover:text-black/70 uppercase tracking-widest font-['Cinzel'] mb-0.5 transition-colors">
                    {label}
                </div>
                <div className="text-base font-bold text-gray-300 group-hover:text-black transition-colors">
                    {subLabel}
                </div>
            </div>
        </div>
        <div className="relative z-10">
            {isExternal ? (
                <ExternalLink size={16} className="text-[#d4af37] group-hover:text-black transition-colors" />
            ) : (
                <ChevronRight size={18} className="text-[#d4af37] group-hover:text-black group-hover:translate-x-1 transition-all" />
            )}
        </div>
    </button>
);

// 하단 액세스 카드
const AccessCard = ({ icon, label, desc, onClick }: any) => (
    <button 
        onClick={onClick}
        className="group flex flex-col items-center justify-center p-6 bg-[#020f0a] border border-[#d4af37]/20 hover:border-[#d4af37] hover:bg-[#d4af37]/5 transition-all duration-300 h-32"
    >
        <div className="text-[#d4af37] mb-2 group-hover:scale-110 transition-transform duration-300">
            {React.cloneElement(icon, { size: 24, strokeWidth: 1.5 })}
        </div>
        <div className="text-sm font-['Cinzel'] font-bold text-[#f9eabb] mb-1 tracking-widest group-hover:text-white">
            {label}
        </div>
        <div className="text-[10px] text-gray-500 font-mono group-hover:text-[#d4af37]">
            {desc}
        </div>
    </button>
);