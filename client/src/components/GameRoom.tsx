interface GameRoomProps {
  roomId: string
  roomName: string
  userName: string
  onLeave: () => void
}

export default function GameRoom({ roomId, roomName, userName, onLeave }: GameRoomProps) {
  // 플래닝 포커 카드 덱
  const cards = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100', '?', '커피']

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
                  className="planning-card h-20 flex items-center justify-center text-lg font-semibold"
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
              참여자 (1명)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{userName}</span>
                <span className="user-status online">온라인</span>
              </div>
            </div>
          </div>

          {/* 게임 상태 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              게임 상태
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                선택 완료: 0/1명
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <button className="btn btn-success w-full" disabled>
                카드 공개
              </button>
              <button className="btn btn-secondary w-full">
                라운드 초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 임시 안내 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-yellow-800 font-medium">개발 중</span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          현재 기본 UI만 구현되어 있습니다. Socket.io 연결 및 실제 게임 로직은 다음 단계에서 구현됩니다.
        </p>
      </div>
    </div>
  )
} 