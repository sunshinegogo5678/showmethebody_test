export interface GameStat {
  id?: string;
  name: string;
  plays: number;
  wins: number;
  winRate: number;
  profit_total?: number;
}

export interface SystemSetting {
    key: string;
    value: string;
}

// Master Data for Items
export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_tradable: boolean;
  type?: 'item' | 'part'; // 아이템 구분용 타입 추가
  stock?: number; // 재고 관리용 추가
}

// User Inventory linking to Item
export interface InventoryItem extends Item {
  quantity: number; // Derived from join
  obtained_at?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: string;
  content: string;
  coinChange: number | null;
  result?: 'win' | 'loss' | 'neutral';
}

export interface DailyCheck {
  date: string;
  checked: boolean;
}

// Unified Profile Interface (Maps to 'profiles' table)
export interface CharacterProfile {
  id: string; // auth.uid
  email?: string; // from auth or profiles
  name_kr: string; // name
  name_en: string; // englishName
  age?: number;
  role: string; // position
  quote: string;
  appearance?: string;
  height?: string;
  weight?: string;
  personality?: string;
  etc?: string;
  belongings?: string[]; 
  relationships?: string;
  
  // Images
  image_url: string;       // 3:4 크롭된 대표 이미지
  full_image_url?: string; // [추가됨] 원본 전신 이미지 (상세 페이지용)
  
  // System fields
  coin: number;
  rank: number;
  isAdmin?: boolean;
  status: 'active' | 'banned' | 'inactive' | string; 
  
  created_at?: string;
  
  // Derived stats (can be calculated or joined)
  winRate?: number;
  gamePlays?: number;

  // ✅ Added for Radio Broadcast System
  radio_message?: string | null;
}

export interface ShopItem extends Item {
    // Extends Item for display purposes
}

export interface CasinoGame {
  id: string;
  name: string;
  type: 'slot' | 'highlow' | 'roulette' | 'blackjack';
  description: string;
  minBet: number;
  active: boolean;
  winRateProbability?: number;
}

export interface RankingEntry {
  id: string;
  name: string;
  value: string | number;
  avatarUrl: string;
  rank: number;
  change?: 'up' | 'down' | 'same';
}

export interface Broadcast {
  id: string;
  message: string;
  target_user_id: string | null;
  created_at: string;
  sender: string;
  profiles?: {
      name_kr: string;
      role: string;
      image_url: string;
  }
}

// ROULETTE TYPES
export type RouletteStatus = 'WAITING' | 'SPINNING' | 'COMPLETED';
export type BetType = 'NUMBER' | 'COLOR' | 'PARITY';

export interface RouletteRound {
  id: string;
  status: RouletteStatus;
  result_number: number | null;
  result_color: 'RED' | 'BLACK' | 'GREEN' | null;
  dealer_message: string;
  created_at: string;
}

export interface RouletteBet {
  id: string;
  round_id: string;
  user_id: string;
  user_name: string;
  bet_type: BetType;
  bet_value: string;
  amount: number;
}

// CRAFTING TYPES
export interface Recipe {
    id: string;
    ingredients: string[]; // item IDs or names (legacy)
    result_item_name: string;
    fail_item_name: string;
    critical_item_name?: string; 
    success_rate: number;
    critical_rate?: number; 
}

// EXPLORATION TYPES
export interface ExplorationNode {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    x_pos: number;
    y_pos: number;
    daily_limit_cost: number;
}

export interface ExplorationOutcome {
    id: string;
    node_id: string;
    result_type: 'coin' | 'item' | 'text' | 'trap';
    result_value: string;
    script_text: string;
    probability: number;
}