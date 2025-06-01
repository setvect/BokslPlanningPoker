import { useState, useCallback } from 'react';
import MainPage from './components/MainPage';
import JoinRoom from './components/JoinRoom';
import GameRoom from './components/GameRoom';
import { useGame } from './hooks/useGame';
import { STORAGE_KEYS } from '../../shared/constants.ts';
import type { AppState } from './types';

// 로컬 스토리지에서 사용자 이름 가져오기
const getSavedUserName = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  } catch {
    return '';
  }
};

// 로컬 스토리지에 사용자 이름 저장
const saveUserName = (userName: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
  } catch {
    // 로컬 스토리지 접근 실패 시 무시
  }
};

function App() {
  const [appState, setAppState] = useState<AppState>('main');
  const [pendingRoomData, setPendingRoomData] = useState<{
    roomId: string;
    roomName: string;
  } | null>(null);

  const game = useGame();

  // 방 생성 핸들러
  const handleCreateRoom = useCallback(async (roomName: string) => {
    const savedUserName = getSavedUserName();
    if (savedUserName) {
      try {
        const roomId = await game.createRoom(roomName, savedUserName);
        if (roomId) {
          setAppState('game');
        }
      } catch (error) {
        console.error('방 생성 실패:', error);
        // 사용자 이름 입력으로 이동
        setPendingRoomData({ roomId: '', roomName });
        setAppState('join');
      }
    } else {
      // 사용자 이름 입력으로 이동
      setPendingRoomData({ roomId: '', roomName });
      setAppState('join');
    }
  }, [game]);

  // 방 참여 핸들러 (메인 페이지에서)
  const handleJoinRoom = useCallback((roomId: string, roomName: string) => {
    const savedUserName = getSavedUserName();
    if (savedUserName) {
      // 바로 방 참여 시도
      game.joinRoom(roomId, savedUserName)
        .then(() => {
          setAppState('game');
        })
        .catch(() => {
          // 실패 시 사용자 이름 입력으로 이동
          setPendingRoomData({ roomId, roomName });
          setAppState('join');
        });
    } else {
      // 사용자 이름 입력으로 이동
      setPendingRoomData({ roomId, roomName });
      setAppState('join');
    }
  }, [game]);

  // 사용자 이름 입력 후 처리
  const handleJoinWithUserName = useCallback(async (userName: string) => {
    if (!pendingRoomData) return;

    try {
      saveUserName(userName);

      if (pendingRoomData.roomId) {
        // 기존 방 참여
        await game.joinRoom(pendingRoomData.roomId, userName);
      } else {
        // 새 방 생성
        await game.createRoom(pendingRoomData.roomName, userName);
      }
      
      setPendingRoomData(null);
      setAppState('game');
    } catch (error) {
      console.error('방 참여/생성 실패:', error);
      // 에러는 useGame에서 관리됨
    }
  }, [game, pendingRoomData]);

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    setPendingRoomData(null);
    setAppState('main');
    game.clearError();
  }, [game]);

  // 방 나가기 핸들러
  const handleLeaveRoom = useCallback(async () => {
    try {
      await game.leaveRoom();
      setAppState('main');
    } catch (error) {
      console.error('방 나가기 실패:', error);
      // 에러가 발생해도 메인으로 이동
      setAppState('main');
    }
  }, [game]);

  // 연결 상태 표시
  if (game.isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">서버에 연결 중...</p>
        </div>
      </div>
    );
  }

  // 연결 오류 표시
  if (!game.isConnected && game.socketError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">연결 오류</h2>
          <p className="text-red-600 mb-4">{game.socketError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

  // 게임 로딩 상태
  if (game.loading && appState === 'game') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">게임 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 화면 렌더링
  switch (appState) {
    case 'main':
      return (
        <MainPage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      );

    case 'join':
      if (!pendingRoomData) {
        setAppState('main');
        return null;
      }
      return (
        <JoinRoom
          roomId={pendingRoomData.roomId}
          roomName={pendingRoomData.roomName}
          onBack={handleBack}
          onJoin={handleJoinWithUserName}
        />
      );

    case 'game':
      if (!game.room || !game.currentUser) {
        setAppState('main');
        return null;
      }
      return (
        <GameRoom
          roomId={game.room.id}
          roomName={game.room.name}
          userName={game.currentUser.name}
          onLeave={handleLeaveRoom}
        />
      );

    default:
      return null;
  }
}

export default App; 