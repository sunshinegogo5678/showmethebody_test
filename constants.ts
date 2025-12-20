
import { CharacterProfile, GameStat, InventoryItem, LogEntry, DailyCheck, ShopItem, CasinoGame, RankingEntry, Recipe } from './types';

export const DEFAULT_AVATAR_URL = '/default_avatar.png';

export const MOCK_PROFILE: CharacterProfile = {
  id: "user_graham_001",
  name_kr: "그라함 골드윈",
  name_en: "Graham Goldwin",
  quote: "운이란 준비된 자가 기회를 만났을 때 생기는 것이다.",
  image_url: "https://picsum.photos/400/600",
  coin: 12500,
  role: "멀티 스페셜리스트",
  rank: 1,
  isAdmin: true,
  status: 'active',
  age: 32,
  height: "190",
  weight: "건장함",
  appearance: "언제나 완벽한 핏의 수트를 착용한다. 날카로운 눈매가 특징.",
  personality: "계산적이고 냉철하지만, 필요할 때는 매력적인 미소를 짓는다.",
  belongings: [
      "골동품 회중시계 - 11시 11분에 멈춰있음",
      "은제 인장 반지 - 가문의 문장이 새겨짐",
      "행운의 지포 라이터 - 낡았지만 불은 잘 붙는다"
  ],
  relationships: "알려진 바 없음.",
  etc: "보안 승인 레벨 5."
};

export const MOCK_GAME_STATS: GameStat[] = [
  { name: "포춘 슬롯", plays: 10, wins: 4, winRate: 40 },
  { name: "블랙잭", plays: 2, wins: 1, winRate: 50 },
  { name: "로얄 룰렛", plays: 5, wins: 3, winRate: 60 },
  { name: "하이 / 로우", plays: 1, wins: 0, winRate: 0 },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: "행운의 칩", quantity: 1, description: "슬롯머신에서 좋은 결과가 나올 것 같은 칩.", price: 100, rarity: 'common', is_tradable: true },
  { id: '2', name: "VIP 라운지 패스", quantity: 1, description: "고액 베팅 구역에 입장할 수 있는 출입증.", price: 500, rarity: 'epic', is_tradable: false },
  { id: '3', name: "황금 시가 커터", quantity: 1, description: "순금으로 도금된 커터. 장식용이다.", price: 300, rarity: 'rare', is_tradable: true },
  { id: '4', name: "낡은 회중시계", quantity: 1, description: "전당포에 맡기면 꽤 받을 것 같다.", price: 50, rarity: 'common', is_tradable: true },
  { id: '5', name: "마티니 글래스", quantity: 2, description: "승리를 자축하기 위한 잔.", price: 20, rarity: 'common', is_tradable: true },
  { id: '6', name: "트럼프 카드", quantity: 5, description: "카지노 표준 규격 카드덱.", price: 10, rarity: 'common', is_tradable: true },
  { id: '7', name: "빈 리볼버", quantity: 1, description: "위협용으로 쓸만하다.", price: 1000, rarity: 'epic', is_tradable: false },
  { id: '8', name: "의문의 쪽지", quantity: 3, description: "암호가 적혀있는 종이 조각.", price: 0, rarity: 'rare', is_tradable: true },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: '2023-10-22 14:30', category: 'Game', content: '슬롯 머신 잭팟 당첨', coinChange: 5000, result: 'win' },
  { id: '2', timestamp: '2023-10-22 15:10', category: 'Shop', content: '최고급 위스키 구매', coinChange: -200, result: 'neutral' },
  { id: '3', timestamp: '2023-10-23 09:00', category: 'System', content: '일일 출석 보너스', coinChange: 100, result: 'win' },
  { id: '4', timestamp: '2023-10-23 11:45', category: 'Game', content: '하이/로우 3라운드 패배', coinChange: -500, result: 'loss' },
  { id: '5', timestamp: '2023-10-23 13:00', category: 'Trade', content: '"은열쇠" 아이템 교환', coinChange: null, result: 'neutral' },
  { id: '6', timestamp: '2023-10-24 20:20', category: 'Game', content: '블랙잭 내추럴 승리', coinChange: 1500, result: 'win' },
  { id: '7', timestamp: '2023-10-24 21:00', category: 'Misc', content: '딜러 팁 지불', coinChange: -50, result: 'neutral' },
  { id: '8', timestamp: '2023-10-24 22:15', category: 'Game', content: '룰렛 Red 7 적중', coinChange: 300, result: 'win' },
];

