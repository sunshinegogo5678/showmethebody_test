import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { InventoryItem } from '../types';
import { SectionCard } from './SectionCard';
import { MOCK_INVENTORY, MOCK_RECIPES } from '../constants';
import { Beaker, Sparkles, X, Hammer, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

type Tab = 'craft' | 'book';

export const CraftingRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('craft');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [slots, setSlots] = useState<(string | null)>([null, null, null]);
  const [isCrafting, setIsCrafting] = useState(false);
  const [craftResult, setCraftResult] = useState<{status: string, item: string, message: string} | null>(null);
  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>([]);

  useEffect(() => {
    fetchInventory();
    fetchUnlockedRecipes();
  }, [craftResult]); 

  const fetchInventory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
          .from('inventory')
          .select('*, item:items(*)')
          .eq('user_id', user.id);

      if (data && data.length > 0) {
          const formattedInventory = data
              .map((row: any) => ({
                  id: row.item_id,
                  name: row.item.name,
                  quantity: row.quantity,
                  description: row.item.description || '재료 아이템',
                  price: 0,
                  rarity: 'common',
                  is_tradable: true,
                  type: row.item.type, 
                  image_url: row.item.image_url
              }))
              .filter((item: any) => item.type !== 'part'); 

          setInventory(formattedInventory);
      } else {
          setInventory(MOCK_INVENTORY);
      }
  };

  const fetchUnlockedRecipes = async () => {
      const { data } = await supabase.from('user_recipes').select('recipe_id');
      if (data) {
          setUnlockedRecipes(data.map(r => r.recipe_id));
      } else {
          setUnlockedRecipes(['r1']);
      }
  };

  const handleItemClick = (itemName: string) => {
      if (activeTab !== 'craft') return;
      const emptyIndex = slots.findIndex(s => s === null);
      if (emptyIndex !== -1) {
          const newSlots = [...slots];
          newSlots[emptyIndex] = itemName;
          setSlots(newSlots);
      }
  };

  const handleSlotClear = (index: number) => {
      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
  };

  const handleSynthesize = async () => {
      if (slots.some(s => s === null)) {
          alert("3개의 슬롯을 모두 채워야 합니다.");
          return;
      }

      setIsCrafting(true);
      const ingredients = slots as string[];
      
      // 유저 정보 미리 가져오기 (로그 저장용)
      const { data: { user } } = await supabase.auth.getUser();

      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
          const { data, error } = await supabase.rpc('craft_item', {
              ingredients_input: ingredients
          });

          if (error) throw error;
          if (!data) throw new Error("No data returned from crafting RPC");

          setCraftResult({
              status: data.status,
              item: data.item,
              message: data.message
          });

          // [NEW] 성공 로그 저장 (RPC 성공 시)
          if (user && data.status !== 'fail') {
              await supabase.from('activity_logs').insert([{
                  user_id: user.id,
                  type: 'CRAFT',
                  description: `아이템 조합 성공: ${data.item} (결과: ${data.status})`,
                  amount: 0,
                  created_at: new Date().toISOString()
              }]);
          }
          
      } catch (e: any) {
          console.warn("Crafting RPC failed (using demo fallback):", e.message);
          
          // Demo Fallback Logic
          const matchedRecipe = MOCK_RECIPES.find(r => 
              r.ingredients.length === ingredients.length &&
              r.ingredients.every(i => ingredients.includes(i))
          );

          if (matchedRecipe) {
              const roll = Math.random() * 100;
              const isCrit = matchedRecipe.critical_item_name && Math.random() * 100 < (matchedRecipe.critical_rate || 0);
              
              if (roll < matchedRecipe.success_rate) {
                  const resultItemName = isCrit ? matchedRecipe.critical_item_name! : matchedRecipe.result_item_name;
                  setCraftResult({
                      status: isCrit ? 'critical' : 'success',
                      item: resultItemName,
                      message: isCrit ? "대성공! 전설적인 아이템을 발견했습니다!" : "조합 성공! 새로운 아이템을 획득했습니다."
                  });
                  
                  if(!unlockedRecipes.includes(matchedRecipe.id)) {
                      setUnlockedRecipes(prev => [...prev, matchedRecipe.id]);
                  }

                  // [NEW] 성공 로그 저장 (Fallback 성공 시)
                  if (user) {
                      await supabase.from('activity_logs').insert([{
                          user_id: user.id,
                          type: 'CRAFT',
                          description: `아이템 조합 성공(Demo): ${resultItemName}`,
                          amount: 0,
                          created_at: new Date().toISOString()
                      }]);
                  }

              } else {
                   setCraftResult({
                      status: 'fail',
                      item: matchedRecipe.fail_item_name,
                      message: "조합 실패... 재료가 한 줌의 재로 변했습니다."
                  });
                  // 실패 로그도 남기고 싶다면 여기에 추가 가능
              }
          } else {
              setCraftResult({
                  status: 'fail',
                  item: "정체불명의 찌꺼기",
                  message: "잘못된 조합입니다. 아무런 반응이 없습니다."
              });
          }
      } finally {
          setIsCrafting(false);
          setSlots([null, null, null]);
      }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col max-w-6xl mx-auto p-4 gap-6">
        <div className="flex justify-center gap-4 mb-2">
            <button onClick={() => setActiveTab('craft')} className={`px-6 py-2 uppercase tracking-widest text-xs font-bold border transition-all ${activeTab === 'craft' ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-transparent text-gray-500 border-transparent hover:text-[#d4af37]'}`}>아이템 조합 (Synthesis)</button>
            <button onClick={() => setActiveTab('book')} className={`px-6 py-2 uppercase tracking-widest text-xs font-bold border transition-all ${activeTab === 'book' ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-transparent text-gray-500 border-transparent hover:text-[#d4af37]'}`}>레시피 도감 (Recipe Book)</button>
        </div>

        {activeTab === 'craft' ? (
            <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                <div className="md:w-1/3 h-full">
                    <SectionCard title="비밀 금고 (Material)" className="h-full" noPadding>
                        <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-2">
                                {inventory.map((item: any) => (
                                    <div key={item.id} onClick={() => handleItemClick(item.name)} className="flex justify-between items-center p-3 bg-[#020f0a] border border-[#d4af37]/20 hover:border-[#d4af37] cursor-pointer group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#05140e] flex items-center justify-center border border-[#d4af37]/10 group-hover:bg-[#d4af37]/10 overflow-hidden">
                                                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100"/> : <Beaker size={14} className="text-gray-500 group-hover:text-[#d4af37]"/>}
                                            </div>
                                            <div><p className="text-[#f9eabb] text-sm font-serif">{item.name}</p><p className="text-[10px] text-gray-500">{item.description}</p></div>
                                        </div>
                                        <span className="text-[#d4af37] font-mono text-xs">x{item.quantity}</span>
                                    </div>
                                ))}
                                {inventory.length === 0 && <div className="text-center py-8 text-gray-600 text-xs italic">합성 가능한 아이템이 없습니다.</div>}
                            </div>
                        </div>
                    </SectionCard>
                </div>
                <div className="md:w-2/3 flex flex-col gap-6">
                    <SectionCard className="flex-1 flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20 pointer-events-none"></div>
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-10">
                            <h2 className="text-2xl font-['Cinzel'] text-[#d4af37] mb-12 flex items-center gap-2"><Sparkles size={24}/> SYNTHESIS LAB</h2>
                            <div className={`flex gap-4 md:gap-8 mb-12 transition-all ${isCrafting ? 'animate-shake blur-sm opacity-80' : ''}`}>
                                {slots.map((slotItem, idx) => (
                                    <div key={idx} className="relative">
                                        <div onClick={() => !isCrafting && handleSlotClear(idx)} className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 ${slotItem ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-[#d4af37]/20 border-dashed bg-black/40'} flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/5 transition-all relative group overflow-hidden`}>
                                            {slotItem ? (<div className="text-center animate-fade-in-up"><Beaker size={32} className="mx-auto mb-2 text-[#d4af37]" /><span className="text-xs text-[#f9eabb] font-bold px-2 truncate max-w-[90px] block">{slotItem}</span></div>) : (<span className="text-[#d4af37]/30 text-xs uppercase tracking-widest font-bold">SLOT {idx + 1}</span>)}
                                            {slotItem && !isCrafting && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={24} className="text-white"/></div>}
                                        </div>
                                        {idx < 2 && <div className="absolute top-1/2 -right-6 md:-right-10 w-4 md:w-8 h-1 bg-[#d4af37]/20"></div>}
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleSynthesize} disabled={isCrafting || slots.some(s => s === null)} className="group relative px-12 py-4 bg-[#05140e] border border-[#d4af37] text-[#d4af37] font-bold uppercase tracking-[0.2em] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:text-black transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <span className="relative z-10 flex items-center gap-3">{isCrafting ? <RefreshCw className="animate-spin"/> : <Hammer size={20} />} {isCrafting ? '조합 진행 중...' : '합성 개시 (SYNTHESIZE)'}</span>
                                <div className="absolute inset-0 bg-[#d4af37] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 origin-left"></div>
                            </button>
                            <p className="mt-6 text-[#d4af37]/50 text-xs text-center max-w-md">주의: 실패 시 재료는 영구 소실되며, 산업 폐기물만 남게 됩니다.</p>
                        </div>
                    </SectionCard>
                </div>
            </div>
        ) : (
            <div className="h-[600px]">
                <SectionCard title="발견된 레시피 (Known Formulas)" className="h-full" noPadding>
                    <div className="p-6 h-full overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MOCK_RECIPES.map(recipe => {
                            const isUnlocked = unlockedRecipes.includes(recipe.id);
                            return (
                                <div key={recipe.id} className={`p-4 border ${isUnlocked ? 'border-[#d4af37]/40 bg-[#05140e]' : 'border-gray-800 bg-black/60'} rounded relative overflow-hidden group`}>
                                    {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[2px]"><div className="text-center"><Lock size={24} className="mx-auto text-gray-600 mb-2"/><p className="text-gray-600 text-xs uppercase tracking-widest font-bold">미발견 레시피</p></div></div>}
                                    <div className={!isUnlocked ? 'opacity-20 blur-sm' : ''}>
                                        <div className="flex justify-between items-start mb-3"><h4 className="text-[#f9eabb] font-bold font-serif">{recipe.result_item_name}</h4><span className="text-[10px] text-[#d4af37] border border-[#d4af37]/30 px-1.5 py-0.5 rounded">{recipe.success_rate}% 성공률</span></div>
                                        <div className="text-xs text-gray-400 space-y-1 mb-4"><p className="uppercase text-[#d4af37]/60 text-[9px]">필요 재료:</p><ul className="list-disc list-inside">{recipe.ingredients.map((ing, i) => (<li key={i}>{ing}</li>))}</ul></div>
                                        {recipe.critical_item_name && <div className="mt-2 pt-2 border-t border-[#d4af37]/10"><p className="text-[9px] uppercase text-purple-400 font-bold mb-1 flex items-center gap-1"><Sparkles size={10}/> 대성공 가능</p><p className="text-xs text-purple-200">{recipe.critical_item_name}</p></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>
            </div>
        )}

      {craftResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#020f0a] border border-[#d4af37] w-full max-w-md p-8 text-center relative shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                  <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${craftResult.status === 'critical' ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_30px_#a855f7]' : craftResult.status === 'success' ? 'border-[#d4af37] bg-[#d4af37]/20' : 'border-red-900 bg-red-900/20'}`}>
                      {craftResult.status === 'critical' ? <Sparkles size={48} className="text-purple-400 animate-pulse" /> : craftResult.status === 'success' ? <Sparkles size={48} className="text-[#d4af37]" /> : <AlertTriangle size={48} className="text-red-500" />}
                  </div>
                  <h3 className={`text-2xl font-['Cinzel'] mb-2 ${craftResult.status === 'critical' ? 'text-purple-400' : craftResult.status === 'success' ? 'text-[#f9eabb]' : 'text-red-500'}`}>{craftResult.message}</h3>
                  <div className="my-6 p-4 bg-black/40 border border-[#d4af37]/20 rounded"><p className="text-gray-500 text-xs uppercase tracking-widest mb-1">획득 아이템</p><span className={`text-xl font-bold block ${craftResult.status === 'critical' ? 'text-purple-300' : 'text-[#d4af37]'}`}>{craftResult.item}</span></div>
                  <button onClick={() => setCraftResult(null)} className="px-8 py-2 bg-[#d4af37] text-black font-bold uppercase tracking-widest hover:bg-[#f9eabb]">확인</button>
              </div>
          </div>
      )}
      <style>{`@keyframes shake {0% {transform:translate(1px,1px) rotate(0deg);}10% {transform:translate(-1px,-2px) rotate(-1deg);}20% {transform:translate(-3px,0px) rotate(1deg);}30% {transform:translate(3px,2px) rotate(0deg);}40% {transform:translate(1px,-1px) rotate(1deg);}50% {transform:translate(-1px,2px) rotate(-1deg);}60% {transform:translate(-3px,1px) rotate(0deg);}70% {transform:translate(3px,1px) rotate(-1deg);}80% {transform:translate(-1px,-1px) rotate(1deg);}90% {transform:translate(1px,2px) rotate(0deg);}100% {transform:translate(1px,-2px) rotate(-1deg);}}.animate-shake {animation:shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite;}`}</style>
    </div>
  );
};