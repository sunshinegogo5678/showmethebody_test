import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MyPage } from './MyPage';
import { Shop } from './Shop';
import { Casino } from './Casino';
import { Members } from './Members';
import { Notice } from './Notice';
import { System } from './System';
import { World } from './World';
import { AdminDashboard } from './AdminDashboard';
import { RouletteRoom } from './RouletteRoom';
import { CraftingRoom } from './CraftingRoom';
import { InvestigationMap } from './InvestigationMap';
import { ProfileForm } from './ProfileForm';
import { MainPage } from './MainPage';
import { LockScreen } from './LockScreen';
import { CharacterProfile } from '../types';
import { LogOut, User, Dices, Users, Coins, Bell, Scale, Globe, Menu, X, ShieldAlert, Beaker, Map, Skull, Gift, Home, LogIn } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
  profile: CharacterProfile;
  onProfileUpdate: () => void;
}

type TabType = 'main' | 'mypage' | 'notice' | 'system' | 'world' | 'members' | 'investigation' | 'casino' | 'parts_shop' | 'gift_shop' | 'crafting' | 'roulette_room' | 'admin';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, profile, onProfileUpdate }) => {
  const getInitialTab = (): TabType => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['main', 'mypage', 'notice', 'system', 'world', 'members', 'investigation', 'casino', 'parts_shop', 'gift_shop', 'crafting', 'admin'].includes(tab)) {
          return tab as TabType;
      }
      return 'main';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);

  // [수정] 관리자 여부 확인 로직 강화 (isAdmin, is_admin, role 모두 체크)
  // @ts-ignore
  const showAdminMenu = profile.isAdmin || profile.is_admin || profile.role === 'admin';
  const isGuest = profile.role === 'guest';
  const isMainPage = activeTab === 'main';
  const isFullWidthPage = activeTab === 'roulette_room' || activeTab === 'investigation' || isMainPage;

  useEffect(() => {
    const handleWalletUpdate = () => { onProfileUpdate(); };
    window.addEventListener('walletUpdated', handleWalletUpdate);
    checkSystemStatus();
    
    const handlePopState = (event: PopStateEvent) => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab as TabType);
        } else {
            setActiveTab('main');
        }
    };
    window.addEventListener('popstate', handlePopState);

    return () => { 
        window.removeEventListener('walletUpdated', handleWalletUpdate); 
        window.removeEventListener('popstate', handlePopState);
    };
  }, [onProfileUpdate]);

  const checkSystemStatus = async () => {
      const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'is_open')
          .single();
      
      if (data && data.value === 'true') {
          setIsSystemOpen(true);
      } else {
          setIsSystemOpen(false);
      }
  };

  const handleNavClick = (id: TabType) => {
      const newUrl = `${window.location.pathname}?tab=${id}`;
      window.history.pushState({ tab: id }, '', newUrl);
      setActiveTab(id);
      setIsEditingProfile(false);
      setMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (isEditingProfile) {
        return <ProfileForm mode="edit" initialData={profile} onComplete={() => { setIsEditingProfile(false); onProfileUpdate(); }} onCancel={() => setIsEditingProfile(false)} />;
    }

    switch (activeTab) {
      case 'main': return <MainPage profile={profile} onNavigate={handleNavClick} />;
      
      case 'mypage': 
        if (isGuest) return <MainPage profile={profile} onNavigate={handleNavClick} />;
        return <MyPage profile={profile} onEdit={() => setIsEditingProfile(true)} />;
        
      case 'notice': return <Notice />;
      case 'system': return <System />;
      case 'world': return <World />;
      case 'members': return <Members />;
      
      case 'casino': 
        if (!isSystemOpen && !profile.isAdmin) {
            return <LockScreen onBack={() => handleNavClick('main')} />;
        }
        if (isGuest) return <LockScreen title="LOGIN REQUIRED" message="이 기능을 이용하려면 로그인이 필요합니다." onBack={() => handleNavClick('main')} />;

        return <Casino 
            onEnterRoulette={() => handleNavClick('roulette_room')} 
            onCoinUpdate={onProfileUpdate}
        />;

      // [수정] investigation을 여기로 이동하여 공통 로직(시스템 오픈 체크, 게스트 체크)을 타도록 변경
      case 'investigation':
      case 'roulette_room': 
      case 'parts_shop': 
      case 'gift_shop': 
      case 'crafting': 
        if (!isSystemOpen && !showAdminMenu) {
            return <LockScreen onBack={() => handleNavClick('main')} />;
        }
        
        if (isGuest) return <LockScreen title="LOGIN REQUIRED" message="이 기능을 이용하려면 로그인이 필요합니다." onBack={() => handleNavClick('main')} />;

        // 여기에서 각 탭에 맞는 컴포넌트를 리턴
        if (activeTab === 'investigation') return <InvestigationMap onActionComplete={onProfileUpdate} />;
        if (activeTab === 'casino') return <Casino onEnterRoulette={() => handleNavClick('roulette_room')} />;
        if (activeTab === 'roulette_room') return <RouletteRoom onBack={() => handleNavClick('casino')} onCoinUpdate={onProfileUpdate} />;
        if (activeTab === 'parts_shop') return <Shop shopType="part" />;
        if (activeTab === 'gift_shop') return <Shop shopType="item" />;
        if (activeTab === 'crafting') return <CraftingRoom />;
        return <MainPage profile={profile} onNavigate={handleNavClick} />;

      case 'admin':
        return showAdminMenu ? <AdminDashboard /> : <MyPage profile={profile} onEdit={() => setIsEditingProfile(true)} />;
      default: return <MainPage profile={profile} onNavigate={handleNavClick} />;
    }
  };

  const NavItem = ({ id, icon, label, isAdmin = false }: { id: TabType, icon: React.ReactNode, label: string, isAdmin?: boolean }) => {
      if (isGuest && id === 'mypage') return null;
      return (
         <NavButton active={activeTab === id && !isEditingProfile} onClick={() => handleNavClick(id)} icon={icon} label={label} isAdmin={isAdmin} />
      );
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row max-w-[1600px] mx-auto overflow-hidden">
        
        {!isMainPage && (
            <aside className="hidden md:flex flex-col w-24 lg:w-64 border-r border-[#d4af37]/10 bg-[#020f0a]/80 backdrop-blur-md h-full shrink-0 z-40">
            <div 
                onClick={() => handleNavClick('main')}
                className="p-6 flex items-center justify-center lg:justify-start gap-4 border-b border-[#d4af37]/10 mb-6 shrink-0 cursor-pointer group"
            >
                <div className="w-8 h-8 bg-[#d4af37] rotate-45 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.4)] group-hover:rotate-90 transition-transform duration-500">
                    <div className="w-4 h-4 bg-[#020f0a] -rotate-45 group-hover:-rotate-90 transition-transform duration-500"></div>
                </div>
                <span className="hidden lg:block font-['Cinzel'] font-bold text-[#d4af37] text-sm tracking-widest leading-tight group-hover:text-[#f9eabb] transition-colors">SHOW ME<br/>THE BODY</span>
            </div>
            
            <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto custom-scrollbar">
                <NavItem id="main" icon={<Home size={18} />} label="Lobby" />
                <NavItem id="mypage" icon={<User size={18} />} label="My Page" />
                <div className="my-2 px-6 lg:px-8"><div className="h-px bg-[#d4af37]/10 w-full"></div></div>
                <NavItem id="notice" icon={<Bell size={18} />} label="Notice" />
                <NavItem id="system" icon={<Scale size={18} />} label="Rules & System" />
                <NavItem id="world" icon={<Globe size={18} />} label="World View" />
                <NavItem id="members" icon={<Users size={18} />} label="Members" />
                
                <div className="my-2 px-6 lg:px-8"><div className="h-px bg-[#d4af37]/10 w-full"></div></div>
                <NavItem id="investigation" icon={<Map size={18} />} label="Investigation" />
                <NavItem id="casino" icon={<Dices size={18} />} label="Casino Floor" />
                <NavItem id="parts_shop" icon={<Skull size={18} />} label="Select Parts" />
                <NavItem id="gift_shop" icon={<Gift size={18} />} label="Gift Shop" />
                <NavItem id="crafting" icon={<Beaker size={18} />} label="Synthesis Lab" />
                
                {showAdminMenu && (
                    <>
                        <div className="my-2 px-6 lg:px-8"><div className="h-px bg-red-900/30 w-full"></div></div>
                        <NavItem id="admin" icon={<ShieldAlert size={18} />} label="Admin Console" isAdmin />
                    </>
                )}
            </nav>
            
            <div className="p-6 border-t border-[#d4af37]/10 bg-gradient-to-t from-[#020f0a] to-transparent shrink-0">
                {!isGuest && (
                    <div className="hidden lg:flex flex-col gap-1 mb-6">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest pl-1">Total Assets</span>
                        <div className="flex items-center gap-2 text-[#d4af37] font-mono font-bold text-lg">
                            <Coins size={16} />
                            {profile.coin?.toLocaleString() || 0}
                        </div>
                    </div>
                )}
                
                {isGuest ? (
                    <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 text-[#d4af37] hover:text-white transition-colors uppercase text-[10px] tracking-widest hover:bg-[#d4af37]/10 border border-[#d4af37] rounded-sm">
                        <LogIn size={16} />
                        <span className="hidden lg:inline">LOGIN / REGISTER</span>
                    </button>
                ) : (
                    <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 text-gray-500 hover:text-red-400 transition-colors uppercase text-[10px] tracking-widest hover:bg-red-900/10 border border-transparent hover:border-red-900/30">
                        <LogOut size={16} />
                        <span className="hidden lg:inline">Logout</span>
                    </button>
                )}
            </div>
            </aside>
        )}

        {!isMainPage && (
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#020f0a]/90 backdrop-blur-md border-b border-[#d4af37]/10 z-50 px-4 flex items-center justify-between shrink-0">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#d4af37]">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
                <span onClick={() => handleNavClick('main')} className="font-['Cinzel'] font-bold text-[#d4af37] text-sm tracking-widest cursor-pointer">SHOW ME THE BODY</span>
                
                {!isGuest && (
                    <div className="flex items-center gap-1.5 text-[#d4af37] font-mono text-sm">
                        <Coins size={14} />{profile.coin?.toLocaleString() || 0}
                    </div>
                )}
            </div>
        )}

        {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-black/95 pt-16 md:hidden animate-fade-in">
                <nav className="flex flex-col p-6 gap-2 h-full overflow-y-auto custom-scrollbar">
                    <NavItem id="main" icon={<Home size={20} />} label="Lobby" />
                    <NavItem id="mypage" icon={<User size={20} />} label="My Page" />
                    <div className="my-2 h-px bg-[#d4af37]/20 w-full"></div>
                    <NavItem id="notice" icon={<Bell size={20} />} label="Notice" />
                    <NavItem id="system" icon={<Scale size={20} />} label="Rules & System" />
                    <NavItem id="world" icon={<Globe size={20} />} label="World View" />
                    <NavItem id="members" icon={<Users size={20} />} label="Members" />
                    
                    <div className="my-2 h-px bg-[#d4af37]/20 w-full"></div>
                    <NavItem id="investigation" icon={<Map size={20} />} label="Investigation" />
                    <NavItem id="casino" icon={<Dices size={20} />} label="Casino Floor" />
                    <NavItem id="parts_shop" icon={<Skull size={20} />} label="Select Parts" />
                    <NavItem id="gift_shop" icon={<Gift size={20} />} label="Gift Shop" />
                    <NavItem id="crafting" icon={<Beaker size={20} />} label="Synthesis Lab" />
                    
                    {showAdminMenu && (
                        <>
                            <div className="my-2 h-px bg-red-900/30 w-full"></div>
                            <NavItem id="admin" icon={<ShieldAlert size={20} />} label="Admin Console" isAdmin />
                        </>
                    )}
                    <div className="mt-8 pb-8 border-t border-[#d4af37]/20 pt-4">
                        {isGuest ? (
                            <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-4 text-[#d4af37] hover:text-white uppercase tracking-widest text-xs p-4 border border-[#d4af37] hover:bg-[#d4af37]/10">
                                <LogIn size={20}/> LOGIN / REGISTER
                            </button>
                        ) : (
                            <button onClick={onLogout} className="w-full flex items-center justify-center gap-4 text-red-400 hover:text-red-300 uppercase tracking-widest text-xs p-4 border border-red-900/30 hover:bg-red-900/10">
                                <LogOut size={20}/> Logout
                            </button>
                        )}
                    </div>
                </nav>
            </div>
        )}

        <main className={`flex-1 h-full overflow-y-auto ${isFullWidthPage ? 'p-0' : 'p-4 md:p-8'} ${!isMainPage ? 'pt-20 md:pt-8' : ''} relative custom-scrollbar bg-[#020f0a]/50`}>
           <div className={`h-full ${isFullWidthPage ? 'p-0 overflow-hidden h-full flex flex-col' : ''}`}>
             {renderContent()}
           </div>
        </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isAdmin?: boolean }> = ({ active, onClick, icon, label, isAdmin }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 transition-all duration-300 group relative border-l-2 ${active ? isAdmin ? 'border-red-500 bg-red-900/10 text-red-400' : 'border-[#d4af37] bg-gradient-to-r from-[#d4af37]/10 to-transparent text-[#d4af37]' : isAdmin ? 'border-transparent text-red-900/50 hover:text-red-400' : 'border-transparent text-gray-500 hover:text-[#f9eabb] hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5'}`}>
    <span className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className={`lg:inline text-xs uppercase tracking-[0.2em] relative z-10 font-medium ${active ? 'text-[#f9eabb]' : ''}`}>{label}</span>
    {active && !isAdmin && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d4af37] shadow-[0_0_15px_#d4af37]" />}
    {active && isAdmin && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_15px_red]" />}
  </button>
);