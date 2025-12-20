import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SectionCard } from './SectionCard';
import { 
  ShieldAlert, Plus, Users, Search, Save, Package, RefreshCw, 
  Trash2, Edit3, X, Coins, Send, Eraser, Gift, Settings, Calendar, 
  ArrowUpRight, ArrowDownLeft, Filter, Clock 
} from 'lucide-react';
import { InvestigationEditor } from './InvestigationEditor'; 

// --- Type Definitions ---
interface ItemData {
  id?: string;
  name: string;
  type: 'item' | 'part';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  sell_price: number;
  stock: number;
  description: string;
  image_url: string;
}

interface RewardConfig {
    id?: string;
    type: 'coin' | 'item';
    value: string;
    name: string;
    probability: number;
    is_active: boolean;
}

interface SystemLog {
    id: string;
    created_at: string;
    type: string;
    description: string;
    amount: number;
    user_id: string;
    profiles: {
        name_kr: string;
        role: string;
    };
}

const INITIAL_ITEM: ItemData = {
  name: '',
  type: 'item',
  rarity: 'common',
  price: 100,
  sell_price: 50,
  stock: 999,
  description: '',
  image_url: ''
};

const INITIAL_REWARD: RewardConfig = {
    type: 'coin',
    value: '10',
    name: '10 코인',
    probability: 50,
    is_active: true
};

const LOG_TYPES = [
    { value: 'ALL', label: 'All Types' },
    { value: 'SYSTEM', label: 'System' },
    { value: 'ATTENDANCE', label: 'Attendance' },
    { value: 'CRAFT', label: 'Crafting' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'SALE', label: 'Sale' },
    { value: 'GAME_RESULT', label: 'Game' },
    { value: 'INVEST', label: 'Investigate' },
    { value: 'ADMIN_GIFT', label: 'Admin Gift' },
];

// ------------------------------------------------------------------
// 1. DAILY REWARD CONFIGURATION COMPONENT (Attendance Date Setting Included)
// ------------------------------------------------------------------

