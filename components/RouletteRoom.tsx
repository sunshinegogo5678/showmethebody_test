import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RouletteRound, RouletteBet, BetType, RouletteStatus } from '../types';
import { ArrowLeft, Mic, Zap, Lock, RefreshCw, Coins } from 'lucide-react';

interface RouletteRoomProps {
    onBack: () => void;
    onCoinUpdate: () => void;
}

// Helper: Determine number color
const getNumberColor = (num: number): 'RED' | 'BLACK' | 'GREEN' => {
    if (num === 0) return 'GREEN';
    const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    return reds.includes(num) ? 'RED' : 'BLACK';
};

const CHIP_VALUES = [10, 50, 100, 500, 1000];

export const RouletteRoom: React.FC<RouletteRoomProps> = ({ onBack, onCoinUpdate }) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [round, setRound] = useState<RouletteRound | null>(null);
    const [bets, setBets] = useState<RouletteBet[]>([]);
    const [selectedChip, setSelectedChip] = useState(10);
    const [myBetTotal, setMyBetTotal] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [lastResult, setLastResult] = useState<{number: number, color: string, won: number} | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [adminMsg, setAdminMsg] = useState('');
    
    const processedRoundId = useRef<string | null>(null);

    // 1. Initial Data Fetch & Subscription
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // profiles 테이블에서 coin 정보를 가져옴
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setCurrentUser({ ...user, ...profile, isAdmin: profile?.is_admin });
            }
            fetchLatestRound();
        };
        init();

        const channel = supabase.channel('roulette_room_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'roulette_rounds' },
                (payload) => {
                    const newRound = payload.new as RouletteRound;
                    
                    if (payload.eventType === 'INSERT') {
                        setRound(newRound);
                        setBets([]);
                        setMyBetTotal(0);
                        setShowResultModal(false);
                        processedRoundId.current = null; 
                    } else if (payload.eventType === 'UPDATE') {
                        setRound(newRound);
                        if (newRound.status === 'COMPLETED') {
                            handleRoundCompletion(newRound);
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'roulette_bets' },
                (payload) => {
                    const changedBet = payload.new as RouletteBet;
                    setBets((prev) => {
                        const exists = prev.find(b => b.user_id === changedBet.user_id);
                        if (exists) {
                            return prev.map(b => b.user_id === changedBet.user_id ? changedBet : b);
                        }
                        return [...prev, changedBet];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => setToastMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMsg]);

    const fetchLatestRound = async () => {
        const { data } = await supabase
            .from('roulette_rounds')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const currentRound = data[0];
            setRound(currentRound);
            
            const { data: betsData } = await supabase
                .from('roulette_bets')
                .select('*')
                .eq('round_id', currentRound.id);
            
            if (betsData) setBets(betsData);

            if (currentRound.status === 'COMPLETED') {
                processedRoundId.current = currentRound.id;
            }
        }
    };

    // --- Core Logic: Payout & Stats ---
    const handleRoundCompletion = async (completedRound: RouletteRound) => {
        if (processedRoundId.current === completedRound.id) return;
        processedRoundId.current = completedRound.id;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: myBets } = await supabase
            .from('roulette_bets')
            .select('*')
            .eq('round_id', completedRound.id)
            .eq('user_id', user.id);

        // 내 베팅이 없으면 종료
        if (!myBets || myBets.length === 0) return;

        let totalBet = 0;
        let totalWinnings = 0;
        
        const resNum = completedRound.result_number!;
        const resColor = completedRound.result_color!;
        const resParity = resNum === 0 ? 'NONE' : resNum % 2 === 0 ? 'EVEN' : 'ODD';

        myBets.forEach(bet => {
            totalBet += bet.amount;
            if (bet.bet_type === 'NUMBER' && parseInt(bet.bet_value) === resNum) totalWinnings += bet.amount * 36;
            else if (bet.bet_type === 'COLOR' && bet.bet_value === resColor) totalWinnings += bet.amount * 2;
            else if (bet.bet_type === 'PARITY' && bet.bet_value === resParity) totalWinnings += bet.amount * 2;
        });

        setLastResult({ number: resNum, color: resColor, won: totalWinnings });
        
        // ✅ SQL 함수(settle_roulette_game)를 호출하여 정산 및 로그 저장
        // 베팅 때 이미 돈이 차감되었으므로, 여기서는 획득금만 더하고 기록을 남깁니다.
        const { data, error } = await supabase.rpc('settle_roulette_game', {
            p_user_id: user.id,
            p_game_type: 'roulette',
            p_total_bet: totalBet,
            p_total_winnings: totalWinnings,
            p_description: totalWinnings > 0 
                ? `Roulette Win (${resNum} ${resColor})` 
                : `Roulette Loss (${resNum} ${resColor})`
        });

        if (error) {
            console.error("Roulette Settlement Error:", error);
        } else {
            // 성공 시 로컬 상태 업데이트 및 부모 알림
            if(data && data.success) {
                setCurrentUser((prev: any) => ({ ...prev, coin: data.new_balance }));
                onCoinUpdate(); 
            }
        }

        setTimeout(() => setShowResultModal(true), 2000);
    };

    // --- User Action: Place Bet (Upsert) ---
    const placeBet = async (type: BetType, value: string) => {
        if (!round || round.status !== 'WAITING') {
            setToastMsg("Bets are closed!");
            return;
        }
        if (!currentUser) return;

        const existingBet = bets.find(b => b.user_id === currentUser.id);
        const previousAmount = existingBet ? existingBet.amount : 0;
        const costDiff = selectedChip - previousAmount;

        if (currentUser.coin < costDiff) {
            setToastMsg("Insufficient funds!");
            return;
        }

        // 1. 코인 차감 (coin 컬럼 사용)
        const newBalance = currentUser.coin - costDiff;
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ coin: newBalance })
            .eq('id', currentUser.id);

        if (profileError) {
            setToastMsg("Transaction Error");
            return;
        }

        setCurrentUser((prev: any) => ({ ...prev, coin: newBalance }));
        onCoinUpdate(); // 베팅 시에도 잔액 갱신 알림

        // 2. 베팅 저장
        const { error: betError } = await supabase.from('roulette_bets').upsert({
            round_id: round.id,
            user_id: currentUser.id,
            user_name: currentUser.name_kr || 'Unknown Agent',
            bet_type: type,
            bet_value: value,
            amount: selectedChip
        }, { onConflict: 'round_id, user_id' });

        if (betError) {
            alert("Betting failed. Please contact admin.");
        } else {
            setMyBetTotal(selectedChip);
            setToastMsg(existingBet ? `Bet Updated: ${value}` : `Bet Placed: ${value}`);
        }
    };

    // --- Admin Actions ---
    const adminCreateRound = async () => {
        const { error } = await supabase.from('roulette_rounds').insert({
            status: 'WAITING',
            dealer_message: 'New round started. Place your bets.',
            result_number: null,
            result_color: null
        });
        if (error) alert("Error creating round: " + error.message);
    };

    const adminUpdateStatus = async (status: RouletteStatus, msg?: string) => {
        if (!round) return;
        const updateData: any = { status };
        if (msg) updateData.dealer_message = msg;
        await supabase.from('roulette_rounds').update(updateData).eq('id', round.id);
    };

    const adminSpin = async () => {
        if (!round) return;
        const resultNum = Math.floor(Math.random() * 37);
        const resultColor = getNumberColor(resultNum);

        await supabase.from('roulette_rounds').update({
            status: 'COMPLETED',
            result_number: resultNum,
            result_color: resultColor,
            dealer_message: `Result: ${resultNum} (${resultColor})`
        }).eq('id', round.id);
    };

    const renderBoardNumber = (num: number) => {
        const color = getNumberColor(num);
        const colorClass = color === 'RED' ? 'bg-red-800' : color === 'BLACK' ? 'bg-gray-900' : 'bg-green-700';
        return (
            <button
                key={num}
                onClick={() => placeBet('NUMBER', num.toString())}
                disabled={round?.status !== 'WAITING'}
                className={`${colorClass} w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-[#d4af37]/30 text-[#f9eabb] font-bold text-sm md:text-base hover:scale-110 hover:z-10 hover:border-[#d4af37] transition-all disabled:opacity-50 disabled:hover:scale-100`}
            >
                {num}
            </button>
        );
    };

    return (
        <div className="relative animate-fade-in flex flex-col h-full overflow-hidden bg-[#020f0a]">
            {/* Toast */}
            {toastMsg && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#d4af37] text-black px-6 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(212,175,55,0.5)] animate-fade-in-up">
                    {toastMsg}
                </div>
            )}

            {/* Header */}
            <div className="shrink-0 p-4 pb-2 border-b border-[#d4af37]/20 bg-[#05140e]/80 backdrop-blur-md flex items-center justify-between z-20">
                <button onClick={onBack} className="text-[#d4af37] hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> Exit Room
                </button>
                <div className="flex-1 mx-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 border border-[#d4af37]/30 rounded-full">
                        <Mic size={14} className="text-[#d4af37] animate-pulse" />
                        <span className="text-[#f9eabb] font-serif italic text-sm">
                            {round?.dealer_message || "Connecting to Dealer..."}
                        </span>
                    </div>
                </div>
                {/* 실시간 코인 */}
                <div className="text-[#d4af37] flex items-center gap-2 font-mono text-sm">
                    <Coins size={14} />
                    {/* currentUser.coin이 없으면 0 표시 */}
                    <span>{currentUser?.coin?.toLocaleString() || 0}</span>
                </div>
            </div>

             {/* Main Game Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center gap-8">
                
                {/* Result Display */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0">
                    <div className={`absolute inset-0 rounded-full border-[8px] border-dashed border-[#d4af37]/20 ${round?.status === 'SPINNING' ? 'animate-spin duration-[3s]' : ''}`}></div>
                    <div className={`absolute inset-4 rounded-full border-[2px] border-[#d4af37]/10 ${round?.status === 'SPINNING' ? 'animate-spin duration-[5s] reverse' : ''}`}></div>
                    
                    <div className="relative z-10 text-center">
                        {round?.status === 'COMPLETED' && round.result_number !== null ? (
                            <div className="animate-fade-in-up">
                                <span className={`block text-6xl md:text-7xl font-['Cinzel'] font-bold ${round.result_color === 'RED' ? 'text-red-500' : round.result_color === 'BLACK' ? 'text-gray-400' : 'text-green-500'}`}>
                                    {round.result_number}
                                </span>
                                <span className="text-xs uppercase tracking-widest text-[#d4af37]">{round.result_color}</span>
                            </div>
                        ) : (
                            <span className="text-4xl font-serif italic text-[#d4af37]/40">
                                {round?.status === 'SPINNING' ? 'Rolling...' : 'Place Bets'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Board */}
                <div className="w-full max-w-4xl mx-auto">
                    <div className="flex justify-center mb-1">
                        {renderBoardNumber(0)}
                    </div>
                    <div className="grid grid-cols-12 gap-1 mb-4">
                        {Array.from({length: 36}, (_, i) => i + 1).map(num => (
                             <div key={num} className="col-span-1 flex justify-center">
                                 {renderBoardNumber(num)}
                             </div>
                        ))}
                    </div>
                    {/* Side Bets */}
                    <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
                        <SideBetBtn label="RED" color="bg-red-900/50" onClick={() => placeBet('COLOR', 'RED')} disabled={round?.status !== 'WAITING'} />
                        <SideBetBtn label="BLACK" color="bg-gray-900/50" onClick={() => placeBet('COLOR', 'BLACK')} disabled={round?.status !== 'WAITING'} />
                        <SideBetBtn label="EVEN" color="bg-[#d4af37]/10" onClick={() => placeBet('PARITY', 'EVEN')} disabled={round?.status !== 'WAITING'} />
                        <SideBetBtn label="ODD" color="bg-[#d4af37]/10" onClick={() => placeBet('PARITY', 'ODD')} disabled={round?.status !== 'WAITING'} />
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="shrink-0 bg-[#020f0a] border-t border-[#d4af37]/20 p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Left: Chips */}
                <div className="md:col-span-4 flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#d4af37]/60">Chip Value</p>
                    <div className="flex gap-2">
                        {CHIP_VALUES.map(val => (
                            <button
                                key={val}
                                onClick={() => setSelectedChip(val)}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:-translate-y-1 ${selectedChip === val ? 'border-[#d4af37] bg-[#d4af37] text-black scale-110' : 'border-[#d4af37]/30 bg-[#05140e] text-[#d4af37]'}`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        Current Bet: <span className="text-[#d4af37] font-mono">{myBetTotal}</span>
                    </div>
                </div>

                {/* Center: Live Log */}
                <div className="md:col-span-4 h-32 bg-black/40 border border-[#d4af37]/10 rounded p-2 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-1 sticky top-0 bg-[#020f0a]/90 backdrop-blur w-full pb-1 border-b border-[#d4af37]/10">
                         <p className="text-[9px] uppercase tracking-widest text-gray-500">Live Bets</p>
                         <RefreshCw size={10} className="text-gray-600"/>
                    </div>
                    <div className="space-y-1">
                        {bets.length === 0 ? (
                            <p className="text-gray-600 text-xs italic text-center mt-4">No bets placed yet.</p>
                        ) : (
                            bets.map((bet, idx) => (
                                <div key={bet.id || idx} className={`flex justify-between text-xs animate-fade-in-up ${bet.user_id === currentUser?.id ? 'text-[#f9eabb] font-bold bg-[#d4af37]/10 px-1 rounded' : 'text-gray-300'}`}>
                                    <span>{bet.user_name} {bet.user_id === currentUser?.id && '(You)'}</span>
                                    <span className="text-[#d4af37]">
                                        {bet.bet_type === 'NUMBER' ? `on ${bet.bet_value}` : `on ${bet.bet_value}`} 
                                        <span className="text-gray-500 ml-1">({bet.amount})</span>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Admin / Status */}
                <div className="md:col-span-4 flex flex-col justify-end">
                    {currentUser?.isAdmin ? (
                        <div className="p-3 bg-red-900/10 border border-red-900/30 rounded flex flex-col gap-2">
                            <p className="text-[10px] uppercase text-red-400 font-bold flex items-center gap-1"><Lock size={10}/> Dealer Controls</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => adminCreateRound()} className="bg-gray-700 text-xs py-1 rounded hover:bg-gray-600">New Round</button>
                                <button onClick={() => adminUpdateStatus('SPINNING', 'Bets Closed! Spinning...')} className="bg-red-900 text-red-100 text-xs py-1 rounded hover:bg-red-800">Close Bets</button>
                                <button onClick={() => adminSpin()} className="bg-[#d4af37] text-black text-xs py-1 rounded hover:bg-[#b4941f] font-bold col-span-2">SPIN (Result)</button>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Broadcast message..." 
                                value={adminMsg}
                                onChange={e => setAdminMsg(e.target.value)}
                                onKeyDown={e => {
                                    if(e.key === 'Enter') {
                                        adminUpdateStatus(round?.status || 'WAITING', adminMsg);
                                        setAdminMsg('');
                                    }
                                }}
                                className="bg-black/50 border border-red-900/30 text-xs p-1 text-red-200 w-full"
                            />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center p-4 border border-[#d4af37]/10 rounded bg-[#d4af37]/5">
                             <p className="text-[#d4af37] font-serif italic text-sm">
                                "Fortune favors the bold."
                             </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {showResultModal && lastResult && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-[90%] max-w-md bg-[#020f0a] border border-[#d4af37] p-8 text-center relative shadow-[0_0_50px_rgba(212,175,55,0.3)]">
                        <button onClick={() => setShowResultModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><Zap size={16}/></button>
                        
                        <div className="w-20 h-20 mx-auto rounded-full bg-black border-4 border-[#d4af37] flex items-center justify-center mb-6 shadow-inner">
                            <span className={`text-4xl font-bold ${lastResult.color === 'RED' ? 'text-red-500' : lastResult.color === 'BLACK' ? 'text-gray-200' : 'text-green-500'}`}>
                                {lastResult.number}
                            </span>
                        </div>

                        <h3 className="text-2xl font-['Cinzel'] text-[#f9eabb] mb-2">
                            {lastResult.won > 0 ? 'WINNER!' : 'ROUND OVER'}
                        </h3>
                        
                        <p className="text-gray-400 text-sm mb-6 font-serif">
                            {lastResult.won > 0 
                                ? `You predicted correctly and won ${lastResult.won} coins!` 
                                : `The ball landed on ${lastResult.number} (${lastResult.color}). Better luck next time.`}
                        </p>

                        <button 
                            onClick={() => setShowResultModal(false)}
                            className="px-8 py-2 bg-[#d4af37] text-black font-bold uppercase tracking-widest hover:bg-[#f9eabb]"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SideBetBtn: React.FC<{ label: string, color: string, onClick: () => void, disabled: boolean }> = ({ label, color, onClick, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`${color} border border-transparent hover:border-[#d4af37] text-gray-200 py-3 text-xs font-bold rounded shadow-inner transition-all hover:brightness-125 disabled:opacity-50 disabled:hover:border-transparent`}
    >
        {label}
    </button>
);