export const MOCK_CHECKS: DailyCheck[] = [
  { date: '10/22', checked: true },
  { date: '10/23', checked: true },
  { date: '10/24', checked: true },
  { date: '10/25', checked: false },
  { date: '10/26', checked: false },
  { date: '10/27', checked: false },
  { date: '10/28', checked: false },
];

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  { id: '1', name: "빈티지 샴페인", description: "1920년대 산 최고급 샴페인. 사기(Morale)를 높여준다.", price: 500, rarity: 'common', is_tradable: true },
  { id: '2', name: "순금 칩", description: "묵직한 순금 칩. 고액 베팅 시 화폐로 사용된다.", price: 5000, rarity: 'epic', is_tradable: true },
  { id: '3', name: "미스터리 박스", description: "무엇이 들어있을지 모르는 상자.", price: 1000, rarity: 'rare', is_tradable: true },
  { id: '4', name: "블랙 수트", description: "이탈리아 장인이 만든 수트. 카리스마를 높여준다.", price: 2500, rarity: 'rare', is_tradable: true },
  { id: '5', name: "조작된 주사위", description: "주의해서 사용해야 한다. 승률을 소폭 높여준다.", price: 8000, rarity: 'legendary', is_tradable: true },
];

const generateMembers = (): CharacterProfile[] => {
    const roles = ['현장 요원', '사설 은행가', '재무 관리자', '작전 팀장', '카드 딜러', '보안 책임자', '정보 상인', '하이 롤러'];
    const quotes = [
        '흔들지 말고, 저어서.', '피눈물을 흘리게 될 거야.', '돈이 곧 나 자신이다.', '우리는 그림자 속에 산다.', 
        '인생은 올인이야.', '운도 실력이지.', '아무도 믿지 마라.', '결국엔 하우스가 이긴다.'
    ];
    const bases = [
        { name: '제임스 본드', en: 'James Bond', desc: '탁월한 능력을 가진 요원.' },
        { name: '르 쉬프르', en: 'Le Chiffre', desc: '수학적 천재이자 사설 은행가.' },
        { name: '베스퍼 린드', en: 'Vesper Lynd', desc: '날카로운 지성을 가진 재무부 요원.' },
        { name: '말로리', en: 'Mallory', desc: '작전의 총책임자. 엄격하고 유능하다.' },
        { name: '오릭 골드핑거', en: 'Auric Goldfinger', desc: '금에 집착하는 거부.' }
    ];

    return bases.map((base, index) => ({
        id: (index + 2).toString(),
        name_kr: base.name,
        name_en: base.en,
        role: roles[index % roles.length],
        rank: index + 2,
        image_url: `https://picsum.photos/seed/${base.en.replace(/\s/g,'')}/400/800`,
        coin: Math.floor(Math.random() * 50000),
        status: 'active',
        quote: quotes[index % quotes.length],
        age: 30 + index,
        appearance: "항상 흐트러짐 없는 정장 차림.",
        personality: "냉철하고 계산적이지만 필요할 땐 사교적이다.",
        belongings: ["맞춤 정장", "빈티지 라이터", "암호화된 스마트폰"],
        relationships: "지하 조직과 연루되어 있다는 소문이 있다.",
        etc: base.desc,
        gamePlays: Math.floor(Math.random() * 500) + 20,
        winRate: Math.floor(Math.random() * 60) + 30
    }));
};

export const MOCK_MEMBERS: CharacterProfile[] = generateMembers();

export const MOCK_GAMES: CasinoGame[] = [
    { id: '1', name: "포춘 슬롯", type: 'slot', description: "트리플 7의 행운을 시험해보세요.", minBet: 10, active: true, winRateProbability: 35 },
    { id: '2', name: "하이 / 로우", type: 'highlow', description: "다음 카드의 숫자를 예측하세요.", minBet: 100, active: true, winRateProbability: 50 },
    { id: '3', name: "로얄 룰렛", type: 'roulette', description: "운명의 수레바퀴를 돌리세요.", minBet: 50, active: true, winRateProbability: 48 },
    { id: '4', name: "블랙잭", type: 'blackjack', description: "딜러와의 숨막히는 21 싸움.", minBet: 200, active: true, winRateProbability: 45 },
];

