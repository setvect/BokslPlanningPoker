import { useState, useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'
import AboutModal from './AboutModal'
import { ThemeToggle } from './ThemeToggle'
import { InstallPrompt } from './InstallPrompt'
import type { Room } from '../../../shared/types'

interface MainPageProps {
  onCreateRoom: (roomName: string) => void
  onJoinRoom: (roomId: string, roomName: string) => void
  error?: string | null
  onClearError?: () => void
}

export default function MainPage({ onCreateRoom, onJoinRoom, error, onClearError }: MainPageProps) {
  const [roomName, setRoomName] = useState('')
  const [roomList, setRoomList] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const socket = useSocket()

  // 방 목록 로드
  const loadRoomList = async () => {
    try {
      setRefreshing(true)
      const rooms = await socket.getRoomList()
      setRoomList(rooms)
    } catch (error) {
      console.error('방 목록 로드 실패:', error)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 방 목록 로드
  useEffect(() => {
    if (socket.isConnected) {
      loadRoomList()
    }
  }, [socket.isConnected])

  // 10초마다 방 목록 자동 새로고침
  useEffect(() => {
    if (!socket.isConnected) return

    const interval = setInterval(() => {
      loadRoomList()
    }, 10000)

    return () => clearInterval(interval)
  }, [socket.isConnected])

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim()) {
      onCreateRoom(roomName.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-900 dark:to-dark-800">
      {/* 화면 우측 상단 고정 컨트롤 버튼들 */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-50">
        {/* 테마 토글 버튼 */}
        <ThemeToggle />
        
        {/* 정보 버튼 */}
        <button
          onClick={() => setShowAbout(true)}
          className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 bg-white dark:bg-dark-800 shadow-md border border-gray-200 dark:border-dark-600"
          title="복슬 플래닝 포커 정보"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div className="max-w-4xl mx-auto text-center w-full p-5">
        {/* 헤더 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🃏 복슬 플래닝 포커
          </h1>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <span className="text-red-800 dark:text-red-300 font-medium">오류</span>
            </div>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            {onClearError && (
              <button 
                onClick={onClearError}
                className="text-red-600 dark:text-red-400 text-sm mt-2 underline"
              >
                오류 닫기
              </button>
            )}
          </div>
        )}

        {/* 액션 카드들 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* 방 생성 */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-dark-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              새 방 만들기
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              플래닝 포커 방을 만들어보세요.
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

          {/* 활성 방 목록 */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-dark-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-4xl">📋</div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  활성 방 목록
                </h2>
              </div>
              <button
                onClick={loadRoomList}
                disabled={refreshing}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
                title="새로고침"
              >
                {refreshing ? '🔄' : '↻'}
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              현재 활성화된 플래닝 포커 세션에 참여하세요
            </p>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">로딩 중...</p>
              </div>
            ) : roomList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">현재 활성화된 방이 없습니다</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">새 방을 만들어보세요!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                {roomList.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors cursor-pointer"
                    onClick={() => onJoinRoom(room.id, room.name)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {room.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {room.users.length}명
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {room.gameState === 'selecting' ? (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                          선택
                        </span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                          공개됨
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 정보 모달 */}
      <AboutModal 
        isOpen={showAbout}
        onClose={() => setShowAbout(false)} 
      />
      
      {/* PWA 설치 프롬프트 */}
      <InstallPrompt />
    </div>
  )
} 