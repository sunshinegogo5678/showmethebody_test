import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ExplorationNode } from '../types';
import { SectionCard } from './SectionCard';
import { MapPin, Search, Clock, AlertCircle, ImageIcon, Loader2 } from 'lucide-react';

interface InvestigationMapProps {
    onActionComplete: () => void;
}

// --- Helper Functions for Log Persistence ---
const getTodayDate = () => {
    return new Date().toISOString().slice(0, 10);
};

const LOG_STORAGE_KEY = 'investigation_log';

export const InvestigationMap: React.FC<InvestigationMapProps> = ({ onActionComplete }) => {
  const [nodes, setNodes] = useState<ExplorationNode[]>([]);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false); 
  
  const [remainingActions, setRemainingActions] = useState(5); 
  const [investigating, setInvestigating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  
  useEffect(() => {
    const storedData = localStorage.getItem(LOG_STORAGE_KEY);
    const today = getTodayDate();
    
    if (storedData) {
        try {
            const data = JSON.parse(storedData);
            if (data.date === today) {
                setLog(data.logs);
            } else {
                setLog([]);
            }
        } catch (e) {
            console.error("Failed to parse stored log:", e);
            setLog([]);
        }
    }
  }, []);

  useEffect(() => {
    const today = getTodayDate();
    const dataToStore = JSON.stringify({
        date: today,
        logs: log,
    });
    localStorage.setItem(LOG_STORAGE_KEY, dataToStore);
  }, [log]);

  const fetchInitialData = async () => {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (user) {
          const { data: profileData } = await supabase.from('profiles').select('action_points').eq('id', user.user.id).single();
          if (profileData && profileData.action_points !== undefined) {
              setRemainingActions(profileData.action_points);
          }
      }
      fetchMapConfig();
      fetchNodes();
      setLoading(false);
  };
  
  useEffect(() => {
      fetchInitialData();

      const channel = supabase.channel('public:investigation_updates')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'exploration_nodes' }, () => {
              fetchNodes();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings', filter: "key=eq.global_map_url" }, (payload) => {
               if (payload.new && 'value' in payload.new) {
                   setMapUrl(payload.new.value as string);
                   setImageError(false); 
               }
          })
          .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMapConfig = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'global_map_url').single();
        if (data) setMapUrl(data.value);
      } catch (e) {
          console.warn("Could not fetch map config or key is missing.");
      }
  };

  const fetchNodes = async () => {
      const { data } = await supabase.from('exploration_nodes').select('*');
      if (data) {
          setNodes(data);
      }
  };

  const handleInvestigate = async (node: ExplorationNode) => {
      if (remainingActions < node.daily_limit_cost) {
          alert(`Insufficient AP. Required: ${node.daily_limit_cost}`);
          return;
      }

      setInvestigating(true);
      
      try {
          const { data, error } = await supabase.rpc('investigate_node', { p_node_id: node.id });
          
          if (error) throw error;

          if (data && data.success) {
              setRemainingActions(data.ap_remaining); 
              addLog(`[${node.name}]: ${data.message}`);
              onActionComplete(); 
          } else if (data && !data.success) {
              addLog(`[${node.name}]: Investigation failed! ${data.message}`);
          }
          
      } catch (e: any) {
          console.warn("Investigation RPC failed, trying simulation.", e.message);
          await simulateClientSideInvestigation(node);
      } finally {
          setInvestigating(false);
      }
  };

  const simulateClientSideInvestigation = async (node: ExplorationNode) => {
      const { data: outcomes } = await supabase.from('exploration_outcomes').select('*').eq('node_id', node.id);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!outcomes || outcomes.length === 0) {
          addLog(`[${node.name}]: You searched thoroughly but found nothing.`);
      } else {
          const totalWeight = outcomes.reduce((sum, item) => sum + item.probability, 0);
          let random = Math.floor(Math.random() * totalWeight);
          const selected = outcomes.find(item => {
              random -= item.probability;
              return random < 0;
          }) || outcomes[0];

          addLog(`[${node.name}]: ${selected.script_text}`);
      }
      setRemainingActions(prev => Math.max(0, prev - node.daily_limit_cost));
      onActionComplete();
  };

  const addLog = (msg: string) => {
      setLog(prev => [`[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`, ...prev]);
  };

  if (loading && nodes.length === 0) {
      return (
          <div className="h-full flex items-center justify-center text-[#d4af37]">
              <Loader2 className="animate-spin" size={32}/>
          </div>
      );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col gap-6 w-full p-4">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[#05140e] border border-[#d4af37]/20 p-4 rounded gap-4 shrink-0">
            <div className="flex items-center gap-4">
                <Search size={24} className="text-[#d4af37]" />
                <div>
                    <h2 className="text-[#f9eabb] font-['Cinzel'] text-lg">FIELD INVESTIGATION</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Select a sector to search for clues</p>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border border-[#d4af37]/30 bg-black/40 rounded">
                <Clock size={16} className={remainingActions === 0 ? "text-red-500" : "text-[#d4af37]"} />
                <span className="text-gray-300 text-sm font-mono">
                    ACTION POINTS: <span className={`font-bold ${remainingActions === 0 ? "text-red-500" : "text-[#d4af37]"}`}>{remainingActions}/5</span>
                </span>
            </div>
        </div>

        {/* 맵 컨테이너 */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
            {/* MAP AREA */}
            <SectionCard className="lg:w-3/4 relative overflow-hidden group p-0 border-[#d4af37]/30 flex-grow" noPadding>
                
                {/* [수정됨] 16:9 비율 강제 유지를 위한 컨테이너 구조 */}
                <div className="w-full h-full relative bg-[#020f0a] flex items-center justify-center overflow-hidden p-4"> 
                    
                    {mapUrl && !imageError ? (
                        /* 이 div가 핵심입니다. 항상 16:9 비율을 유지하며 부모 영역 안에 최대 크기로 맞춰집니다. */
                        <div className="relative aspect-[16/9] w-full max-w-full max-h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#d4af37]/10">
                            
                            {/* 1. 맵 이미지: 16:9 박스를 꽉 채웁니다 (object-cover) */}
                            <img 
                                src={mapUrl} 
                                alt="City Map" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                    setImageError(true);
                                    console.error("Map Image failed to load.", e);
                                }}
                            />
                            
                            {/* 2. 핀 레이어: 16:9 박스와 정확히 동일한 크기를 가집니다. */}
                            <div className="absolute inset-0">
                                <div id="pin-overlay" className="relative w-full h-full"> 
                                    
                                    {/* Vignette (Decoration) */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020f0a_100%)] pointer-events-none opacity-60"></div>
                                    
                                    {nodes.map(node => {
                                        // 핀 좌표는 이제 16:9 박스 기준 %이므로 절대 밀리지 않습니다.
                                        const x = parseFloat(node.x_pos.toString());
                                        const y = parseFloat(node.y_pos.toString());
                                        
                                        return (
                                            <button
                                                key={node.id}
                                                onClick={(e) => { e.stopPropagation(); handleInvestigate(node); }}
                                                disabled={investigating || remainingActions < node.daily_limit_cost}
                                                style={{ left: `${x}%`, top: `${y}%` }} 
                                                className="absolute transform -translate-x-1/2 -translate-y-1/2 group/pin focus:outline-none z-10 pointer-events-auto"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <MapPin 
                                                        size={32} 
                                                        className={`drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] transition-all duration-300 ${
                                                            remainingActions >= node.daily_limit_cost 
                                                            ? 'text-[#d4af37] group-hover/pin:text-[#f9eabb] group-hover/pin:-translate-y-2' 
                                                            : 'text-gray-600 cursor-not-allowed'
                                                        }`} 
                                                        fill={remainingActions >= node.daily_limit_cost ? "currentColor" : "none"}
                                                    />
                                                    <div className="absolute -bottom-1 w-3 h-1.5 bg-black/60 blur-[2px] rounded-[100%] group-hover/pin:scale-75 group-hover/pin:opacity-50 transition-all"></div>
                                                    {remainingActions >= node.daily_limit_cost && (
                                                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-20 animate-ping pointer-events-none"></span>
                                                    )}
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#020f0a]/90 backdrop-blur border border-[#d4af37]/50 p-3 rounded min-w-[150px] text-center opacity-0 group-hover/pin:opacity-100 transition-all duration-300 translate-y-2 group-hover/pin:translate-y-0 pointer-events-none shadow-xl z-20">
                                                    <p className="text-[#d4af37] text-xs font-bold uppercase font-['Cinzel'] border-b border-[#d4af37]/20 pb-1 mb-1">{node.name}</p>
                                                    <p className="text-[10px] text-gray-300 mb-2 italic">"{node.description || 'Unknown Sector'}"</p>
                                                    <div className="inline-block bg-[#d4af37]/20 px-2 py-0.5 rounded text-[9px] text-[#d4af37] font-bold">
                                                        COST: {node.daily_limit_cost} AP
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {investigating && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 backdrop-blur-sm animate-fade-in">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <Search size={48} className="text-[#d4af37] animate-pulse" />
                                            <div className="absolute inset-0 border-4 border-[#d4af37]/30 rounded-full animate-spin border-t-[#d4af37]"></div>
                                        </div>
                                        <p className="text-[#f9eabb] font-['Cinzel'] tracking-[0.2em] text-sm animate-pulse">INVESTIGATING AREA...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-[linear-gradient(rgba(212,175,55,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.1)_1px,transparent_1px)] bg-[size:40px_40px] flex flex-col items-center justify-center text-[#d4af37]/30">
                            <ImageIcon size={48} className="mb-2"/>
                            <p className="font-['Cinzel']">BLUEPRINT MODE</p>
                            {imageError && <p className="text-red-500 text-xs mt-2">IMAGE LOAD FAILED! Check URL.</p>}
                            {!mapUrl && !imageError && <p className="text-gray-500 text-xs mt-1">Map URL is empty in settings.</p>}
                            <div className="absolute inset-0 pointer-events-none border-[20px] border-[#05140e]/50"></div>
                        </div>
                    )}
                </div> 
            </SectionCard>

            {/* LOG AREA */}
            <SectionCard className="lg:w-1/4 h-full flex flex-col" title="Investigation Log" noPadding>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-black/40 font-mono text-xs space-y-3">
                    {log.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 italic gap-2 opacity-50">
                            <AlertCircle size={24}/>
                            <p>No recent activity.</p>
                            <p className="text-[10px]">Select a pin on the map.</p>
                        </div>
                    )}
                    {log.map((entry, i) => (
                        <div key={i} className="border-l-2 border-[#d4af37] pl-3 py-1 animate-fade-in text-gray-300 bg-gradient-to-r from-[#d4af37]/5 to-transparent">
                            {entry}
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    </div>
  );
};