export const MOCK_RANKINGS = {
  wealth: [
    { id: '1', name: '르 쉬프르', value: '2,500,000', avatarUrl: 'https://picsum.photos/seed/LeChiffre/100/100', rank: 1, change: 'same' },
    { id: '2', name: '제임스 본드', value: '1,850,000', avatarUrl: 'https://picsum.photos/seed/JamesBond/100/100', rank: 2, change: 'up' },
    { id: '3', name: '베스퍼 린드', value: '1,200,000', avatarUrl: 'https://picsum.photos/seed/VesperLynd/100/100', rank: 3, change: 'down' },
    { id: '4', name: '오릭 골드핑거', value: '950,000', avatarUrl: 'https://picsum.photos/seed/AuricGoldfinger/100/100', rank: 4, change: 'up' }, 
    { id: '5', name: '미스터 화이트', value: '880,000', avatarUrl: 'https://picsum.photos/seed/MrWhite/100/100', rank: 5, change: 'same' },
  ] as RankingEntry[],
  gambler: [
    { id: '5', name: '오릭 골드핑거', value: '520회', avatarUrl: 'https://picsum.photos/seed/AuricGoldfinger/100/100', rank: 1, change: 'up' },
    { id: '6', name: '닥터 노', value: '480회', avatarUrl: 'https://picsum.photos/seed/DrNo/100/100', rank: 2, change: 'same' },
    { id: '7', name: '미스터 화이트', value: '310회', avatarUrl: 'https://picsum.photos/seed/MrWhite/100/100', rank: 3, change: 'up' },
    { id: '8', name: '르 쉬프르', value: '295회', avatarUrl: 'https://picsum.photos/seed/LeChiffre/100/100', rank: 4, change: 'down' },
    { id: '9', name: '제임스 본드', value: '210회', avatarUrl: 'https://picsum.photos/seed/JamesBond/100/100', rank: 5, change: 'up' },
  ] as RankingEntry[],
  lucky: [
    { id: '10', name: '죠스', value: '잭팟 x3', avatarUrl: 'https://picsum.photos/seed/Jaws/100/100', rank: 1, change: 'up' },
    { id: '12', name: 'Q', value: '잭팟 x1', avatarUrl: 'https://picsum.photos/seed/Quartermaster/100/100', rank: 2, change: 'same' },
    { id: '13', name: '펠릭스 라이터', value: '잭팟 x1', avatarUrl: 'https://picsum.photos/seed/Felix/100/100', rank: 3, change: 'up' },
    { id: '14', name: '머니페니', value: '고배당', avatarUrl: 'https://picsum.photos/seed/Moneypenny/100/100', rank: 4, change: 'down' },
    { id: '15', name: '태너', value: '고배당', avatarUrl: 'https://picsum.photos/seed/Tanner/100/100', rank: 5, change: 'same' },
  ] as RankingEntry[]
};

export const MOCK_RECIPES: Recipe[] = [
    {
        id: 'r1',
        ingredients: ['트럼프 카드', '빈 리볼버', '행운의 칩'],
        result_item_name: '암살자의 키트',
        fail_item_name: '찢어진 카드',
        critical_item_name: '황금 총',
        success_rate: 60,
        critical_rate: 10
    },
    {
        id: 'r2',
        ingredients: ['마티니 글래스', '최고급 위스키', '의문의 쪽지'],
        result_item_name: '정보원의 칵테일',
        fail_item_name: '깨진 유리조각',
        success_rate: 80
    },
    {
        id: 'r3',
        ingredients: ['의문의 쪽지', '의문의 쪽지', '의문의 쪽지'],
        result_item_name: '비밀 지도',
        fail_item_name: '구겨진 종이뭉치',
        critical_item_name: '마스터 키',
        success_rate: 30,
        critical_rate: 20
    }
];
