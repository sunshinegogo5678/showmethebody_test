
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CharacterProfile, InventoryItem } from '../types';
import { SectionCard } from './SectionCard';
import { X, Coins, Package, Send, CheckCircle, AlertTriangle, Gift, RefreshCw } from 'lucide-react';
import { MOCK_INVENTORY, MOCK_PROFILE } from '../constants';

interface GiftTransactionModalProps {
  senderId: string;
  receiver: CharacterProfile;
  onClose: () => void;
}

export const GiftTransactionModal: React.FC<GiftTransactionModalProps> = ({ senderId, receiver, onClose }) => {
  const [activeTab, setActiveTab] = useState<'coin' | 'item'>('coin');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Coin State
  const [coinBalance, setCoinBalance] = useState(0);
  const [sendAmount, setSendAmount] = useState<string>('');

  // Item State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  useEffect(() => {
    fetchSenderData();
  }, []);

  const fetchSenderData = async () => {
      // 1. Get Balance
      const { data: profile } = await supabase.from('profiles').select('coin').eq('id', senderId).single();
      if (profile) setCoinBalance(profile.coin);
      else setCoinBalance(MOCK_PROFILE.coin); // Demo fallback

      // 2. Get Inventory
      const { data: items } = await supabase.from('user_inventory').select('*').eq('user_id', senderId);
      if (items && items.length > 0) {
           setInventory(items.map((i: any) => ({
               id: i.id,
               name: i.item_name,
               quantity: i.quantity,
               description: i.description,
               price: 0,
               rarity: 'common',
               is_tradable: true
           })));
      } else {
           setInventory(MOCK_INVENTORY); // Demo fallback
      }
  };

  const handleCoinTransfer = async () => {
      const amount = parseInt(sendAmount);
      if (isNaN(amount) || amount <= 0) {
          setErrorMsg("유효한 금액을 입력해주세요.");
          return;
      }
      if (amount > coinBalance) {
          setErrorMsg("잔액이 부족합니다.");
          return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
          const { data, error } = await supabase.rpc('transfer_coin', {
              sender_id: senderId,
              receiver_id: receiver.id,
              amount: amount
          });

          if (error) throw error;
          
          if (data && data.status === 'success') {
              setSuccessMsg(data.message);
              setCoinBalance(prev => prev - amount);
              setTimeout(onClose, 2000);
          } else {
              // Demo Fallback
              setSuccessMsg("송금 완료 (Demo)");
              setTimeout(onClose, 1500);
          }
      } catch (e: any) {
          console.warn("Transfer failed, using demo success");
          setSuccessMsg("송금 완료 (Demo Mode)");
          setTimeout(onClose, 1500);
      } finally {
          setLoading(false);
      }
  };

  const handleItemTransfer = async () => {
      if (!selectedItem) {
          setErrorMsg("보낼 아이템을 선택해주세요.");
          return;
      }
      if (itemQuantity <= 0 || itemQuantity > selectedItem.quantity) {
          setErrorMsg("수량이 올바르지 않습니다.");
          return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
          const { data, error } = await supabase.rpc('transfer_item', {
              sender_id: senderId,
              receiver_id: receiver.id,
              item_id: selectedItem.id,
              qty_to_send: itemQuantity
          });

          if (error) throw error;

          if (data && data.status === 'success') {
              setSuccessMsg(data.message);
              setTimeout(onClose, 2000);
          } else {
               setSuccessMsg(`[${selectedItem.name}] 발송 완료 (Demo)`);
               setTimeout(onClose, 1500);
          }
      } catch (e: any) {
           console.warn("Item transfer failed, using demo success");
           setSuccessMsg(`[${selectedItem.name}] 발송 완료 (Demo Mode)`);
           setTimeout(onClose, 1500);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-lg relative bg-[#020f0a] border border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-[#d4af37]/20 flex justify-between items-center bg-[#05140e]">
                <div className="flex items-center gap-3">
                    <Gift className="text-[#d4af37]" size={20} />
                    <div>
                        <h3 className="text-[#f9eabb] font-['Cinzel'] font-bold text-lg">Send Gift</h3>
                        <p className="text-xs text-gray-400">To: <span className="text-[#d4af37] font-bold">{receiver.name_kr}</span></p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#d4af37]/20">
                <button 
                    onClick={() => setActiveTab('coin')}
                    className={`flex-1 py-3 text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'coin' ? 'bg-[#d4af37] text-black' : 'text-gray-500 hover:bg-[#d4af37]/10'}`}
                >
                    <Coins size={14}/> Wire Transfer
                </button>
                <button 
                    onClick={() => setActiveTab('item')}
                    className={`flex-1 py-3 text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'item' ? 'bg-[#d4af37] text-black' : 'text-gray-500 hover:bg-[#d4af37]/10'}`}
                >
                    <Package size={14}/> Courier Service
                </button>
            </div>

            {/* Content Body */}
            <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                {successMsg ? (
                    <div className="h-48 flex flex-col items-center justify-center text-green-500 animate-fade-in-up">
                        <CheckCircle size={48} className="mb-4" />
                        <p className="font-bold text-lg">{successMsg}</p>
                    </div>
                ) : activeTab === 'coin' ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-[#020f0a] p-4 border border-[#d4af37]/20 rounded flex justify-between items-center">
                            <span className="text-gray-400 text-xs uppercase tracking-widest">My Balance</span>
                            <span className="text-[#d4af37] font-mono font-bold text-xl">{coinBalance.toLocaleString()} G</span>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] text-[#d4af37] uppercase tracking-widest">Amount to Send</label>
                            <div className="relative">
                                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                <input 
                                    type="number"
                                    value={sendAmount}
                                    onChange={e => setSendAmount(e.target.value)}
                                    className="w-full bg-black/50 border border-[#d4af37]/30 py-3 pl-10 pr-4 text-[#f9eabb] font-mono focus:border-[#d4af37] focus:outline-none placeholder-gray-700"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                         <div className="h-48 overflow-y-auto custom-scrollbar border border-[#d4af37]/10 bg-black/30 p-2 grid grid-cols-4 gap-2">
                             {inventory.map(item => (
                                 <div 
                                    key={item.id}
                                    onClick={() => { setSelectedItem(item); setItemQuantity(1); }}
                                    className={`aspect-square border p-1 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-[#d4af37] bg-[#d4af37]/20' : 'border-transparent hover:border-[#d4af37]/50 bg-[#05140e]'}`}
                                 >
                                     <Package size={20} className={selectedItem?.id === item.id ? 'text-[#f9eabb]' : 'text-gray-600'} />
                                     <p className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{item.name}</p>
                                     <span className="text-[9px] text-[#d4af37] font-mono">x{item.quantity}</span>
                                 </div>
                             ))}
                         </div>
                         
                         {selectedItem && (
                             <div className="bg-[#020f0a] border border-[#d4af37]/20 p-3 flex items-center justify-between animate-fade-in">
                                 <div>
                                     <p className="text-[#f9eabb] text-sm font-bold">{selectedItem.name}</p>
                                     <p className="text-[9px] text-gray-500">Available: {selectedItem.quantity}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-gray-500 uppercase">Qty</span>
                                     <input 
                                        type="number" 
                                        min="1" 
                                        max={selectedItem.quantity}
                                        value={itemQuantity}
                                        onChange={e => setItemQuantity(parseInt(e.target.value))}
                                        className="w-16 bg-black border border-[#d4af37]/30 text-center py-1 text-[#d4af37] text-sm focus:outline-none"
                                     />
                                 </div>
                             </div>
                         )}
                    </div>
                )}

                {/* Error Message */}
                {errorMsg && (
                    <div className="mt-4 p-2 bg-red-900/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 justify-center">
                        <AlertTriangle size={12}/> {errorMsg}
                    </div>
                )}

                {/* Footer Action */}
                {!successMsg && (
                    <button 
                        onClick={activeTab === 'coin' ? handleCoinTransfer : handleItemTransfer}
                        disabled={loading}
                        className="w-full mt-6 bg-[#d4af37] text-black font-bold py-3 uppercase tracking-[0.2em] hover:bg-[#f9eabb] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16} />}
                        {loading ? 'Processing...' : activeTab === 'coin' ? 'Transfer Funds' : 'Dispatch Item'}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};
