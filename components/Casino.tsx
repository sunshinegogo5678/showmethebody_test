import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { MOCK_GAMES } from '../constants';
import { SectionCard } from './SectionCard';
import { RankingBoard } from './RankingBoard';
import { PlayCircle, RotateCw, ArrowUp, ArrowDown, LogIn, Disc, X, Trophy } from 'lucide-react';
import { CasinoGame } from '../types';

interface CasinoProps {
    onEnterRoulette?: () => void;
    onCoinUpdate?: () => void;
}

export const Casino: React.FC<CasinoProps> = ({ onEnterRoulette, onCoinUpdate }) => {
  // [수정] 모달 상태를 상위 컴포넌트인 Casino로 이동 (화면 중앙 배치를 위해)
  const [modalInfo, setModalInfo] = useState<{
      show: boolean;
      title: string;
      desc: string;
      amount: number;
      isWin: boolean;
  } | null>(null);

  const handleGameEnd = (result: { title: string, desc: string, amount: number, isWin: boolean }) => {
      // 결과 확인을 위해 0.5초 딜레이 후 모달 띄우기
      setTimeout(() => {
          setModalInfo({ show: true, ...result });
      }, 500);
  };

  return (
    // [수정] relative 추가하여 절대 좌표의 기준점 설정
    <div className="animate-fade-in space-y-8 max-w-6xl mx-auto relative min-h-[800px]">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-['Cinzel'] text-[#d4af37] tracking-widest mb-2">HIGH STAKES FLOOR</h2>
        <div className="h-px w-24 bg-[#d4af37]/40 mx-auto"></div>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Select your game & place your bets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MOCK_GAMES.map((game) => (
          <ActiveGameCard 
            key={game.id} 
            game={game} 
            onEnterRoulette={onEnterRoulette} 
            onCoinUpdate={onCoinUpdate} 
            onGameEnd={handleGameEnd} // [수정] 결과 처리 함수 전달
          />
        ))}
      </div>

      <RankingBoard />

      {/* [수정] 결과 모달 (Global Absolute Overlay) - 게임판들 사이 정중앙 위치 */}
      {modalInfo?.show && (
        <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm animate-fade-in-up">
            <div className="bg-[#05140e] border border-[#d4af37] p-8 text-center shadow-[0_0_100px_rgba(0,0,0,0.9)] relative">
                
                <button onClick={() => setModalInfo(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white">
                    <X size={20}/>
                </button>

                {/* 장식용 코너 */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]"></div>

                <h4 className={`text-3xl font-['Cinzel'] font-bold mb-3 ${modalInfo.isWin ? 'text-[#d4af37]' : 'text-gray-500'}`}>
                    {modalInfo.title}
                </h4>
                <div className="h-px w-20 bg-[#d4af37]/30 mx-auto mb-4"></div>
                
                {/* [수정] 결과 텍스트 상세 표시 */}
                <p className="text-sm text-gray-300 mb-6 font-bold tracking-wide">
                    {modalInfo.desc}
                </p>
                
                <div className={`text-2xl font-mono font-bold mb-8 flex items-center justify-center gap-2 ${modalInfo.isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {modalInfo.isWin && <Trophy size={24} className="text-[#d4af37]"/>}
                    {modalInfo.amount > 0 ? '+' : ''}{modalInfo.amount.toLocaleString()} C
                </div>
                
                <button 
                    onClick={() => setModalInfo(null)}
                    className="w-full py-3 bg-[#d4af37] text-black font-bold uppercase text-sm hover:bg-[#f9eabb] transition-colors tracking-widest"
                >
                    CONFIRM
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

interface ActiveGameCardProps {
    game: CasinoGame;
    onEnterRoulette?: () => void;
    onCoinUpdate?: () => void;
    onGameEnd: (result: { title: string, desc: string, amount: number, isWin: boolean }) => void;
}

const ActiveGameCard: React.FC<ActiveGameCardProps> = ({ game, onEnterRoulette, onCoinUpdate, onGameEnd }) => {
  const [betAmount, setBetAmount] = useState<string>(game.minBet.toString());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'result'>('idle');
  const [userId, setUserId] = useState<string | null>(null);

  // UI State
  const [slotResult, setSlotResult] = useState(['7', '7', '7']);
  const [cardValue, setCardValue] = useState('A');
  const [rouletteNumber, setRouletteNumber] = useState('00');
  const [bjHand, setBjHand] = useState({ dealer: 18, player: 12 });

  const displayGameName = game.type === 'slot' ? 'SLOT MACHINE' : game.name;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const runSlotLogic = () => {
      const rand = Math.random() * 100;
      let symbols = [];
      let multiplier = 0;
      let isWin = false;
      let msg = '';

      if (rand < 5) { 
          // 5% 확률: 777 잭팟 (x10)
          symbols = ['7', '7', '7'];
          multiplier = 10;
          isWin = true;
          msg = 'JACKPOT!';
      } else if (rand < 20) { 
          // 15% 확률: BAR (x5)
          symbols = ['BAR', 'BAR', 'BAR'];
          multiplier = 5;
          isWin = true;
          msg = 'BIG WIN!';
      } else if (rand < 50) { 
          // 30% 확률: Cherry (x2)
          symbols = ['🍒', '🍒', '🍒'];
          multiplier = 2;
          isWin = true;
          msg = 'NICE!';
      } else {
          // 50% 확률: 꽝 (이미지 섞기)
          isWin = false;
          multiplier = 0;
          msg = '꽝';
          
          const pool = ['7', 'BAR', '🍒', '7', 'BAR'];
          const s1 = pool[Math.floor(Math.random() * pool.length)];
          let s2 = pool[Math.floor(Math.random() * pool.length)];
          while (s1 === s2) s2 = pool[Math.floor(Math.random() * pool.length)]; 
          const s3 = pool[Math.floor(Math.random() * pool.length)];
          
          symbols = [s1, s2, s3];
      }

      return { symbols, multiplier, isWin, msg };
  };

  const handlePlay = async () => {
    if (game.type === 'roulette' && onEnterRoulette) {
        onEnterRoulette();
        return;
    }

    if (!userId) {
        alert("로그인이 필요합니다.");
        return;
    }

    const currentBet = parseInt(betAmount);
    if (isNaN(currentBet) || currentBet < game.minBet) {
        alert(`최소 배팅 금액은 ${game.minBet} 입니다.`);
        setBetAmount(game.minBet.toString());
        return;
    }

    setGameStatus('playing');

    // 1.5초 동안 "돌아가는 연출" (Playing 상태)
    setTimeout(async () => {
        let isWin = false;
        let resultLog = '';
        let profitAmount = 0; 

        if (game.type === 'slot') {
            const result = runSlotLogic();
            setSlotResult(result.symbols);
            isWin = result.isWin;
            
            // [수정] 결과 텍스트 상세화: "슬롯머신 꽝 (🍒BAR7)" 형식
            resultLog = `슬롯머신 ${result.msg} (${result.symbols.join('')})`;
            
            profitAmount = isWin ? (currentBet * result.multiplier) - currentBet : -currentBet;
        } else {
            isWin = Math.random() > 0.5;
            if (game.type === 'highlow') {
                const ranks = ['K','Q','J','10','5','2'];
                setCardValue(ranks[Math.floor(Math.random() * ranks.length)]);
                resultLog = isWin ? '하이로우 승리' : '하이로우 패배';
            } else if (game.type === 'blackjack') {
                setBjHand({ dealer: Math.floor(Math.random() * 5) + 17, player: isWin ? 21 : Math.floor(Math.random() * 15) + 2 });
                resultLog = isWin ? '블랙잭 승리' : '블랙잭 패배';
            }
            
            profitAmount = isWin ? currentBet : -currentBet; 
        }

        // DB 저장
        const { data } = await supabase.rpc('play_game_transaction', {
            p_user_id: userId,
            p_game_type: game.type,
            p_bet_amount: currentBet,
            p_result_amount: profitAmount,
            p_is_win: isWin,
            p_description: resultLog
        });

        // 1.5초 후: 릴이 멈추고 결과가 화면에 보임
        setGameStatus('idle');

        if (data && data.success) {
            if (onCoinUpdate) onCoinUpdate();
            
            // [수정] 모달 띄우기 요청 (상위 컴포넌트로 전달)
            onGameEnd({
                title: isWin ? 'YOU WIN' : 'YOU LOSE',
                desc: resultLog,
                amount: profitAmount,
                isWin: isWin
            });
        }

    }, 1500);
  };

  return (
    <SectionCard className="flex flex-col h-full min-h-[320px] relative" noPadding>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d4af37]/10 flex justify-between items-center bg-black/20">
            <div>
                <h3 className="text-[#f9eabb] font-['Cinzel'] font-bold text-lg flex items-center gap-2">
                    {displayGameName}
                    {game.type === 'roulette' && <span className="px-2 py-0.5 bg-red-900/40 text-red-400 text-[9px] border border-red-900/60 rounded animate-pulse">LIVE</span>}
                </h3>
                <p className="text-[#d4af37]/50 text-[10px] uppercase tracking-widest">{game.description}</p>
            </div>
            {game.type !== 'roulette' && (
                <div className="flex items-center gap-2 bg-[#05140e] border border-[#d4af37]/20 px-3 py-1 rounded-sm">
                    <span className="text-[10px] text-gray-500 uppercase">Bet</span>
                    <input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(e.target.value)} 
                        disabled={gameStatus === 'playing'}
                        className="w-16 bg-transparent text-right font-mono text-[#d4af37] text-sm focus:outline-none"
                    />
                </div>
            )}
        </div>

        {/* Game Stage */}
        <div className="flex-1 relative bg-gradient-to-b from-[#020f0a] to-[#0a2f1c]/30 flex items-center justify-center p-6 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>
            
            <div className="relative z-10 w-full flex flex-col items-center">
                {/* SLOT UI */}
                {game.type === 'slot' && (
                    <div className="flex gap-2 mb-4">
                        {slotResult.map((val, i) => (
                            <div key={i} className="w-16 h-24 bg-gradient-to-b from-[#111] to-[#222] border-2 border-[#d4af37] rounded-md flex items-center justify-center text-3xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                {gameStatus === 'playing' ? (
                                    // [수정] 롤백된 심볼 애니메이션
                                    <div className="flex flex-col animate-slot-spin opacity-60 filter blur-[1px]">
                                        <span className="py-2">7</span>
                                        <span className="py-2">🍒</span>
                                        <span className="py-2">BAR</span>
                                        <span className="py-2">7</span>
                                    </div>
                                ) : (
                                    // 멈췄을 때: 결과값 표시 (색상 및 효과 유지)
                                    <span className={`font-bold drop-shadow-md transform transition-all duration-300 ${
                                        val === '7' ? 'text-red-500 scale-110 drop-shadow-[0_0_5px_red]' : 
                                        val === 'BAR' ? 'text-blue-400' : 'text-pink-400'
                                    }`}>
                                        {val}
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                )}
                {/* HIGH LOW UI */}
                {game.type === 'highlow' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-36 bg-white rounded-lg border-4 border-white shadow-2xl flex items-center justify-center relative overflow-hidden">
                            <span className="text-4xl font-bold text-black font-serif">{gameStatus === 'playing' ? '...' : cardValue}</span>
                        </div>
                        <div className="flex gap-4">
                             <button className="flex items-center gap-1 px-3 py-1 bg-red-900/40 border border-red-500/30 text-red-200 text-xs hover:bg-red-900/60"><ArrowDown size={12}/> LOW</button>
                             <button className="flex items-center gap-1 px-3 py-1 bg-green-900/40 border border-green-500/30 text-green-200 text-xs hover:bg-green-900/60">HIGH <ArrowUp size={12}/></button>
                        </div>
                    </div>
                )}
                {/* ROULETTE UI */}
                {game.type === 'roulette' && (
                    <div className="relative w-32 h-32 rounded-full border-4 border-[#d4af37]/30 flex items-center justify-center bg-black shadow-2xl group cursor-pointer hover:border-[#d4af37] transition-all" onClick={onEnterRoulette}>
                        <div className="absolute inset-0 border-t-4 border-[#d4af37] rounded-full animate-spin duration-[8s]"></div>
                        <div className="text-center group-hover:scale-110 transition-transform">
                            <Disc size={32} className="text-[#d4af37] mx-auto mb-1" />
                            <span className="text-[10px] uppercase font-bold text-[#f9eabb]">Enter Room</span>
                        </div>
                    </div>
                )}
                {/* BLACKJACK UI */}
                {game.type === 'blackjack' && (
                    <div className="w-full max-w-xs space-y-4">
                        <div className="flex justify-center gap-2">
                             <div className="w-12 h-16 bg-white text-black font-bold flex items-center justify-center rounded">{gameStatus === 'playing' ? '?' : 'K'}</div>
                        </div>
                        <div className="flex justify-center gap-2 pt-4">
                             <div className="w-12 h-16 bg-white text-black font-bold flex items-center justify-center rounded border-2 border-[#d4af37]">J</div>
                             <div className="w-12 h-16 bg-white text-black font-bold flex items-center justify-center rounded border-2 border-[#d4af37]">{gameStatus === 'playing' ? '?' : '7'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-[#05140e] border-t border-[#d4af37]/10 flex justify-center">
            <button 
                onClick={handlePlay}
                disabled={gameStatus === 'playing'}
                className={`w-full font-bold py-3 uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${game.type === 'roulette' ? 'bg-red-900/80 text-white hover:bg-red-800' : 'bg-[#d4af37] text-black hover:bg-[#f9eabb]'}`}
            >
                {game.type === 'roulette' ? (
                    <><LogIn size={16}/> ENTER MULTIPLAYER</>
                ) : gameStatus === 'playing' ? (
                    <><RotateCw className="animate-spin" size={16}/> Processing</>
                ) : (
                    <><PlayCircle size={16}/> {game.type === 'slot' ? 'SPIN' : 'DEAL'}</>
                )}
            </button>
        </div>
        
        <style>{`
            @keyframes slot-spin {
                0% { transform: translateY(0); }
                100% { transform: translateY(-50%); }
            }
            .animate-slot-spin {
                animation: slot-spin 0.2s linear infinite;
            }
        `}</style>
    </SectionCard>
  );
};