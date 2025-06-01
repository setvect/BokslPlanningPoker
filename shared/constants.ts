import { PLANNING_POKER_CARDS } from './types';

// 게임 설정 상수
export const GAME_CONFIG = {
  // 방 관련
  MAX_ROOMS: 10,
  MAX_USERS_PER_ROOM: 20,
  MIN_USERS_FOR_GAME: 1,
  
  // 시간 제한 (분 단위)
  ROOM_INACTIVE_TIMEOUT: 60, // 1시간
  ROOM_CLEANUP_INTERVAL: 5,   // 5분마다 정리
  USER_DISCONNECT_TIMEOUT: 30, // 30초 후 사용자 제거
  
  // 재연결 설정
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 1000, // 1초
  
  // 입력 제한
  MAX_ROOM_NAME_LENGTH: 50,
  MAX_USER_NAME_LENGTH: 20,
  MIN_ROOM_NAME_LENGTH: 1,
  MIN_USER_NAME_LENGTH: 1,
  
  // 카드 관련
  CARDS: PLANNING_POKER_CARDS,
  NUMERIC_CARDS: ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100'],
  SPECIAL_CARDS: ['?', '커피'],
} as const;

// 에러 코드 상수
export const ERROR_CODES = {
  // 일반적인 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // 방 관련 에러
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_LIMIT_REACHED: 'ROOM_LIMIT_REACHED',
  INVALID_ROOM_NAME: 'INVALID_ROOM_NAME',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
  
  // 사용자 관련 에러
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_USER_NAME: 'INVALID_USER_NAME',
  DUPLICATE_USER_NAME: 'DUPLICATE_USER_NAME',
  USER_NOT_IN_ROOM: 'USER_NOT_IN_ROOM',
  
  // 게임 관련 에러
  INVALID_CARD: 'INVALID_CARD',
  CARD_ALREADY_SELECTED: 'CARD_ALREADY_SELECTED',
  GAME_NOT_IN_PROGRESS: 'GAME_NOT_IN_PROGRESS',
  CARDS_ALREADY_REVEALED: 'CARDS_ALREADY_REVEALED',
  INSUFFICIENT_PLAYERS: 'INSUFFICIENT_PLAYERS',
  
  // 연결 관련 에러
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED',
  RECONNECTION_FAILED: 'RECONNECTION_FAILED',
} as const;

// 에러 메시지 (한국어)
export const ERROR_MESSAGES = {
  [ERROR_CODES.INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
  [ERROR_CODES.INVALID_REQUEST]: '잘못된 요청입니다.',
  [ERROR_CODES.UNAUTHORIZED]: '인증이 필요합니다.',
  
  [ERROR_CODES.ROOM_NOT_FOUND]: '방을 찾을 수 없습니다.',
  [ERROR_CODES.ROOM_FULL]: '방이 가득찼습니다.',
  [ERROR_CODES.ROOM_LIMIT_REACHED]: '최대 방 개수에 도달했습니다.',
  [ERROR_CODES.INVALID_ROOM_NAME]: '올바르지 않은 방 이름입니다.',
  [ERROR_CODES.ALREADY_IN_ROOM]: '이미 방에 참여 중입니다.',
  
  [ERROR_CODES.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [ERROR_CODES.INVALID_USER_NAME]: '올바르지 않은 사용자 이름입니다.',
  [ERROR_CODES.DUPLICATE_USER_NAME]: '중복된 사용자 이름입니다.',
  [ERROR_CODES.USER_NOT_IN_ROOM]: '사용자가 방에 없습니다.',
  
  [ERROR_CODES.INVALID_CARD]: '올바르지 않은 카드입니다.',
  [ERROR_CODES.CARD_ALREADY_SELECTED]: '이미 카드를 선택했습니다.',
  [ERROR_CODES.GAME_NOT_IN_PROGRESS]: '게임이 진행 중이 아닙니다.',
  [ERROR_CODES.CARDS_ALREADY_REVEALED]: '카드가 이미 공개되었습니다.',
  [ERROR_CODES.INSUFFICIENT_PLAYERS]: '충분한 참여자가 없습니다.',
  
  [ERROR_CODES.CONNECTION_FAILED]: '연결에 실패했습니다.',
  [ERROR_CODES.SOCKET_DISCONNECTED]: '연결이 끊어졌습니다.',
  [ERROR_CODES.RECONNECTION_FAILED]: '재연결에 실패했습니다.',
} as const;

// URL 관련 상수
export const URLS = {
  // API 엔드포인트
  API_BASE: '/api',
  HEALTH_CHECK: '/health',
  STATS: '/api/stats',
  
  // 클라이언트 라우트
  HOME: '/',
  ROOM: '/room/:id',
  JOIN: '/join/:id',
  
  // Socket.io 경로
  SOCKET_PATH: '/socket.io',
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_NAME: 'planning_poker_user_name',
  LAST_ROOM: 'planning_poker_last_room',
  USER_PREFERENCES: 'planning_poker_preferences',
  RECONNECT_TOKEN: 'planning_poker_reconnect_token',
} as const;

// UI 관련 상수
export const UI_CONFIG = {
  // 애니메이션 지속 시간 (ms)
  ANIMATION_DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // 토스트 알림 지속 시간 (ms)
  TOAST_DURATION: {
    SUCCESS: 3000,
    WARNING: 4000,
    ERROR: 5000,
    INFO: 3000,
  },
  
  // 폴링 간격 (ms)
  POLLING_INTERVAL: {
    ROOM_STATUS: 5000,   // 5초
    USER_STATUS: 3000,   // 3초
    STATS: 10000,        // 10초
  },
  
  // 반응형 브레이크포인트 (px)
  BREAKPOINTS: {
    MOBILE: 320,
    TABLET: 768,
    DESKTOP: 1920,
  },
  
  // 최대 표시 개수
  MAX_DISPLAY: {
    RECENT_ROOMS: 5,
    NOTIFICATIONS: 10,
    CHAT_MESSAGES: 50,
  },
} as const;

// 환경별 설정
export const ENV_CONFIG = {
  DEVELOPMENT: {
    SOCKET_URL: 'http://localhost:3001',
    LOG_LEVEL: 'debug',
    ENABLE_DEBUG: true,
  },
  PRODUCTION: {
    SOCKET_URL: process.env.SOCKET_URL || '',
    LOG_LEVEL: 'error',
    ENABLE_DEBUG: false,
  },
} as const;

// 정규식 패턴
export const PATTERNS = {
  ROOM_ID: /^[a-zA-Z0-9]{3,20}$/,
  USER_NAME: /^[가-힣a-zA-Z0-9\s]{1,20}$/,
  ROOM_NAME: /^.{1,50}$/,
} as const;

// 도움말 및 안내 메시지
export const HELP_MESSAGES = {
  ROOM_NAME: '방 이름은 1-50자 사이여야 합니다.',
  USER_NAME: '이름은 1-20자 사이여야 합니다.',
  ROOM_ID: '방 ID는 3-20자의 영문, 숫자 조합이어야 합니다.',
  CARD_SELECTION: '추정하고 싶은 스토리 포인트 카드를 선택하세요.',
  REVEAL_CARDS: '모든 참여자가 카드를 선택하면 공개할 수 있습니다.',
  RESET_ROUND: '새로운 스토리를 추정하려면 라운드를 초기화하세요.',
} as const; 