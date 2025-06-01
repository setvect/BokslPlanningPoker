import { useState } from 'react'

interface MainPageProps {
  onCreateRoom: (roomName: string) => void
  onJoinRoom: (roomId: string, roomName: string) => void
}

export default function MainPage({ onCreateRoom, onJoinRoom }: MainPageProps) {
  const [roomName, setRoomName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim()) {
      onCreateRoom(roomName.trim())
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinRoomId.trim()) {
      onJoinRoom(joinRoomId.trim(), '')
    }
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* 헤더 */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          🃏 플래닝 포커
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-6">
          실시간 협업 스프린트 플래닝 도구
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            🚀 로그인 불필요
          </span>
          <span className="flex items-center gap-1">
            🔄 실시간 동기화
          </span>
          <span className="flex items-center gap-1">
            📱 모든 기기 지원
          </span>
        </div>
      </div>

      {/* 액션 카드들 */}
      <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* 방 생성 */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200 hover:border-primary-400 transition-colors">
          <div className="text-4xl mb-4">🏠</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            새 방 만들기
          </h2>
          <p className="text-gray-600 mb-6">
            새로운 플래닝 포커 세션을 시작하세요
          </p>
          
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <input
              type="text"
              placeholder="방 이름을 입력하세요"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="input"
              maxLength={50}
              required
            />
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!roomName.trim()}
            >
              방 만들기
            </button>
          </form>
        </div>

        {/* 방 참여 */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200 hover:border-primary-400 transition-colors">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            방 참여하기
          </h2>
          <p className="text-gray-600 mb-6">
            기존 플래닝 포커 세션에 참여하세요
          </p>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <input
              type="text"
              placeholder="방 ID를 입력하세요"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="input"
              maxLength={20}
              required
            />
            <button
              type="submit"
              className="btn btn-secondary w-full"
              disabled={!joinRoomId.trim()}
            >
              방 참여하기
            </button>
          </form>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
          📖 사용법
        </h3>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div>
            <div className="text-2xl mb-3">1️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-2">방 생성 또는 참여</h4>
            <p className="text-gray-600 text-sm">
              새 방을 만들거나 기존 방의 ID로 참여하세요
            </p>
          </div>
          <div>
            <div className="text-2xl mb-3">2️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-2">카드 선택</h4>
            <p className="text-gray-600 text-sm">
              스토리 포인트 카드를 선택하여 추정값을 입력하세요
            </p>
          </div>
          <div>
            <div className="text-2xl mb-3">3️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-2">결과 확인</h4>
            <p className="text-gray-600 text-sm">
              모든 팀원의 선택이 완료되면 결과와 평균을 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Made with ❤️ for Agile Teams</p>
      </div>
    </div>
  )
} 