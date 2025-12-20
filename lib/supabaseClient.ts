import { createClient } from '@supabase/supabase-js';

// Vite 환경에서는 process.env 대신 import.meta.env를 사용합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경 변수가 제대로 로드되지 않았을 때 콘솔에 에러를 띄워줍니다.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 환경 변수가 누락되었습니다. .env.local 파일이나 Vercel 설정을 확인하세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);