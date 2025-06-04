import type { PlanningPokerCard } from '../types';
import type { useGame } from '../hooks/useGame';
import GameResult from './GameResult';
import CardSelectionModal from './CardSelectionModal';
import { useState } from 'react';

interface GameRoomProps {
  roomId: string
  roomName: string
  userName: string
  onLeave: () => void
  game: ReturnType<typeof useGame>
}

export default function GameRoom({ roomId, roomName, userName, onLeave, game }: GameRoomProps) {
  // 카드 선택 모달 상태
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

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

  // 바둑판식 그리드 컬럼 수 계산
  const getGridColumns = (total: number) => {
    if (total <= 4) return 2;      // 2x2
    if (total <= 9) return 3;      // 3x3
    if (total <= 12) return 4;     // 4x3 (12명까지)
    return 5;                      // 5열 (13명부터)
  };

  const gridColumns = getGridColumns(totalUsers);

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
        {/* 바둑판식 참여자 카드 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center mb-3 p-4">
          {/* 참여자 카드 그리드 */}
          <div 
            className="grid gap-6 mb-6 w-full max-w-4xl"
            style={{ 
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
            }}
          >
            {users.map((user, index) => {
              const isCurrentUser = user.id === game.currentUser?.id;
              
              // 카드 상태에 따른 클래스 결정
              let cardClass = 'player-card-large';
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
              
              return (
                <div key={user.id} className="flex flex-col items-center">
                  <div className="relative">
                    <div 
                      className={cardClass}
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
                    
                    {/* 수정 아이콘 (본인 카드만, 결과 공개 후에만) */}
                    {isCurrentUser && currentRoom?.gameState === 'revealed' && (
                      <button
                        onClick={() => setIsCardModalOpen(true)}
                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600 transition-colors shadow-md"
                        title="카드 선택/수정"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  
                  {/* 참여자 이름 */}
                  <div className={`player-name-large ${isCurrentUser ? 'current-user' : 'other-user'} mt-3`}>
                    {user.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 중앙 액션 버튼 */}
          <div className="mb-4">
            {currentRoom?.gameState === 'selecting' ? (
              <button 
                className={`px-6 py-3 text-base font-semibold bg-success-600 text-white rounded-lg shadow-md hover:bg-success-700 transition-colors ${!game.canRevealCards || game.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!game.canRevealCards || game.loading}
                onClick={game.revealCards}
              >
                {game.loading ? '공개 중...' : '공개'}
              </button>
            ) : (
              <button 
                className={`px-6 py-3 text-base font-semibold bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors ${game.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={game.resetRound}
                disabled={game.loading}
              >
                {game.loading ? '초기화 중...' : '새 라운드'}
              </button>
            )}
          </div>
        </div>

        {/* 하단 영역: 게임 결과 (공개 후) - 패딩 최적화 */}
        <div className="bg-white rounded-xl p-4 shadow-lg min-h-[280px] flex flex-col">
          {/* 게임 결과 우선 표시 (공개 후) */}
          {game.gameResult && currentRoom?.gameState === 'revealed' ? (
            <div className="flex-1 flex flex-col justify-center">
              <GameResult 
                users={users}
                gameResult={game.gameResult}
                onNewRound={game.resetRound}
              />
            </div>
          ) : (
            /* 카드 선택 영역 (선택 중 또는 기본) */
            <div className="flex-1 flex flex-col">
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
              <div className="overflow-x-auto pb-1 flex-1 flex flex-col justify-center">
                <div className="flex gap-2 min-w-max px-1 justify-center">
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
            </div>
          )}
        </div>
      </div>

      {/* 카드 선택 모달 */}
      <CardSelectionModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        selectedCard={game.currentUser?.selectedCard || null}
        onSelectCard={game.selectCard}
        loading={game.loading}
      />

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