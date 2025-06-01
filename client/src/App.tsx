import { useState } from 'react'
import MainPage from '@components/MainPage'
import JoinRoom from '@components/JoinRoom'
import GameRoom from '@components/GameRoom'

// 앱의 주요 상태
export type AppState = 'main' | 'join' | 'game'

interface GameInfo {
  roomId: string
  roomName: string
  userName: string
}

function App() {
  const [appState, setAppState] = useState<AppState>('main')
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)

  // 메인 페이지로 돌아가기
  const handleBackToMain = () => {
    setAppState('main')
    setGameInfo(null)
  }

  // 방 생성
  const handleCreateRoom = (roomName: string) => {
    // UUID 간단 구현 (실제로는 서버에서 생성)
    const roomId = Math.random().toString(36).substr(2, 9)
    setAppState('join')
    setGameInfo({
      roomId,
      roomName,
      userName: ''
    })
  }

  // 방 입장 시도
  const handleJoinRoom = (roomId: string, roomName: string) => {
    setAppState('join')
    setGameInfo({
      roomId,
      roomName: roomName || `방 ${roomId}`,
      userName: ''
    })
  }

  // 게임 시작 (이름 입력 후)
  const handleStartGame = (userName: string) => {
    if (gameInfo) {
      setGameInfo({
        ...gameInfo,
        userName
      })
      setAppState('game')
    }
  }

  // 상태에 따른 컴포넌트 렌더링
  const renderCurrentView = () => {
    switch (appState) {
      case 'main':
        return (
          <MainPage
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        )
      
      case 'join':
        return (
          <JoinRoom
            roomId={gameInfo?.roomId || ''}
            roomName={gameInfo?.roomName || ''}
            onBack={handleBackToMain}
            onJoin={handleStartGame}
          />
        )
      
      case 'game':
        return gameInfo ? (
          <GameRoom
            roomId={gameInfo.roomId}
            roomName={gameInfo.roomName}
            userName={gameInfo.userName}
            onLeave={handleBackToMain}
          />
        ) : null
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {renderCurrentView()}
      </div>
    </div>
  )
}

export default App 