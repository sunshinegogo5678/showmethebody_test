import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { ProfileSection } from './ProfileSection';
import { GameTable } from './GameTable';
import { Inventory } from './Inventory';
import { ActivityLog } from './ActivityLog';
// [삭제] DailyAttendance import 제거
import { RadioNote } from './RadioNote';
import { Spade, Club, Diamond, Heart, Edit, Skull, Package } from 'lucide-react';
import { CharacterProfile } from '../types';

interface MyPageProps {
    profile: CharacterProfile;
    onEdit: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({ profile, onEdit }) => {
  const [partsInventory, setPartsInventory] = useState<any[]>([]);
  const [itemInventory, setItemInventory] = useState<any[]>([]);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;
      
      try {
        setLoading(true);

        // 1. 인벤토리 가져오기 및 분류
        const { data: invData } = await supabase
          .from('inventory')
          .select(`*, item:items (*)`) 
          .eq('user_id', profile.id);

        if (invData) {
          const parts: any[] = [];
          const items: any[] = [];

          invData.forEach((row: any) => {
            const formattedItem = {
                id: row.item_id,
                name: row.item.name,
                count: row.quantity,
                desc: row.item.description,
                icon: row.item.image_url || '📦',
                type: row.item.type 
            };

            if (row.item.type === 'part') {
                parts.push(formattedItem);
            } else {
                items.push(formattedItem);
            }
          });

          setPartsInventory(parts);
          setItemInventory(items);
        }

        // 2. 활동 로그 가져오기
        const { data: logData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (logData) {
            const formattedLogs = logData.map((log: any) => ({
                id: log.id,
                category: log.type,
                content: log.description,
                created_at: log.created_at,
                amount: log.amount,
                balance_after: log.balance_after
            }));
            setLogs(formattedLogs);
        }

        // 3. 게임 전적 가져오기
        const { data: recordData } = await supabase
            .from('game_records')
            .select('*')
            .eq('user_id', profile.id);
            
        if (recordData) {
            const statsMap: Record<string, any> = {};
            recordData.forEach((record: any) => {
                const gameType = record.game_type;
                if (!statsMap[gameType]) {
                    statsMap[gameType] = {
                        id: gameType,
                        game_type: gameType.toUpperCase(),
                        play_count: 0,
                        win_count: 0,
                        profit_total: 0
                    };
                }
                statsMap[gameType].play_count += 1;
                if (record.is_win) statsMap[gameType].win_count += 1;
                statsMap[gameType].profit_total += record.result_amount;
            });
            setGameStats(Object.values(statsMap));
        }

      } catch (error) {
        console.error("데이터 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile.id, profile.coin]);

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="text-center relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent -z-10"></div>
          <div className="inline-block bg-[#020f0a] px-10 relative border-x border-[#d4af37]/10 group">
             <div className="flex items-center justify-center gap-4 mb-3 text-[#d4af37]/50">
                <Spade size={12} fill="currentColor" />
                <Heart size={12} fill="currentColor" />
                <Club size={12} fill="currentColor" />
                <Diamond size={12} fill="currentColor" />
             </div>
             <h1 className="text-4xl md:text-5xl font-['Cinzel'] font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#f9eabb] via-[#d4af37] to-[#b4941f] drop-shadow-md tracking-wider">
                {profile.name_kr}
             </h1>
             <p className="text-[#d4af37]/60 font-serif tracking-[0.4em] uppercase text-[10px] mt-3">
                {profile.name_en}
             </p>
             <button onClick={onEdit} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#d4af37] transition-colors opacity-0 group-hover:opacity-100">
                 <Edit size={16} />
             </button>
          </div>
        </header>

        {/* Quote */}
        <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
                <div className="absolute inset-0 bg-[#d4af37]/5 blur-xl rounded-full"></div>
                <div className="relative bg-[#05140e]/40 backdrop-blur-sm border-t border-b border-[#d4af37]/20 px-8 py-5 text-center">
                    <p className="font-['Playfair_Display'] italic text-lg text-[#e0e0e0] font-light leading-relaxed">
                        "{profile.quote || 'No quote set.'}"
                    </p>
                </div>
            </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Profile */}
            <div className="lg:col-span-4 h-full flex flex-col gap-6">
                <ProfileSection profile={profile} />
            </div>

            {/* Right Col: Content */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                {/* [삭제됨] DailyAttendance 영역 삭제 */}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
                     {/* 왼쪽 열: Parts + Game Records */}
                     <div className="md:col-span-1 flex flex-col gap-6">
                        <div className="flex-none">
                            <Inventory 
                                title="Parts of Body" 
                                items={partsInventory} 
                                icon={<Skull size={16}/>} 
                                className="min-h-[200px]"
                            />
                        </div>
                        <div className="flex-1">
                            <GameTable stats={gameStats.length > 0 ? gameStats : []} />
                        </div>
                     </div>

                     {/* 오른쪽 열: General Inventory */}
                     <div className="md:col-span-1 h-full">
                        <Inventory 
                            title="Gift Inventory" 
                            items={itemInventory}
                            icon={<Package size={16}/>}
                        />
                     </div>
                </div>
            </div>
        </div>

        {/* Bottom: Radio & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 order-2 lg:order-1 h-full">
                <RadioNote messages={
                    (profile as any).radio_message ? [(profile as any).radio_message] : []
                } />
            </div>
            <div className="lg:col-span-3 order-1 lg:order-2 h-full">
                <ActivityLog logs={logs} />
            </div>
        </div>
    </div>
  );
};