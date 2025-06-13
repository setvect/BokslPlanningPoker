import { Room, User, GameState, GameResult } from '../../../shared/types';



// 게임 클래스 (기본적인 게임 로직만 포함)
export class Game {
  constructor(public room: Room) {}

  // 게임 상태 변경
  updateGameState(newState: GameState): void {
    this.room.gameState = newState;
    this.room.lastActivity = new Date().toISOString();
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
      .filter(card => {
        if (card === '1/2') return true;
        if (card === '?' || card === '커피') return false;
        return !isNaN(parseFloat(card));
      })
      .map(card => card === '1/2' ? 0.5 : parseFloat(card));

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