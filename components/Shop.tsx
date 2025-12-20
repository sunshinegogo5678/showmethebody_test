import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SectionCard } from './SectionCard';
import { ShoppingBag, Coins, Skull, Gift, ArrowRightLeft, Package, RefreshCw, X, Plus, Minus, Check, AlertTriangle } from 'lucide-react';

interface ShopProps {
    shopType: 'part' | 'item';
}

export const Shop: React.FC<ShopProps> = ({ shopType }) => {
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [userCoin, setUserCoin] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // --- Transaction Modal State ---
  const [modalOpen, setModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);

  // --- Result Modal State ---
  const [resultModal, setResultModal] = useState<{
      open: boolean;
      success: boolean;
      title: string;
      message: string;
      subMessage?: string;
  }>({ open: false, success: true, title: '', message: '' });

  const shopConfig = {
      part: {
          title: "CYBERNETICS CLINIC",
          subtitle: "Upgrade Your Hardware",
          desc: "We buy and sell high-grade body parts.",
          icon: <Skull size={24} className="text-[#d4af37]" />
      },
      item: {
          title: "GENERAL STORE",
          subtitle: "Supplies & Gifts",
          desc: "Everything you need for survival and social.",
          icon: <Gift size={24} className="text-[#d4af37]" />
      }
  };

  useEffect(() => {
    fetchShopData();
  }, [shopType]); 

  const fetchShopData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
          const { data: profile } = await supabase.from('profiles').select('coin').eq('id', user.id).single();
          if (profile) setUserCoin(profile.coin);

          const { data: inventory } = await supabase
            .from('inventory')
            .select('*, item:items(*)')
            .eq('user_id', user.id);
            
          if (inventory) {
              const filteredMyItems = inventory
                .filter((row: any) => row.item.type === shopType)
                .map((row: any) => ({
                    ...row.item,
                    quantity: row.quantity
                }));
              setMyItems(filteredMyItems);
          }
      }

      const { data: items } = await supabase
          .from('items')
          .select('*')
          .eq('type', shopType)
          .gt('stock', 0)
          .order('price');
      
      if (items) setShopItems(items);
      setLoading(false);
  };

  const openModal = (type: 'buy' | 'sell', item: any) => {
      setTradeType(type);
      setSelectedItem(item);
      setQuantity(1);
      setModalOpen(true);
  };

  const closeModal = () => {
      setModalOpen(false);
      setSelectedItem(null);
      setQuantity(1);
  };

  const closeResultModal = () => {
      setResultModal({ ...resultModal, open: false });
  };

  const adjustQuantity = (delta: number) => {
      if (!selectedItem) return;
      let maxQty = 999;
      if (tradeType === 'buy') {
          const affordable = Math.floor(userCoin / selectedItem.price);
          const stock = selectedItem.stock === 999 ? 999 : selectedItem.stock;
          maxQty = Math.min(affordable, stock);
          if (maxQty === 0) maxQty = 1; 
      } else {
          maxQty = selectedItem.quantity;
      }
      const newQty = quantity + delta;
      if (newQty >= 1 && newQty <= maxQty) {
          setQuantity(newQty);
      }
  };

  const executeTrade = async () => {
      if (!selectedItem) return;
      setProcessing(true);

      const rpcName = tradeType === 'buy' ? 'buy_item' : 'sell_item';
      const { data, error } = await supabase.rpc(rpcName, {
          p_item_id: selectedItem.id,
          p_quantity: quantity
      });

      closeModal();

      if (error || !data.success) {
          setResultModal({
              open: true,
              success: false,
              title: "TRANSACTION FAILED",
              message: error?.message || data?.message || "Unknown error occurred."
          });
      } else {
          const totalPrice = tradeType === 'buy' ? selectedItem.price * quantity : selectedItem.sell_price * quantity;
          setResultModal({
              open: true,
              success: true,
              title: tradeType === 'buy' ? "PURCHASE SUCCESSFUL" : "SALE SUCCESSFUL",
              message: `${selectedItem.name}`,
              subMessage: tradeType === 'buy' 
                ? `${quantity} items added to inventory.`
                : `${quantity} items sold for ${totalPrice} C.`
          });
          
          fetchShopData();
          // [중요] 지갑 업데이트 이벤트 발생
          const event = new CustomEvent('walletUpdated');
          window.dispatchEvent(event);
      }
      setProcessing(false);
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-[#d4af37] animate-pulse">Accessing Market Network...</div>;

  return (
    <div className="animate-fade-in space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-[#d4af37]/20 pb-4 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full">
                {shopConfig[shopType].icon}
            </div>
            <div>
                <h2 className="text-2xl font-['Cinzel'] text-[#f9eabb]">{shopConfig[shopType].title}</h2>
                <p className="text-xs text-[#d4af37] tracking-widest uppercase">{shopConfig[shopType].subtitle}</p>
                <p className="text-[10px] text-gray-500 mt-1">{shopConfig[shopType].desc}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 border border-[#d4af37]/30 rounded">
            <Coins size={16} className="text-[#d4af37]" />
            <span className="text-sm font-mono text-[#f9eabb]">
                TOTAL ASSETS: <span className="text-[#d4af37] font-bold text-lg">{userCoin.toLocaleString()}</span> C
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-300px)] min-h-[500px]">
        {/* BUY SECTION */}
        <SectionCard title="MARKET STOCK (BUY)" className="lg:col-span-7 flex flex-col h-full" noPadding>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {shopItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <ShoppingBag size={48} className="mb-2"/>
                        <p>Out of Stock</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {shopItems.map(item => (
                            <div key={item.id} className="bg-[#05140e] border border-[#d4af37]/10 flex flex-col group hover:border-[#d4af37]/50 transition-all relative overflow-hidden">
                                <div className="aspect-square bg-black relative flex items-center justify-center overflow-hidden border-b border-[#d4af37]/10">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"/>
                                    ) : (
                                        <Package size={32} className="text-gray-600"/>
                                    )}
                                    <div className="absolute top-1 right-1">
                                        <span className={`text-[8px] px-1.5 py-0.5 border bg-black/50 backdrop-blur rounded ${item.rarity === 'legendary' ? 'border-yellow-500 text-yellow-500' : 'border-gray-600 text-gray-400'} uppercase`}>
                                            {item.rarity}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col">
                                    <h4 className="text-[#f9eabb] font-bold text-xs mb-1 truncate">{item.name}</h4>
                                    <p className="text-[10px] text-gray-400 mt-1 mb-2 leading-tight line-clamp-2 min-h-[2.5em]">
                                        {item.description || item.desc || "No description available."}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#d4af37]/10">
                                        <span className="text-[#d4af37] font-mono text-xs">{item.price} C</span>
                                        <button onClick={() => openModal('buy', item)} className="bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/30 text-[10px] px-2 py-1 uppercase font-bold transition-colors">Buy</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SectionCard>

        {/* SELL SECTION */}
        <SectionCard title="MY BAG (SELL)" className="lg:col-span-5 flex flex-col h-full bg-[#020f0a]/50" noPadding>
            <div className="p-2 bg-blue-900/10 border-b border-blue-500/20 text-[10px] text-blue-200 text-center">
                Selling returns partial value.
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {myItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <Package size={48} className="mb-2"/>
                        <p>No sellable items</p>
                    </div>
                ) : (
                    myItems.map(item => (
                        <div key={`my-${item.id}`} className="flex items-center gap-3 p-3 bg-black/40 border border-gray-800 hover:border-blue-500/50 transition-all group">
                             <div className="w-10 h-10 bg-black shrink-0 border border-gray-700 flex items-center justify-center overflow-hidden">
                                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/> : <Package size={16} className="text-gray-600"/>}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <h4 className="text-gray-300 font-bold text-sm group-hover:text-blue-200">{item.name}</h4>
                                    <span className="text-[10px] text-gray-500">x{item.quantity}</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Sell: <span className="text-blue-400">{item.sell_price || 0} C</span></p>
                            </div>
                             <button onClick={() => openModal('sell', item)} disabled={!item.sell_price} className="shrink-0 w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-all">
                                <ArrowRightLeft size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </SectionCard>
      </div>

      {/* MODAL 1: Quantity */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-sm bg-[#05140e] border p-6 relative shadow-2xl ${tradeType === 'buy' ? 'border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]'}`}>
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                <div className="text-center mb-6">
                    <div className={`w-12 h-12 mx-auto border rounded-full flex items-center justify-center mb-3 ${tradeType === 'buy' ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]' : 'border-blue-500 bg-blue-500/10 text-blue-500'}`}>
                        {tradeType === 'buy' ? <ShoppingBag size={24}/> : <Coins size={24}/>}
                    </div>
                    <h3 className={`text-xl font-['Cinzel'] font-bold ${tradeType === 'buy' ? 'text-[#f9eabb]' : 'text-blue-100'}`}>
                        {tradeType === 'buy' ? 'CONFIRM PURCHASE' : 'CONFIRM SALE'}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{selectedItem.name}</p>
                </div>
                <div className="bg-black/40 border border-gray-800 p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-gray-500 uppercase">Quantity</span>
                        <span className="text-[10px] text-gray-500 uppercase">
                            {tradeType === 'buy' ? `Stock: ${selectedItem.stock === 999 ? '∞' : selectedItem.stock}` : `Owned: ${selectedItem.quantity}`}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <button onClick={() => adjustQuantity(-1)} className="w-8 h-8 border border-gray-600 hover:border-white text-gray-400 hover:text-white flex items-center justify-center"><Minus size={14}/></button>
                        <span className="text-xl font-mono font-bold text-white">{quantity}</span>
                        <button onClick={() => adjustQuantity(1)} className="w-8 h-8 border border-gray-600 hover:border-white text-gray-400 hover:text-white flex items-center justify-center"><Plus size={14}/></button>
                    </div>
                </div>
                <div className="space-y-2 border-t border-gray-800 pt-4 mb-6">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Unit Price</span>
                        <span>{tradeType === 'buy' ? selectedItem.price : selectedItem.sell_price} C</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className={tradeType === 'buy' ? 'text-[#d4af37]' : 'text-blue-400'}>TOTAL</span>
                        <span className="text-white">
                            {(tradeType === 'buy' ? selectedItem.price * quantity : selectedItem.sell_price * quantity).toLocaleString()} C
                        </span>
                    </div>
                    {tradeType === 'buy' && userCoin < selectedItem.price * quantity && (
                        <p className="text-red-500 text-[10px] text-right mt-1">Insufficient Funds!</p>
                    )}
                </div>
                <button onClick={executeTrade} disabled={processing || (tradeType === 'buy' && userCoin < selectedItem.price * quantity)} className={`w-full py-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${tradeType === 'buy' ? 'bg-[#d4af37] text-black hover:bg-[#f9eabb] disabled:bg-gray-800 disabled:text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500'}`}>
                    {processing ? <RefreshCw className="animate-spin" size={14}/> : (tradeType === 'buy' ? 'PURCHASE' : 'SELL NOW')}
                </button>
            </div>
        </div>
      )}

      {/* MODAL 2: Result */}
      {resultModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-sm bg-[#05140e] border p-6 relative shadow-2xl ${tradeType === 'buy' ? 'border-[#d4af37]' : 'border-blue-500'}`}>
                <button onClick={closeResultModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                <div className="text-center py-4">
                    <div className={`w-16 h-16 mx-auto border rounded-full flex items-center justify-center mb-4 ${
                        resultModal.success 
                        ? (tradeType === 'buy' ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-blue-500 text-blue-500 bg-blue-500/10')
                        : 'border-red-500 text-red-500 bg-red-500/10'
                    }`}>
                        {resultModal.success ? <Check size={32}/> : <AlertTriangle size={32}/>}
                    </div>
                    <h3 className={`text-xl font-['Cinzel'] font-bold mb-2 ${resultModal.success ? (tradeType === 'buy' ? 'text-[#f9eabb]' : 'text-blue-100') : 'text-red-400'}`}>
                        {resultModal.title}
                    </h3>
                    <p className="text-gray-300 font-bold text-sm mb-1">{resultModal.message}</p>
                    {resultModal.subMessage && <p className="text-xs text-gray-500">{resultModal.subMessage}</p>}
                </div>
                <button onClick={closeResultModal} className={`w-full mt-4 py-3 font-bold uppercase tracking-widest text-xs transition-all ${tradeType === 'buy' ? 'bg-[#d4af37] text-black hover:bg-[#f9eabb]' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                    CONFIRM
                </button>
            </div>
        </div>
      )}

    </div>
  );
};