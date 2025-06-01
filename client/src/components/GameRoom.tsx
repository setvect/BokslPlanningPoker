import type { PlanningPokerCard } from '../types';
import type { useGame } from '../hooks/useGame';

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

  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{roomName}</h1>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              카드 선택
            </h2>
            
            <div className="card-grid">
              {cards.map((card) => (
                <button
                  key={card}
                  className={`planning-card h-20 flex items-center justify-center text-lg font-semibold ${
                    game.isCardSelected(card) ? 'selected' : ''
                  }`}
                  onClick={() => game.selectCard(card)}
                  disabled={game.loading || !currentRoom || (currentRoom.gameState !== 'selecting' && currentRoom.gameState !== 'revealed')}
                >
                  {card}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 참여자 목록 및 상태 */}
        <div className="space-y-6">
          {/* 참여자 목록 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              참여자 ({totalUsers}명)
            </h3>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.id === game.currentUser?.id && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">나</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user.selectedCard ? (
                      <span className="text-green-600 text-sm">✅ 선택완료</span>
                    ) : (
                      <span className="text-gray-400 text-sm">⏳ 선택중</span>
                    )}
                    <span className={`user-status ${user.isConnected ? 'online' : 'offline'}`}>
                      {user.isConnected ? '온라인' : '오프라인'}
                    </span>
                  </div>
                </div>
              ))}
              {totalUsers === 0 && (
                <div className="text-center text-gray-500 py-4">
                  참여자가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* 게임 상태 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              게임 상태
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                선택 완료: {selectedUsers}/{totalUsers}명
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${selectedPercentage}%` }}
                ></div>
              </div>
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

      {/* 게임 결과 표시 */}
      {game.gameResult && (
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">게임 결과</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">선택된 카드</h4>
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <span>{user.name}</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {user.selectedCard || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">통계</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>평균값:</span>
                  <span className="font-bold text-primary-600">
                    {game.gameResult.average !== null ? game.gameResult.average.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>유효 투표:</span>
                  <span>{game.gameResult.validVotes}/{game.gameResult.totalUsers}</span>
                </div>
              </div>
            </div>
          </div>
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