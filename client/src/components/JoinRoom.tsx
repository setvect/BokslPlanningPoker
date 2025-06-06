import { useState } from 'react'

interface JoinRoomProps {
  roomId: string
  roomName: string
  onBack: () => void
  onJoin: (userName: string) => void
  error?: string | null
  loading?: boolean
}

export default function JoinRoom({ roomId, roomName, onBack, onJoin, error, loading }: JoinRoomProps) {
  const [userName, setUserName] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim() && !loading) {
      onJoin(userName.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-dark-600">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              방 입장
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              플래닝 포커 세션에 참여합니다
            </p>
          </div>

          {/* 방 정보 */}
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">방 정보</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {roomName || `방 ${roomId}`}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ID: {roomId}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 dark:text-red-400">❌</span>
                <span className="text-red-800 dark:text-red-300 font-medium">방 참여 실패</span>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* 이름 입력 폼 */}
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                다른 참여자들에게 표시될 이름입니다
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                뒤로가기
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={!userName.trim() || loading}
              >
                {loading ? '입장 중...' : '입장하기'}
              </button>
            </div>
          </form>

          {/* 안내 */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 text-lg">💡</span>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>팁:</strong> 같은 이름이 있으면 자동으로 번호가 추가됩니다 (예: 복슬이(2))
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 