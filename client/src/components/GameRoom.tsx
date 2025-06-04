import type { PlanningPokerCard } from '../types';
import type { useGame } from '../hooks/useGame';
import GameResult from './GameResult';

interface GameRoomProps {
  roomId: string
  roomName: string
  userName: string
  onLeave: () => void
  game: ReturnType<typeof useGame>
}

export default function GameRoom({ roomId, roomName, userName, onLeave, game }: GameRoomProps) {
  // 플래닝 포커 카드 덱
  const cards: PlanningPokerCard[] = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100', '?', '커피'];

  console.log('🔍 GameRoom 렌더링:', {
    room: game.room,
    users: game.room?.users,
    usersCount: game.room?.users?.length
  });

  // 실제 방 데이터 사용
  const currentRoom = game.room;
  const users = currentRoom?.users || [];
  const totalUsers = users.length;
  const selectedUsers = users.filter(user => user.selectedCard).length;
  const selectedPercentage = totalUsers > 0 ? (selectedUsers / totalUsers) * 100 : 0;

  // 카드별 특수 스타일 클래스 반환
  const getCardSpecialClass = (card: PlanningPokerCard) => {
    switch (card) {
      case '?':
        return 'planning-card-question';
      case '커피':
        return 'planning-card-coffee';
      case '100':
        return 'planning-card-infinity';
      default:
        return '';
    }
  };

  // 직사각형 테이블 참여자 위치 계산
  const getPlayerPosition = (index: number, total: number) => {
    const tableWidth = 200;
    const tableHeight = 120;
    const margin = 40; // 테이블에서 카드까지의 거리
    
    // 직사각형 둘레를 따라 균등 배치
    const perimeter = (tableWidth + tableHeight) * 2;
    const segmentLength = perimeter / total;
    const currentPosition = segmentLength * index;
    
    let x = 0, y = 0;
    
    if (currentPosition <= tableWidth) {
      // 상단
      x = currentPosition - tableWidth / 2;
      y = -(tableHeight / 2 + margin);
    } else if (currentPosition <= tableWidth + tableHeight) {
      // 우측
      x = tableWidth / 2 + margin;
      y = (currentPosition - tableWidth) - tableHeight / 2;
    } else if (currentPosition <= tableWidth * 2 + tableHeight) {
      // 하단
      x = (tableWidth * 2 + tableHeight - currentPosition) - tableWidth / 2;
      y = tableHeight / 2 + margin;
    } else {
      // 좌측
      x = -(tableWidth / 2 + margin);
      y = (tableWidth * 2 + tableHeight * 2 - currentPosition) - tableHeight / 2;
    }
    
    return { x, y };
  };

  // 참여자 수에 따른 동적 스타일 계산
  const getContainerSize = () => {
    return {
      width: Math.max(320, 280 + totalUsers * 5),
      height: Math.max(240, 200 + totalUsers * 3)
    };
  };

  const containerSize = getContainerSize();

  // 참여자 카드 크기 동적 조정 - 전체적으로 더 작게
  const getPlayerCardClass = (baseClass: string) => {
    if (totalUsers <= 4) {
      return `${baseClass} scale-75`; // 기본 크기도 축소
    } else if (totalUsers <= 8) {
      return `${baseClass} scale-65`; // 더 작게
    } else {
      return `${baseClass} scale-55`; // 훨씬 더 작게
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen flex flex-col">
      {/* 헤더 - 여백 최적화 */}
      <div className="bg-white rounded-xl p-3 shadow-lg mb-3">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{roomName}</h1>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              선택: {selectedUsers}/{totalUsers}
            </span>
          </div>
          <button
            onClick={onLeave}
            className="btn btn-secondary text-sm px-3 py-1.5 flex-shrink-0"
          >
            나가기
          </button>
        </div>
      </div>

      {/* 메인 게임 영역 - 여백 최적화 */}
      <div className="flex-1 flex flex-col">
        {/* 직사각형 테이블 + 참여자 영역 - 여백 축소 */}
        <div className="flex-1 flex items-center justify-center mb-3">
          {/* 참여자 컨테이너 - 직사각형 기반 */}
          <div className="relative" style={{ 
            width: `${containerSize.width}px`,
            height: `${containerSize.height}px`
          }}>
            
            {/* 중앙 직사각형 테이블 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border-4 border-emerald-200 shadow-lg rounded-xl w-50 h-30" style={{width: '200px', height: '120px'}}>
                {/* 테이블 중앙 액션 버튼 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {currentRoom?.gameState === 'selecting' ? (
                    <button 
                      className={`px-3 py-1.5 text-sm font-semibold bg-success-600 text-white rounded-lg shadow-md hover:bg-success-700 transition-colors ${!game.canRevealCards || game.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!game.canRevealCards || game.loading}
                      onClick={game.revealCards}
                    >
                      {game.loading ? '공개 중...' : 'Reveal'}
                    </button>
                  ) : (
                    <button 
                      className={`px-3 py-1.5 text-sm font-semibold bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors ${game.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={game.resetRound}
                      disabled={game.loading}
                    >
                      {game.loading ? '초기화 중...' : 'New Round'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 참여자들을 테이블 둘레에 배치 */}
            {users.map((user, index) => {
              const position = getPlayerPosition(index, totalUsers);
              const isCurrentUser = user.id === game.currentUser?.id;
              
              // 카드 상태에 따른 클래스 결정
              let cardClass = 'player-card';
              if (currentRoom?.gameState === 'revealed' && user.selectedCard) {
                cardClass += ' revealed';
              } else if (user.selectedCard) {
                cardClass += ' selected';
              } else {
                cardClass += ' waiting';
              }
              
              if (isCurrentUser) {
                cardClass += ' current-user';
              }
              
              // 참여자 수에 따른 크기 조정 적용
              const finalCardClass = getPlayerCardClass(cardClass);
              
              return (
                <div
                  key={user.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                  }}
                >
                  {/* 참여자 카드 */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={finalCardClass}
                      title={`${user.name}${user.selectedCard ? ` - ${user.selectedCard}` : ' - 카드 미선택'}`}
                    >
                      {currentRoom?.gameState === 'revealed' && user.selectedCard ? (
                        user.selectedCard
                      ) : user.selectedCard ? (
                        '🃏'
                      ) : (
                        '⏳'
                      )}
                    </div>
                    
                    {/* 참여자 이름 */}
                    <div className={`player-name ${isCurrentUser ? 'current-user' : 'other-user'} ${
                      totalUsers > 8 ? 'text-xs' : ''
                    }`}>
                      {user.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 영역: 카드 덱 (선택 중) 또는 게임 결과 (공개 후) - 패딩 최적화 */}
        <div className="bg-white rounded-xl p-4 shadow-lg">
          {currentRoom?.gameState === 'selecting' || currentRoom?.gameState === 'revealed' ? (
            <>
              {/* 카드 선택 덱 - 여백 최소화 */}
              <div className="text-center mb-2">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                  스토리 포인트 선택
                </h3>
                <p className="text-xs text-gray-500">
                  원하는 포인트 카드를 선택하세요
                </p>
              </div>
              
              {/* 가로 스크롤 카드 컨테이너 - 여백 최소화 */}
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max px-1">
                  {cards.map((card) => {
                    const isSelected = game.isCardSelected(card);
                    const isDisabled = game.loading || !currentRoom;
                    
                    return (
                      <button
                        key={card}
                        className={`planning-card flex-shrink-0 w-11 min-h-[3.5rem] ${
                          isSelected ? 'selected' : ''
                        } ${getCardSpecialClass(card)} ${
                          game.loading && isSelected ? 'animate-pulse-soft' : ''
                        }`}
                        onClick={() => game.selectCard(card)}
                        disabled={isDisabled}
                        title={isDisabled ? 
                          `현재 선택할 수 없습니다` : 
                          `${card} 포인트 선택`
                        }
                      >
                        <span className="planning-card-content text-sm">
                          {card}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-20 rounded-xl">
                            <div className="w-3 h-3 border-2 border-primary-600 rounded-full flex items-center justify-center">
                              <div className="w-1 h-1 bg-primary-600 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* 스크롤 힌트 - 여백 최소화 */}
                <div className="text-center mt-1">
                  <p className="text-xs text-gray-400">← 좌우로 스크롤하여 모든 카드 확인 →</p>
                </div>
              </div>
            </>
          ) : null}

          {/* 게임 결과 (공개 후) - 여백 최적화 */}
          {game.gameResult && currentRoom?.gameState === 'revealed' && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <GameResult 
                users={users}
                gameResult={game.gameResult}
                onNewRound={game.resetRound}
              />
            </div>
          )}
        </div>
      </div>

      {/* 에러 표시 - 여백 최적화 */}
      {game.error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800 font-medium">오류</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{game.error}</p>
          <button 
            onClick={game.clearError}
            className="text-red-600 text-sm mt-2 underline"
          >
            오류 닫기
          </button>
        </div>
      )}
    </div>
  )
} 