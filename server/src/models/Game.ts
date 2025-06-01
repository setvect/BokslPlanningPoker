// 플래닝 포커 카드 덱 정의
export const PLANNING_POKER_CARDS = [
  '0', '1/2', '1', '2', '3', '5', '8', '13', 
  '20', '40', '60', '100', '?', '커피'
] as const;

export type PlanningPokerCard = typeof PLANNING_POKER_CARDS[number];

// 게임 설정
export interface GameConfig {
  maxRooms: number;           // 최대 방 개수
  maxUsersPerRoom: number;    // 방당 최대 사용자 수
  roomCleanupInterval: number; // 방 정리 주기 (분)
  roomInactiveTimeout: number; // 방 비활성 타임아웃 (분)
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxRooms: 10,
  maxUsersPerRoom: 20,
  roomCleanupInterval: 5,
  roomInactiveTimeout: 60
};

// 게임 통계
export interface GameStats {
  totalRooms: number;
  totalUsers: number;
  activeRooms: number;
  averageUsersPerRoom: number;
}

// 카드 관련 유틸리티
export class CardUtils {
  /**
   * 카드가 유효한 플래닝 포커 카드인지 확인
   */
  static isValidCard(card: string): card is PlanningPokerCard {
    return PLANNING_POKER_CARDS.includes(card as PlanningPokerCard);
  }
  
  /**
   * 카드가 숫자 카드인지 확인 (평균 계산에 포함되는 카드)
   */
  static isNumericCard(card: string): boolean {
    if (card === '1/2') return true;
    if (card === '?' || card === '커피') return false;
    
    const num = parseFloat(card);
    return !isNaN(num) && num >= 0;
  }
  
  /**
   * 카드를 숫자로 변환 (평균 계산용)
   */
  static cardToNumber(card: string): number | null {
    if (card === '1/2') return 0.5;
    if (card === '?' || card === '커피') return null;
    
    const num = parseFloat(card);
    return isNaN(num) ? null : num;
  }
  
  /**
   * 카드 배열의 평균 계산
   */
  static calculateAverage(cards: string[]): number | null {
    const numericValues = cards
      .map(card => this.cardToNumber(card))
      .filter((num): num is number => num !== null);
    
    if (numericValues.length === 0) return null;
    
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const average = sum / numericValues.length;
    
    // 소수점 2자리까지 반올림
    return Math.round(average * 100) / 100;
  }
  
  /**
   * 카드 선택 분포 계산
   */
  static getCardDistribution(cards: string[]): { [card: string]: number } {
    const distribution: { [card: string]: number } = {};
    
    cards.forEach(card => {
      distribution[card] = (distribution[card] || 0) + 1;
    });
    
    return distribution;
  }
}

// 게임 이벤트 타입
export interface GameEvent {
  type: string;
  timestamp: Date;
  roomId?: string;
  userId?: string;
  data?: any;
}

export enum GameEventType {
  ROOM_CREATED = 'room_created',
  ROOM_DELETED = 'room_deleted',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CARD_SELECTED = 'card_selected',
  CARDS_REVEALED = 'cards_revealed',
  ROUND_RESET = 'round_reset'
} 