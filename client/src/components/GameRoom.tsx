import type { PlanningPokerCard } from '../types';
import type { useGame } from '../hooks/useGame';
import PlayerList from './PlayerList';
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{roomName}</h1>
              <span className={`game-state-indicator ${
                currentRoom?.gameState === 'revealed' ? 'game-state-revealed' : 'game-state-selecting'
              }`}>
                {currentRoom?.gameState === 'revealed' ? '📊 카드 공개됨' : '🎯 카드 선택 중'}
              </span>
            </div>
            <p className="text-gray-600">방 ID: {roomId} | 사용자: {userName}</p>
          </div>
          <button
            onClick={onLeave}
            className="btn btn-secondary"
          >
            방 나가기
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 카드 선택 영역 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                카드 선택
              </h2>
              <div className="text-sm text-gray-500">
                {currentRoom?.gameState === 'revealed' ? '카드 변경 가능' : '카드를 선택하세요'}
              </div>
            </div>
            
            <div className="card-grid">
              {cards.map((card) => {
                const isSelected = game.isCardSelected(card);
                const isDisabled = game.loading || !currentRoom || (currentRoom.gameState !== 'selecting' && currentRoom.gameState !== 'revealed');
                
                return (
                  <button
                    key={card}
                    className={`planning-card group h-20 flex items-center justify-center ${
                      isSelected ? 'selected' : ''
                    } ${getCardSpecialClass(card)} ${
                      game.loading && isSelected ? 'animate-pulse-soft' : ''
                    }`}
                    onClick={() => game.selectCard(card)}
                    disabled={isDisabled}
                    title={isDisabled ? 
                      `현재 ${currentRoom?.gameState === 'revealed' ? '공개' : '선택'} 상태가 아닙니다` : 
                      `${card} 포인트 선택`
                    }
                  >
                    <span className="planning-card-content">
                      {card}
                    </span>
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-20 rounded-xl">
                        <div className="w-6 h-6 border-2 border-primary-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* 카드 선택 가이드 */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              {currentRoom?.gameState === 'selecting' && (
                <p>💡 원하는 스토리 포인트 카드를 선택하세요</p>
              )}
              {currentRoom?.gameState === 'revealed' && (
                <p>🔄 공개된 후에도 카드를 변경할 수 있습니다</p>
              )}
            </div>
          </div>
        </div>

        {/* 참여자 목록 및 상태 */}
        <div className="space-y-6">
          {/* 참여자 목록 */}
          <PlayerList 
            users={users}
            currentUserId={game.currentUser?.id}
            gameState={currentRoom?.gameState || 'selecting'}
          />

          {/* 게임 상태 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              게임 상태
            </h3>
            <div className="space-y-4">
              {/* 진행률 요약 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">선택 완료:</span>
                <span className="font-medium text-gray-900">
                  {selectedUsers}/{totalUsers}명 
                  <span className="text-primary-600 ml-1">
                    ({selectedPercentage.toFixed(0)}%)
                  </span>
                </span>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${selectedPercentage}%` }}
                ></div>
              </div>

              {/* 대기 중인 사용자 표시 */}
              {currentRoom?.gameState === 'selecting' && selectedUsers < totalUsers && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-medium text-amber-800 mb-2">
                    🕐 대기 중인 참여자 ({totalUsers - selectedUsers}명)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {users
                      .filter(user => !user.selectedCard)
                      .map(user => (
                        <span 
                          key={user.id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full"
                        >
                          {user.name}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* 모든 선택 완료 시 알림 */}
              {currentRoom?.gameState === 'selecting' && selectedUsers === totalUsers && totalUsers > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                    ✅ 모든 참여자가 카드를 선택했습니다!
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    이제 카드를 공개할 수 있습니다.
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="grid grid-cols-1 gap-2">
                <button 
                  className="btn btn-success w-full" 
                  disabled={!game.canRevealCards || game.loading}
                  onClick={game.revealCards}
                >
                  {game.loading ? '처리중...' : '카드 공개'}
                </button>
                <button 
                  className="btn btn-secondary w-full"
                  onClick={game.resetRound}
                  disabled={game.loading}
                >
                  라운드 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 게임 결과 표시 */}
      {game.gameResult && (
        <div className="mt-8">
          <GameResult 
            users={users}
            gameResult={game.gameResult}
            onNewRound={game.resetRound}
          />
        </div>
      )}

      {/* 에러 표시 */}
      {game.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
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