import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { CharacterProfile } from './types';
import { Loader2 } from 'lucide-react';

// 게스트 프로필 정의
const GUEST_PROFILE: CharacterProfile = {
  id: 'guest',
  user_id: 'guest',
  name_kr: '예비 참가자',
  role: 'guest', 
  image_url: null,
  coin: 0,
  description: '',
  created_at: new Date().toISOString()
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSystemOpen, setIsSystemOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1. 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // 2. 시스템 개장 여부 확인
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'is_open')
        .single();
      
      const isOpen = settings?.value === 'true';
      setIsSystemOpen(isOpen);

      // 3. 프로필 로드 (로그인 시)
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    };

    init();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        // [수정됨] user_id -> id 로 변경 (DB 컬럼 오류 해결)
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020f0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  // 1. 로그인 완료 & 프로필 있음 -> 대시보드 입장
  if (session && profile) {
    return (
      <Dashboard 
        key={session.user.id} 
        onLogout={() => supabase.auth.signOut()} 
        profile={profile}
        onProfileUpdate={() => fetchProfile(session.user.id)}
      />
    );
  }

  // 2. 로그인 안 함 & 개장 전 (!isSystemOpen) -> 게스트 모드로 대시보드 입장
  if (!session && !isSystemOpen) {
    return (
        <Dashboard 
            key="guest"
            onLogout={() => window.location.reload()} 
            profile={GUEST_PROFILE}
            onProfileUpdate={() => {}}
        />
    );
  }

  // 3. 로그인 안 함 & 개장 후 -> 로그인 페이지 표시
  return <LoginPage onLogin={() => {}} />;
}

export default App;