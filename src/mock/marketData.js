// src/mock/marketData.js
// 투자 정보 플랫폼에서 사용하는 목업 데이터입니다.
// 데이터는 각 섹션에서 간단하게 가져다 쓰기 쉽도록 구조화되어 있습니다.

// 주요 시장 지수 데이터
export const marketIndices = [
  {
    id: 1,
    name: 'S&P 500',
    value: '5,289.42',
    change: '+2.45%',
    isPositive: true,
    icon: '📈',
  },
  {
    id: 2,
    name: '나스닥',
    value: '16,543.88',
    change: '+1.89%',
    isPositive: true,
    icon: '📊',
  },
  {
    id: 3,
    name: '다우존스',
    value: '38,902.14',
    change: '-0.52%',
    isPositive: false,
    icon: '📉',
  },
  {
    id: 4,
    name: '코스피',
    value: '2,748.29',
    change: '+1.23%',
    isPositive: true,
    icon: '🇰🇷',
  },
];

// 암호화폐 시세 데이터
export const cryptoPrices = [
  {
    id: 1,
    name: 'Bitcoin',
    symbol: 'BTC',
    price: '$64,250',
    change: '+5.32%',
    isPositive: true,
    image: '🪙',
  },
  {
    id: 2,
    name: 'Ethereum',
    symbol: 'ETH',
    price: '$3,450',
    change: '+3.21%',
    isPositive: true,
    image: '💎',
  },
  {
    id: 3,
    name: 'Ripple',
    symbol: 'XRP',
    price: '$2.85',
    change: '-1.45%',
    isPositive: false,
    image: '💫',
  },
];

// 미국 주식 데이터
export const usStocks = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple',
    price: '$189.45',
    change: '+2.15%',
    isPositive: true,
    description: '기술 기업 대표주',
  },
  {
    id: 2,
    symbol: 'GOOGL',
    name: 'Google',
    price: '$142.80',
    change: '+1.92%',
    isPositive: true,
    description: '검색 및 광고 플랫폼',
  },
  {
    id: 3,
    symbol: 'MSFT',
    name: 'Microsoft',
    price: '$423.56',
    change: '-0.75%',
    isPositive: false,
    description: 'AI 기술 선도 기업',
  },
  {
    id: 4,
    symbol: 'TSLA',
    name: 'Tesla',
    price: '$242.18',
    change: '+4.38%',
    isPositive: true,
    description: '전기자동차 제조사',
  },
];

// 뉴스 데이터
export const newsList = [
  {
    id: 1,
    title: 'Fed, 기준금리 유지 결정... 경기 둔화 우려',
    summary: '연방준비제도가 기준금리를 현 수준에서 유지하기로 결정했습니다.',
    category: '경제',
    time: '2시간 전',
    importance: 'high',
  },
  {
    id: 2,
    title: 'Apple, Q2 실적 기대 이상... 주가 상승',
    summary: 'Apple의 분기 실적이 시장 예상을 초과했습니다.',
    category: '기업',
    time: '4시간 전',
    importance: 'high',
  },
  {
    id: 3,
    title: '비트코인, 70,000달러 돌파 시도',
    summary: '암호화폐 시장이 강세를 보이고 있습니다.',
    category: '암호화폐',
    time: '6시간 전',
    importance: 'medium',
  },
  {
    id: 4,
    title: '삼성전자, 신형 반도체 공정 개발 완료',
    summary: '삼성전자가 최신 반도체 공정을 성공적으로 개발했습니다.',
    category: '기업',
    time: '8시간 전',
    importance: 'medium',
  },
  {
    id: 5,
    title: '미국 실업률 3.5% 기록... 고용 시장 견조',
    summary: '최근 발표된 실업률 통계가 예상치를 하회했습니다.',
    category: '경제',
    time: '10시간 전',
    importance: 'low',
  },
];

// 인기 커뮤니티 글 데이터
export const communityPosts = [
  {
    id: 1,
    author: '투자의신',
    title: '초보자를 위한 주식 투자 시작 가이드',
    views: '12.5K',
    likes: '2.3K',
    comments: 156,
    category: '초보자',
    score: 98,
  },
  {
    id: 2,
    author: '코인마스터',
    title: '2024년 주목할 암호화폐 5개 분석',
    views: '8.9K',
    likes: '1.8K',
    comments: 124,
    category: '암호화폐',
    score: 87,
  },
  {
    id: 3,
    author: '배당금사냥꾼',
    title: '배당금 높은 미국 주식 포트폴리오 구성',
    views: '6.2K',
    likes: '1.2K',
    comments: 89,
    category: '투자전략',
    score: 76,
  },
  {
    id: 4,
    author: '펀드애널리스트',
    title: 'ETF vs 개별주식, 어떤 것을 선택해야 할까?',
    views: '5.8K',
    likes: '1.1K',
    comments: 95,
    category: '투자전략',
    score: 72,
  },
  {
    id: 5,
    author: '단타고수',
    title: '기술적 분석으로 수익 내는 방법',
    views: '9.3K',
    likes: '2.1K',
    comments: 178,
    category: '트레이딩',
    score: 92,
  },
];
