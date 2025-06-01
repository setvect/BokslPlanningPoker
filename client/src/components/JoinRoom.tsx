import { useState } from 'react'

interface JoinRoomProps {
  roomId: string
  roomName: string
  onBack: () => void
  onJoin: (userName: string) => void
}

export default function JoinRoom({ roomId, roomName, onBack, onJoin }: JoinRoomProps) {
  const [userName, setUserName] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim()) {
      onJoin(userName.trim())
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-lg">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            방 입장
          </h1>
          <p className="text-gray-600">
            플래닝 포커 세션에 참여합니다
          </p>
        </div>

        {/* 방 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-1">방 정보</div>
          <div className="font-semibold text-gray-900">
            {roomName || `방 ${roomId}`}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            ID: {roomId}
          </div>
        </div>

        {/* 이름 입력 폼 */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              id="userName"
              type="text"
              placeholder="이름을 입력하세요"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="input"
              maxLength={20}
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              다른 참여자들에게 표시될 이름입니다
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="btn btn-secondary flex-1"
            >
              뒤로가기
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={!userName.trim()}
            >
              입장하기
            </button>
          </div>
        </form>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-lg">💡</span>
            <div className="text-sm text-blue-700">
              <strong>팁:</strong> 같은 이름이 있으면 자동으로 번호가 추가됩니다 (예: 김철수(2))
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 