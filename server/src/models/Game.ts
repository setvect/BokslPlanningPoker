import { Room, User, GameState, GameResult, PlanningPokerCard, DeckType } from '../../../shared/types';



// 게임 클래스 (기본적인 게임 로직만 포함)
export class Game {
  constructor(public room: Room) {}

  // 게임 상태 변경
  updateGameState(newState: GameState): void {
    this.room.gameState = newState;
    this.room.lastActivity = new Date().toISOString();
  }

  // 카드를 숫자로 변환 (덱 타입에 관계없이 동일한 로직)
  private convertCardToNumber(card: PlanningPokerCard): number | null {
    // 특수 카드 제외
    if (card === '?' || card === '커피') {
      return null;
    }

    // 1/2와 0.5 처리
    if (card === '1/2' || card === '0.5') {
      return 0.5;
    }

    const num = parseFloat(card);
    return isNaN(num) ? null : num;
  }

  // 게임 결과 계산
  calculateResult(): GameResult {
    const totalUsers = this.room.users.length;
    const votedUsers = this.room.users.filter(user => user.selectedCard).length;

    const cards: { [userId: string]: any } = {};
    this.room.users.forEach(user => {
      if (user.selectedCard) {
        cards[user.id] = user.selectedCard;
      }
    });

    // 숫자 카드만 평균 계산에 포함
    const numericCards = Object.values(cards)
      .map(card => this.convertCardToNumber(card as PlanningPokerCard))
      .filter((num): num is number => num !== null);

    const average = numericCards.length > 0
      ? Math.round((numericCards.reduce((a, b) => a + b, 0) / numericCards.length) * 100) / 100
      : null;

    return {
      totalUsers,
      votedUsers,
      cards,
      average,
      validVotes: numericCards.length
    };
  }

  // 라운드 초기화
  resetRound(): void {
    this.room.users.forEach(user => {
      delete user.selectedCard;
    });
    this.updateGameState(GameState.SELECTING);
  }

  // 게임 완료 여부 확인
  isComplete(): boolean {
    return this.room.users.length > 0 && 
           this.room.users.every(user => user.selectedCard);
  }
} 