// 타입 정의 export
export * from './types';

// Socket.io 이벤트 및 타입 export
export * from './socket-events';

// 상수 정의 export
export * from './constants';

// 버전 정보
export const SHARED_VERSION = '1.0.0';

// 유틸리티 함수들 (실제 사용되는 것만)
export const Utils = {
  /**
   * 카드가 숫자 카드인지 확인
   */
  isNumericCard: (card: string): boolean => {
    if (card === '1/2') return true;
    if (card === '?' || card === '커피') return false;
    
    const num = parseFloat(card);
    return !isNaN(num) && num >= 0;
  },
  
  /**
   * 카드를 숫자로 변환
   */
  cardToNumber: (card: string): number | null => {
    if (card === '1/2') return 0.5;
    if (card === '?' || card === '커피') return null;
    
    const num = parseFloat(card);
    return isNaN(num) ? null : num;
  },
  
  /**
   * 카드 배열의 평균 계산
   */
  calculateAverage: (cards: string[]): number | null => {
    const numericValues = cards
      .map(card => Utils.cardToNumber(card))
      .filter((num): num is number => num !== null);
    
    if (numericValues.length === 0) return null;
    
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const average = sum / numericValues.length;
    
    // 소수점 2자리까지 반올림
    return Math.round(average * 100) / 100;
  },
  
  /**
   * 사용자 이름 유효성 검사
   */
  validateUserName: (name: string): boolean => {
    if (!name || name.trim().length === 0) return false;
    if (name.length > 20) return false;
    return true;
  },
  
  /**
   * 방 이름 유효성 검사
   */
  validateRoomName: (name: string): boolean => {
    if (!name || name.trim().length === 0) return false;
    if (name.length > 50) return false;
    return true;
  },
  
  /**
   * 중복된 이름에 번호 추가
   */
  generateUniqueName: (originalName: string, existingNames: string[]): string => {
    let uniqueName = originalName;
    let counter = 2;
    
    while (existingNames.includes(uniqueName)) {
      uniqueName = `${originalName}(${counter})`;
      counter++;
    }
    
    return uniqueName;
  },
  
  /**
   * 간단한 UUID 생성
   */
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },
};

// 타입 가드 함수들 (실제 사용되는 것만)
export const TypeGuards = {
  /**
   * PlanningPokerCard 타입 가드
   */
  isPlanningPokerCard: (card: any): boolean => {
    const validCards = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100', '?', '커피'];
    return typeof card === 'string' && validCards.includes(card);
  },
  
  /**
   * GameState 타입 가드
   */
  isGameState: (state: any): boolean => {
    const validStates = ['selecting', 'revealed', 'finished'];
    return typeof state === 'string' && validStates.includes(state);
  },
}; 