const DailyRewardConfig: React.FC<{ items: any[] }> = ({ items }) => {
    const [rewards, setRewards] = useState<RewardConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<RewardConfig>(INITIAL_REWARD);
    const [isEditing, setIsEditing] = useState(false);
    const [totalWeight, setTotalWeight] = useState(0);
    
    // [수정] 출석체크 시작일 관리 상태
    const [startDate, setStartDate] = useState('');
    const [savingDate, setSavingDate] = useState(false);

    const fetchRewards = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('daily_rewards').select('*').order('probability', { ascending: false });
        if (data) {
            setRewards(data);
            const total = data.reduce((sum, r) => sum + r.probability, 0);
            setTotalWeight(total);
        }
        setLoading(false);
        if (error) console.error("Error fetching rewards:", error);
    }, []);
    
    // [수정] 시스템 설정에서 attendance_start_date 가져오기
    const fetchStartDate = async () => {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'attendance_start_date').single();
        if (data) setStartDate(data.value);
    };

    useEffect(() => {
        fetchRewards();
        fetchStartDate();
    }, [fetchRewards]);

    // [수정] 출석체크 시작일 저장 핸들러
    const handleSaveStartDate = async () => {
        if (!startDate) return alert("날짜를 선택해주세요.");
        setSavingDate(true);
        const { error } = await supabase.from('system_settings').upsert({ key: 'attendance_start_date', value: startDate });
        setSavingDate(false);
        if (error) alert("설정 실패: " + error.message);
        else alert("출석체크 시작일이 설정되었습니다.\n(메인페이지의 14일 출석판이 이 날짜를 기준으로 생성됩니다.)");
    };

    const handleSelectReward = (reward: RewardConfig) => {
        setFormData(reward);
        setIsEditing(true);
    };

    const handleResetForm = () => {
        setFormData(INITIAL_REWARD);
        setIsEditing(false);
    };
    
    const handleItemChange = (itemId: string) => {
        const selectedItem = items.find(i => i.id === itemId);
        if (selectedItem) {
            setFormData(prev => ({ ...prev, type: 'item', value: itemId, name: selectedItem.name }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.value) return alert("필수 항목을 입력해주세요.");
        const payload = {
            type: formData.type, value: formData.value, name: formData.name,
            probability: formData.probability, is_active: formData.is_active,
        };
        setLoading(true);
        let error;
        if (isEditing && formData.id) {
            const { error: updateError } = await supabase.from('daily_rewards').update(payload).eq('id', formData.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('daily_rewards').insert([payload]);
            error = insertError;
        }
        setLoading(false);
        if (error) alert("저장 실패: " + error.message);
        else { alert(isEditing ? "수정되었습니다." : "생성되었습니다."); fetchRewards(); handleResetForm(); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("정말로 이 보상 설정을 삭제하시겠습니까?")) return;
        setLoading(true);
        const { error } = await supabase.from('daily_rewards').delete().eq('id', id);
        setLoading(false);
        if (error) alert("삭제 실패: " + error.message);
        else { alert("삭제되었습니다."); fetchRewards(); handleResetForm(); }
    };
    
    return (
        <div className="h-full flex flex-col">
            {/* [수정] 출석체크 시작일 설정 바 */}
            <div className="p-4 bg-black/40 border-b border-[#d4af37]/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Calendar className="text-[#d4af37]" size={20} />
                    <div>
                        <h3 className="text-[#f9eabb] font-bold text-sm">ATTENDANCE START DATE</h3>
                        <p className="text-[10px] text-gray-500">Set the Day 1 for the 14-day attendance grid.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-[#d4af37]">Start Date:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="bg-[#05140e] border border-[#d4af37]/30 text-[#f9eabb] text-xs px-2 py-1 outline-none"
                    />
                    <button 
                        onClick={handleSaveStartDate} 
                        disabled={savingDate} 
                        className="bg-[#d4af37] text-black text-xs font-bold px-3 py-1 hover:bg-[#f9eabb] transition-colors"
                    >
                        {savingDate ? 'SAVING...' : 'APPLY DATE'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 border-r border-[#d4af37]/20 flex flex-col bg-black/20">
                    <div className="p-3 border-b border-[#d4af37]/10 bg-black/40 flex justify-between items-center"><span className="text-xs font-bold text-[#d4af37] tracking-widest flex items-center gap-2">REWARD LIST</span><button onClick={handleResetForm} className="text-[10px] bg-[#d4af37] text-black px-2 py-1 font-bold flex items-center gap-1 hover:bg-[#f9eabb]"><Plus size={10}/> ADD NEW</button></div>
                    <div className="p-2 bg-yellow-900/20 text-xs text-yellow-400 font-mono text-center shrink-0">Total Probability Weight: <span className="font-bold">{totalWeight}</span></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1 relative">
                        {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[#d4af37]"><RefreshCw className="animate-spin"/></div>}
                        {rewards.length === 0 && !loading && <p className="text-center text-xs text-gray-500 p-4">No rewards configured.</p>}
                        {rewards.map(reward => (
                            <div key={reward.id} onClick={() => handleSelectReward(reward)} className={`p-2 border cursor-pointer flex justify-between items-center group ${formData.id === reward.id ? 'bg-[#d4af37]/20 border-[#d4af37]' : 'border-transparent hover:bg-white/5'}`}>
                                <div className="flex items-center gap-2"><span className={`text-[9px] px-1 border rounded font-bold ${reward.type === 'coin' ? 'border-yellow-700 text-yellow-500' : 'border-purple-700 text-purple-500'}`}>{reward.type === 'coin' ? 'COIN' : 'ITEM'}</span><div className={`font-bold text-xs ${formData.id === reward.id ? 'text-[#f9eabb]' : 'text-gray-300'}`}>{reward.name}</div></div>
                                <div className="text-right"><div className="text-sm font-mono text-[#d4af37]">{reward.probability}</div><div className="text-[9px] text-gray-500">Weight</div></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col bg-[#020f0a]/80">
                    <div className="p-3 border-b border-[#d4af37]/10 bg-black/40 flex justify-between items-center"><span className="text-xs font-bold text-[#d4af37] tracking-widest flex items-center gap-2"><Settings size={12}/> {isEditing ? 'EDIT REWARD' : 'CREATE NEW REWARD'}</span>{isEditing && <button onClick={handleResetForm}><X size={14} className="text-gray-500 hover:text-white"/></button>}</div>
                    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        <div><label className="text-[10px] uppercase text-gray-500">Reward Type</label><select value={formData.type} onChange={e => setFormData(prev => ({...prev, type: e.target.value as any, value: e.target.value === 'coin' ? '10' : '' }))} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#d4af37] outline-none"><option value="coin">Coin (코인)</option><option value="item">Item (아이템)</option></select></div>
                        {formData.type === 'coin' ? (
                            <div><label className="text-[10px] uppercase text-gray-500">Coin Amount</label><input type="number" value={formData.value} onChange={e => setFormData(prev => ({...prev, value: e.target.value, name: `${e.target.value} Coin`}))} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#f9eabb] outline-none"/></div>
                        ) : (
                             <div><label className="text-[10px] uppercase text-gray-500">Item Name</label><select value={formData.value} onChange={e => handleItemChange(e.target.value)} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#d4af37] outline-none"><option value="">Select Item...</option>{items.map(i => (<option key={i.id} value={i.id}>{i.name} ({i.type})</option>))}</select>{formData.value && <p className="text-[10px] text-gray-500 mt-1 truncate">ID: {formData.value}</p>}</div>
                        )}
                        <div><label className="text-[10px] uppercase text-gray-500">Display Name</label><input type="text" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#f9eabb] outline-none"/></div>
                        <div><label className="text-[10px] uppercase text-gray-500">Probability Weight</label><input type="number" value={formData.probability} onChange={e => setFormData(prev => ({...prev, probability: parseInt(e.target.value) || 0}))} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#f9eabb] outline-none"/></div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData(prev => ({...prev, is_active: e.target.checked}))} className="form-checkbox text-[#d4af37] bg-black border-gray-600"/><label htmlFor="is_active" className="text-xs text-gray-400">Active</label></div>
                    </form>
                    <div className="p-4 border-t border-[#d4af37]/10 bg-black/40 flex justify-between items-center">{isEditing ? (<button onClick={() => formData.id && handleDelete(formData.id)} className="text-red-500 hover:text-red-400 text-xs uppercase font-bold flex items-center gap-1"><Trash2 size={12}/> Delete</button>) : <div></div>}<button type="submit" onClick={handleSave} disabled={loading} className="bg-[#d4af37] text-black px-6 py-2 text-xs font-bold uppercase hover:bg-[#f9eabb] flex items-center gap-2">{loading ? <RefreshCw className="animate-spin" size={12}/> : <Save size={12}/>}{isEditing ? 'Update Reward' : 'Create Reward'}</button></div>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 2. ADMIN DASHBOARD MAIN COMPONENT
// ------------------------------------------------------------------

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'items' | 'investigation' | 'broadcast' | 'logs' | 'feed'>('logs');
  
  // Stats & Management State
  const [stats, setStats] = useState({ members: 0, circulation: 0, items: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [memberSubTab, setMemberSubTab] = useState<'list' | 'rewards'>('list'); 
  
  // Gift Modal
  const [selectedUser, setSelectedUser] = useState<any>(null); 
  const [giftAmount, setGiftAmount] = useState<number>(1000); 
  const [giftItemId, setGiftItemId] = useState<string>('');   

  // Items
  const [items, setItems] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemFormData, setItemFormData] = useState<ItemData>(INITIAL_ITEM);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('all'); 
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Logs
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL'); 

  // Live Feed State
  const [feeds, setFeeds] = useState<any[]>([]);
  const [newFeed, setNewFeed] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineLabel, setDeadlineLabel] = useState('');

  // Initial Load
  useEffect(() => {
    fetchStats();
    if (activeTab === 'members') fetchUsers();
    if (activeTab === 'items') fetchItems(); 
    if (activeTab === 'logs') fetchLogs(); 
    if (activeTab === 'feed') fetchFeedData();
  }, [activeTab]);

  const fetchStats = async () => {
    const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { data: profiles } = await supabase.from('profiles').select('coin');
    const totalCoins = profiles?.reduce((acc, curr) => acc + (curr.coin || 0), 0) || 0;
    const { count: itemCount } = await supabase.from('items').select('*', { count: 'exact', head: true });
    setStats({ members: memberCount || 0, circulation: totalCoins, items: itemCount || 0 });
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoadingItems(false);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      if (!logsData || logsData.length === 0) {
          setLogs([]);
          return;
      }

      const userIds = Array.from(new Set(logsData.map(log => log.user_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name_kr, role')
        .in('id', userIds);

      const combinedLogs = logsData.map(log => {
          const profile = profilesData?.find(p => p.id === log.user_id);
          return {
              ...log,
              profiles: {
                  name_kr: profile?.name_kr || 'Unknown',
                  role: profile?.role || '-'
              }
          };
      });

      setLogs(combinedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchFeedData = async () => {
      const { data: feedData } = await supabase.from('admin_feeds').select('*').order('created_at', { ascending: false });
      if (feedData) setFeeds(feedData);

      const { data: settingData } = await supabase.from('system_settings').select('value').eq('key', 'app_deadline').single();
      if (settingData) setDeadline(settingData.value);

      const { data: labelData } = await supabase.from('system_settings').select('value').eq('key', 'app_deadline_label').single();
      if (labelData) setDeadlineLabel(labelData.value);
  };

  const handleAddFeed = async () => {
      if (!newFeed.trim()) return;
      const { error } = await supabase.from('admin_feeds').insert([{ content: newFeed }]);
      if (!error) {
          setNewFeed('');
          fetchFeedData();
      } else {
          alert("추가 실패: " + error.message);
      }
  };

  const handleDeleteFeed = async (id: string) => {
      if (!confirm('삭제하시겠습니까?')) return;
      const { error } = await supabase.from('admin_feeds').delete().eq('id', id);
      if (!error) fetchFeedData();
      else alert("삭제 실패: " + error.message);
  };

  const handleSaveDeadline = async () => {
      const { error: dateError } = await supabase.from('system_settings').upsert({ key: 'app_deadline', value: deadline });
      const { error: labelError } = await supabase.from('system_settings').upsert({ key: 'app_deadline_label', value: deadlineLabel });

      if (!dateError && !labelError) alert('설정이 저장되었습니다.');
      else alert('저장 실패: ' + (dateError?.message || labelError?.message));
  };

  const formatFullTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
  };

  const openGiftModal = (user: any) => { setSelectedUser(user); setGiftAmount(1000); setGiftItemId(''); };
  const closeGiftModal = () => { setSelectedUser(null); };

  const handleGiveCoin = async () => {
    if (!selectedUser) return;
    if (giftAmount === 0) return alert("금액을 입력해주세요.");
    if (!window.confirm(`[${selectedUser.name_kr}]님에게 ${giftAmount} 코인을 지급하시겠습니까?`)) return;

    const { error } = await supabase.rpc('admin_give_coin', { p_target_user_id: selectedUser.id, p_amount: giftAmount });
    if (error) alert("지급 실패: " + error.message);
    else { alert("지급 완료!"); fetchUsers(); fetchStats(); closeGiftModal(); }
  };

  const handleGiveItem = async () => {
      if (!selectedUser) return;
      if (!giftItemId) return alert("지급할 아이템을 선택해주세요.");
      const selectedItem = items.find(i => i.id === giftItemId);
      if (!selectedItem) return;
      if (!window.confirm(`[${selectedUser.name_kr}]님에게 [${selectedItem.name}] 아이템을 지급하시겠습니까?`)) return;

      const { error } = await supabase.rpc('admin_give_item', { p_target_user_id: selectedUser.id, p_item_id: selectedItem.id, p_item_name: selectedItem.name });
      if (error) alert("지급 실패: " + error.message);
      else { alert("아이템 지급 완료!"); fetchStats(); closeGiftModal(); }
  };

  const handleSelectItem = (item: any) => {
    setItemFormData({
      id: item.id, 
      name: item.name, 
      type: item.type || 'item', 
      rarity: item.rarity || 'common',
      price: item.price || 0,
      sell_price: item.sell_price || 0,
      stock: item.stock === null ? 999 : item.stock, 
      description: item.description || '', 
      image_url: item.image_url || ''
    });
    setIsEditingItem(true);
  };

  const handleResetItemForm = () => { setItemFormData(INITIAL_ITEM); setIsEditingItem(false); };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name) return alert("이름을 입력해주세요.");
    setIsSavingItem(true);
    const payload = { ...itemFormData, image_url: itemFormData.image_url || null };

    let error;
    if (isEditingItem && itemFormData.id) {
      const { error: updateError } = await supabase.from('items').update(payload).eq('id', itemFormData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('items').insert([payload]);
      error = insertError;
    }
    setIsSavingItem(false);
    if (error) alert("저장 실패: " + error.message);
    else { alert(isEditingItem ? "수정되었습니다." : "생성되었습니다."); fetchItems(); fetchStats(); handleResetItemForm(); }
  };

  const handleDeleteItem = async () => {
    if (!itemFormData.id) return;
    if (!window.confirm(`[${itemFormData.name}] 아이템을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('items').delete().eq('id', itemFormData.id);
    if (error) alert("삭제 실패: " + error.message);
    else { alert("삭제되었습니다."); fetchItems(); fetchStats(); handleResetItemForm(); }
  };
  
  const handleBroadcast = async (action: 'send' | 'clear') => {
    if (action === 'send' && !broadcastMsg.trim()) return alert("메시지를 입력해주세요.");
    if (!window.confirm(action === 'send' ? `[${broadcastTarget === 'all' ? '전체' : '선택된 유저'}]에게 방송을 보내시겠습니까?` : `[${broadcastTarget === 'all' ? '전체' : '선택된 유저'}]의 라디오 메시지를 초기화하시겠습니까?`)) return;

    setIsBroadcasting(true);
    const payload = { radio_message: action === 'send' ? broadcastMsg : null }; 
    try {
        let query = supabase.from('profiles').update(payload);
        if (broadcastTarget !== 'all') query = query.eq('id', broadcastTarget);
        else query = query.neq('id', '00000000-0000-0000-0000-000000000000'); 
        const { error } = await query;
        if (error) throw error;
        alert(action === 'send' ? "전송 완료!" : "초기화 완료!");
        if (action === 'clear') setBroadcastMsg('');
    } catch (err: any) { alert("오류 발생: " + err.message); } finally { setIsBroadcasting(false); }
  };

  const filteredUsers = users.filter(u => (u.name_kr && u.name_kr.includes(userSearch)) || (u.name_en && u.name_en.toLowerCase().includes(userSearch.toLowerCase())));
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));

  return (
    <div className="animate-fade-in space-y-6 h-[calc(100vh-100px)] flex flex-col relative">
      <div className="shrink-0 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-['Cinzel'] text-red-500 tracking-widest mb-2 flex items-center justify-center gap-3"><ShieldAlert size={32}/> ADMIN CONSOLE</h2>
          <div className="h-px w-24 bg-red-900/40 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard label="Total Members" value={stats.members.toLocaleString()} icon={<Users size={20}/>} />
            <StatsCard label="Total Circulation" value={stats.circulation.toLocaleString()} icon={<Coins size={20}/>} />
            <StatsCard label="Items Registered" value={stats.items.toLocaleString()} icon={<Package size={20}/>} />
        </div>
        <div className="flex border-b border-[#d4af37]/20">
            <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} label="System Logs" />
            <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label="Member Management" />
            <TabButton active={activeTab === 'items'} onClick={() => setActiveTab('items')} label="Item DB" />
            <TabButton active={activeTab === 'investigation'} onClick={() => setActiveTab('investigation')} label="Investigation Map" />
            <TabButton active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} label="Broadcast Center" />
            <TabButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} label="Live Feed" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-[#020f0a]/50 border border-[#d4af37]/10 rounded-b-lg">
        
       {/* SYSTEM LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[#d4af37]/10 flex gap-4 bg-black/20">
                <div className="flex items-center gap-2 bg-[#05140e] border border-[#d4af37]/20 px-3 py-2">
                    <Filter size={14} className="text-[#d4af37]" />
                    <select 
                        value={logTypeFilter} 
                        onChange={(e) => setLogTypeFilter(e.target.value)}
                        className="bg-[#05140e] text-xs text-[#f9eabb] outline-none border-none cursor-pointer"
                    >
                        {LOG_TYPES.map(type => (
                            <option key={type.value} value={type.value} className="bg-[#05140e] text-[#f9eabb]">
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search logs (User, Content...)" 
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full bg-[#05140e] border border-[#d4af37]/20 pl-10 pr-4 py-2 text-sm text-[#f9eabb] focus:border-[#d4af37] outline-none"
                    />
                </div>
                <button 
                  onClick={fetchLogs} 
                  disabled={loadingLogs}
                  className="p-2 text-[#d4af37] hover:bg-[#d4af37]/10 rounded transition-colors ml-auto"
                  title="Refresh Logs"
                >
                  <RefreshCw size={20} className={loadingLogs ? 'animate-spin' : ''} />
                </button>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-4">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#d4af37]/5 text-[#d4af37] text-[10px] uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 shadow-lg">
                        <tr>
                            <th className="p-3 font-bold w-40">Date / Time</th>
                            <th className="p-3 font-bold w-32">Actor (Role)</th>
                            <th className="p-3 font-bold w-24">Type</th>
                            <th className="p-3 font-bold">Details</th>
                            <th className="p-3 font-bold w-32 text-right">Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/10 text-xs">
                        {logs
                          .filter(log => {
                              const matchesSearch = 
                                  log.description.toLowerCase().includes(logSearch.toLowerCase()) || 
                                  (log.profiles?.name_kr || '').toLowerCase().includes(logSearch.toLowerCase());
                              const matchesType = logTypeFilter === 'ALL' || log.type === logTypeFilter;
                              return matchesSearch && matchesType;
                          })
                          .map((log) => (
                            <tr key={log.id} className="hover:bg-[#d4af37]/5 transition-colors group">
                                <td className="p-3 text-gray-500 font-mono whitespace-nowrap group-hover:text-gray-300">{formatFullTime(log.created_at)}</td>
                                <td className="p-3"><div className="text-[#f9eabb] font-bold">{log.profiles?.name_kr || 'Unknown'}</div><div className="text-[9px] text-gray-500">{log.profiles?.role || '-'}</div></td>
                                <td className="p-3">
                                    <span className={`text-[9px] px-2 py-1 rounded border font-bold uppercase whitespace-nowrap
                                        ${log.type === 'PURCHASE' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-900/10' :
                                          log.type === 'GAME_RESULT' ? 'border-purple-500/50 text-purple-500 bg-purple-900/10' :
                                          log.type === 'ATTENDANCE' ? 'border-green-500/50 text-green-500 bg-green-900/10' :
                                          log.type === 'CRAFT' ? 'border-blue-500/50 text-blue-500 bg-blue-900/10' :
                                          log.type === 'SYSTEM' ? 'border-red-500/50 text-red-500 bg-red-900/10' :
                                          'border-gray-500/50 text-gray-400 bg-gray-800/20'}`}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-300 max-w-lg break-words leading-relaxed">{log.description}</td>
                                <td className="p-3 text-right font-mono">
                                    {log.amount !== 0 && (
                                        <div className={`flex items-center justify-end gap-1 ${log.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {log.amount > 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                            {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                                        </div>
                                    )}
                                    {log.amount === 0 && <span className="text-gray-600">-</span>}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && !loadingLogs && <tr><td colSpan={5} className="p-10 text-center text-gray-500 italic">No logs found.</td></tr>}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="h-full flex flex-col">
             <div className="flex border-b border-[#d4af37]/20 bg-black/20 shrink-0">
                 <SubTabButton active={memberSubTab === 'list'} onClick={() => setMemberSubTab('list')} label="Member List" icon={<Users size={14}/>} />
                 {/* [수정] 탭 라벨 변경 */}
                 <SubTabButton active={memberSubTab === 'rewards'} onClick={() => setMemberSubTab('rewards')} label="Daily Reward & Date Config" icon={<Calendar size={14}/>} />
             </div>
             {memberSubTab === 'list' && (
                <div className="h-full flex flex-col p-4">
                    <div className="mb-4 relative shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input type="text" placeholder="Search members..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full bg-[#05140e] border border-[#d4af37]/20 pl-10 pr-4 py-2 text-sm text-[#f9eabb] focus:border-[#d4af37] focus:outline-none"/>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs text-left">
                          <thead className="text-gray-500 uppercase bg-black/40 sticky top-0"><tr><th className="p-3">Profile</th><th className="p-3">Assets</th><th className="p-3 text-right">Actions</th></tr></thead>
                          <tbody className="divide-y divide-[#d4af37]/10">
                            {loadingUsers ? <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr> : filteredUsers.map(user => (
                              <tr key={user.id} className="hover:bg-white/5">
                                <td className="p-3"><div className="font-bold text-[#d4af37]">{user.name_kr}</div><div className="text-[10px] text-gray-500">{user.name_en}</div></td>
                                <td className="p-3 font-mono text-gray-300">{user.coin?.toLocaleString()} C</td>
                                <td className="p-3 text-right"><button onClick={() => openGiftModal(user)} className="px-3 py-1 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 rounded hover:bg-[#d4af37]/20 transition-colors text-[10px] flex items-center gap-1 ml-auto"><Gift size={12}/> Gift / Manage</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                </div>
             )}
             {memberSubTab === 'rewards' && <DailyRewardConfig items={items} />}
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === 'items' && (
          <div className="h-full flex">
             <div className="w-1/3 border-r border-[#d4af37]/20 flex flex-col bg-black/20">
                <div className="p-3 border-b border-[#d4af37]/10 bg-black/40 flex justify-between items-center"><span className="text-xs font-bold text-[#d4af37] tracking-widest">MASTER LIST</span><button onClick={handleResetItemForm} className="text-[10px] bg-[#d4af37] text-black px-2 py-1 font-bold flex items-center gap-1 hover:bg-[#f9eabb]"><Plus size={10}/> NEW</button></div>
                <div className="p-2 border-b border-[#d4af37]/10"><input type="text" placeholder="Search items..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} className="w-full bg-[#05140e] border border-[#d4af37]/10 px-2 py-1 text-xs text-[#d4af37] focus:outline-none"/></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                    {loadingItems ? <p className="text-center text-xs p-4">Loading...</p> : filteredItems.map(item => (
                        <div key={item.id} onClick={() => handleSelectItem(item)} className={`p-2 border cursor-pointer flex justify-between items-center group ${itemFormData.id === item.id ? 'bg-[#d4af37]/20 border-[#d4af37]' : 'border-transparent hover:bg-white/5'}`}>
                            <div><div className={`font-bold text-xs ${itemFormData.id === item.id ? 'text-[#f9eabb]' : 'text-gray-300'}`}>{item.name}</div><div className="flex gap-1 mt-1"><span className={`text-[9px] px-1 border rounded ${item.type === 'part' ? 'border-blue-800 text-blue-400' : 'border-purple-800 text-purple-400'}`}>{item.type === 'part' ? 'PART' : 'ITEM'}</span></div></div>
                            <div className="text-right">
                                <div className="text-[#d4af37] font-mono text-[10px]"><span className="text-gray-500">B:</span>{item.price.toLocaleString()}</div>
                                <div className="text-gray-400 font-mono text-[9px]"><span className="text-gray-600">S:</span>{item.sell_price ? item.sell_price.toLocaleString() : 0}</div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
             <div className="flex-1 flex flex-col bg-[#020f0a]/80">
                <div className="p-3 border-b border-[#d4af37]/10 bg-black/40 flex justify-between items-center"><span className="text-xs font-bold text-[#d4af37] tracking-widest flex items-center gap-2">{isEditingItem ? <><Edit3 size={12}/> EDIT ITEM</> : <><Package size={12}/> CREATE ITEM</>}</span>{isEditingItem && <button onClick={handleResetItemForm}><X size={14} className="text-gray-500 hover:text-white"/></button>}</div>
                <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="flex justify-center"><div className="w-24 h-24 border border-[#d4af37]/30 bg-black/50 flex items-center justify-center overflow-hidden">{itemFormData.image_url ? <img src={itemFormData.image_url} alt="Preview" className="w-full h-full object-cover" /> : <Package size={32} className="text-[#d4af37]/20"/>}</div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] uppercase text-gray-500">Name</label><input type="text" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#f9eabb] focus:border-[#d4af37] outline-none"/></div><div><label className="text-[10px] uppercase text-gray-500">Type</label><select value={itemFormData.type} onChange={e => setItemFormData({...itemFormData, type: e.target.value as any})} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#d4af37] outline-none"><option value="item">General Item</option><option value="part">Body Part</option></select></div></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="text-[10px] uppercase text-gray-500">Rarity</label><select value={itemFormData.rarity} onChange={e => setItemFormData({...itemFormData, rarity: e.target.value as any})} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#d4af37] outline-none"><option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></div>
                        <div><label className="text-[10px] uppercase text-[#d4af37]">Buy Price (구매가)</label><input type="number" value={itemFormData.price} onChange={e => setItemFormData({...itemFormData, price: parseInt(e.target.value) || 0})} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#f9eabb] outline-none"/></div>
                        <div><label className="text-[10px] uppercase text-blue-400">Sell Price (판매가)</label><input type="number" value={itemFormData.sell_price} onChange={e => setItemFormData({...itemFormData, sell_price: parseInt(e.target.value) || 0})} className="w-full bg-[#05140e] border border-blue-900/50 p-2 text-xs text-blue-100 outline-none focus:border-blue-500"/></div>
                    </div>
                    <div><label className="text-[10px] uppercase text-gray-500">Stock (999=∞)</label><input type="number" value={itemFormData.stock} onChange={e => setItemFormData({...itemFormData, stock: parseInt(e.target.value)})} className={`w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs outline-none ${itemFormData.stock === 999 ? 'text-green-500' : 'text-[#f9eabb]'}`}/></div>
                    <div><label className="text-[10px] uppercase text-gray-500">Image URL</label><input type="text" value={itemFormData.image_url} onChange={e => setItemFormData({...itemFormData, image_url: e.target.value})} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-gray-400 outline-none" placeholder="https://..."/></div>
                    <div><label className="text-[10px] uppercase text-gray-500">Description</label><textarea value={itemFormData.description} onChange={e => setItemFormData({...itemFormData, description: e.target.value})} className="w-full bg-[#05140e] border border-[#d4af37]/30 p-2 text-xs text-[#f9eabb] h-20 resize-none outline-none custom-scrollbar"/></div>
                </form>
                <div className="p-4 border-t border-[#d4af37]/10 bg-black/40 flex justify-between items-center">{isEditingItem ? <button onClick={handleDeleteItem} className="text-red-500 hover:text-red-400 text-xs uppercase font-bold flex items-center gap-1"><Trash2 size={12}/> Delete</button> : <div></div>}<button onClick={handleSaveItem} disabled={isSavingItem} className="bg-[#d4af37] text-black px-6 py-2 text-xs font-bold uppercase hover:bg-[#f9eabb] flex items-center gap-2">{isSavingItem ? <RefreshCw className="animate-spin" size={12}/> : <Save size={12}/>} {isEditingItem ? 'Update' : 'Create'}</button></div>
             </div>
          </div>
        )}

        {activeTab === 'investigation' && <div className="h-full p-0"><InvestigationEditor /></div>}

        {activeTab === 'broadcast' && (
             <div className="h-full p-8 flex flex-col items-center justify-center">
                <SectionCard title="Emergency Broadcast System" className="w-full max-w-lg">
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center"><p className="text-xs text-gray-400 uppercase tracking-widest">Target Channel</p><select value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)} className="bg-[#05140e] border border-[#d4af37]/30 text-[#d4af37] text-xs px-2 py-1 outline-none"><option value="all">ALL AGENTS (전체)</option>{users.map(u => (<option key={u.id} value={u.id}>{u.name_kr} ({u.name_en})</option>))}</select></div>
                        <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} className="w-full h-32 bg-[#020f0a] border border-[#d4af37]/30 p-4 text-[#f9eabb] text-sm focus:border-red-500 outline-none resize-none" placeholder="Type broadcast message..."/>
                        <div className="flex gap-4"><button onClick={() => handleBroadcast('clear')} disabled={isBroadcasting} className="flex-1 py-3 border border-red-900/50 text-red-500 font-bold uppercase tracking-widest hover:bg-red-900/10 text-xs flex items-center justify-center gap-2"><Eraser size={14}/> Clear</button><button onClick={() => handleBroadcast('send')} disabled={isBroadcasting || !broadcastMsg} className="flex-[2] py-3 bg-red-900/50 border border-red-900 text-red-100 font-bold uppercase tracking-widest hover:bg-red-900 text-xs flex items-center justify-center gap-2"><Send size={14}/> Transmit</button></div>
                    </div>
                </SectionCard>
             </div>
        )}

        {activeTab === 'feed' && (
            <div className="h-full p-8 flex gap-8 justify-center overflow-auto custom-scrollbar">
                
                {/* 1. 자동 카운트다운 설정 */}
                <SectionCard title="Auto Countdown" className="w-full max-w-md h-fit">
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-widest">Countdown Subject (주어)</label>
                            <input 
                                type="text" 
                                value={deadlineLabel}
                                onChange={(e) => setDeadlineLabel(e.target.value)}
                                placeholder="예: 신청서 접수 마감"
                                className="w-full bg-[#05140e] border border-[#d4af37]/30 p-3 text-sm text-[#f9eabb] focus:border-[#d4af37] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-widest">Target Date & Time</label>
                            <input 
                                type="datetime-local" 
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full bg-[#05140e] border border-[#d4af37]/30 p-3 text-sm text-white focus:border-[#d4af37] outline-none"
                            />
                        </div>
                        <button onClick={handleSaveDeadline} className="w-full py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest hover:bg-white text-xs flex items-center justify-center gap-2">
                            <Clock size={16}/> Save Settings
                        </button>
                        <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                            * 설정 시: "[주어]까지 N일 N시간 남았습니다." 메시지가 <br/>라이브 피드 최상단에 고정 노출됩니다.
                        </p>
                    </div>
                </SectionCard>

                {/* 2. 공지 메시지 관리 */}
                <SectionCard title="Manual Notices" className="w-full max-w-lg h-fit">
                    <div className="p-6 space-y-6">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newFeed} 
                                onChange={(e) => setNewFeed(e.target.value)}
                                placeholder="새로운 공지사항 입력..."
                                className="flex-1 bg-[#05140e] border border-[#d4af37]/30 p-3 text-sm text-[#f9eabb] focus:border-[#d4af37] outline-none"
                            />
                            <button onClick={handleAddFeed} className="px-4 py-2 border border-[#d4af37] text-[#d4af37] font-bold hover:bg-[#d4af37] hover:text-black transition-colors">
                                <Plus size={20}/>
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {feeds.map((item) => (
                                <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 border-l-2 border-[#d4af37] group">
                                    <span className="text-xs text-gray-300">{item.content}</span>
                                    <button onClick={() => handleDeleteFeed(item.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                            {feeds.length === 0 && <div className="text-center text-gray-500 text-xs py-4">등록된 공지가 없습니다.</div>}
                        </div>
                    </div>
                </SectionCard>
            </div>
        )}

      </div>

      {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md bg-[#020f0a] border border-[#d4af37] p-6 relative shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                  <button onClick={closeGiftModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                  <div className="text-center mb-6"><Gift size={32} className="mx-auto text-[#d4af37] mb-2"/><h3 className="text-xl font-['Cinzel'] text-[#f9eabb]">SEND GIFT</h3><p className="text-xs text-[#d4af37] uppercase tracking-widest mt-1">To: {selectedUser.name_kr}</p></div>
                  <div className="space-y-6">
                      <div className="p-4 border border-[#d4af37]/20 bg-[#05140e]"><p className="text-[10px] uppercase text-gray-400 mb-2 font-bold">Option 1: Transfer Coins</p><div className="flex gap-2"><input type="number" value={giftAmount} onChange={(e) => setGiftAmount(parseInt(e.target.value))} className="flex-1 bg-black border border-[#d4af37]/30 px-3 py-2 text-[#d4af37] font-mono text-sm outline-none focus:border-[#d4af37]"/><button onClick={handleGiveCoin} className="px-4 py-2 bg-[#d4af37] text-black font-bold uppercase text-xs hover:bg-[#f9eabb]">Send Coin</button></div></div>
                      <div className="flex items-center gap-4"><div className="h-px bg-[#d4af37]/20 flex-1"></div><span className="text-[10px] text-gray-500">OR</span><div className="h-px bg-[#d4af37]/20 flex-1"></div></div>
                      <div className="p-4 border border-[#d4af37]/20 bg-[#05140e]"><p className="text-[10px] uppercase text-gray-400 mb-2 font-bold">Option 2: Grant Item</p><div className="flex gap-2"><select value={giftItemId} onChange={(e) => setGiftItemId(e.target.value)} className="flex-1 bg-black border border-[#d4af37]/30 px-3 py-2 text-[#d4af37] text-xs outline-none focus:border-[#d4af37]"><option value="">Select Item...</option>{items.map(i => (<option key={i.id} value={i.id}>[{i.rarity}] {i.name}</option>))}</select><button onClick={handleGiveItem} className="px-4 py-2 border border-[#d4af37] text-[#d4af37] font-bold uppercase text-xs hover:bg-[#d4af37] hover:text-black transition-colors">Send Item</button></div></div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- Helper Components ---
const StatsCard = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-[#020f0a] border border-[#d4af37]/20 p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/30 rounded-full">{icon}</div>
        <div><div className="text-[10px] uppercase text-gray-500 tracking-widest">{label}</div><div className="text-xl font-['Cinzel'] text-[#f9eabb]">{value}</div></div>
    </div>
);

const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button onClick={onClick} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${active ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/5' : 'text-gray-500 hover:text-[#d4af37] hover:bg-white/5'}`}>{label}</button>
);

const SubTabButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
    <button onClick={onClick} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/10' : 'text-gray-500 hover:text-[#d4af37] hover:bg-white/5'}`}>{icon}{label}</button>
);