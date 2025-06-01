import { useState, useCallback, useEffect } from 'react';
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

// URL에서 방ID 추출
const getRoomIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/room\/([A-Z0-9]{3,20})$/);
  return match ? match[1] : null;
};

// URL 변경 (히스토리 관리)
const updateUrl = (roomId?: string): void => {
  const newUrl = roomId ? `/room/${roomId}` : '/';
  window.history.pushState({}, '', newUrl);
};

function App() {
  console.log('App 컴포넌트 시작');
  
  const [appState, setAppState] = useState<AppState>('main');
  const [pendingRoomData, setPendingRoomData] = useState<{
    roomId: string;
    roomName: string;
  } | null>(null);

  const game = useGame();
  
  console.log('App 상태:', { 
    appState, 
    isConnected: game.isConnected, 
    isConnecting: game.isConnecting,
    socketError: game.socketError,
    loading: game.loading 
  });

  // 페이지 로드 시 URL에서 방ID 확인 및 자동 입장
  useEffect(() => {
    if (!game.isConnected || game.isConnecting) return;
    
    const roomId = getRoomIdFromUrl();
    if (!roomId || game.room) return; // URL에 방ID가 없거나 이미 방에 있으면 무시
    
    console.log('🔍 URL에서 방ID 발견:', roomId);
    
    const savedUserName = getSavedUserName();
    if (savedUserName) {
      // 저장된 사용자 이름으로 바로 입장 시도
      game.joinRoom(roomId, savedUserName)
        .then(() => {
          console.log('✅ URL 방 자동 입장 성공:', roomId);
          setAppState('game');
        })
        .catch((error) => {
          console.log('❌ URL 방 입장 실패:', error.message);
          // 방이 존재하지 않으면 메인으로 이동
          updateUrl(); // URL을 메인(/)으로 변경
          setAppState('main');
        });
    } else {
      // 사용자 이름이 없으면 입력 화면으로
      setPendingRoomData({ roomId, roomName: '' });
      setAppState('join');
    }
  }, [game.isConnected, game.isConnecting, game.room]);

  // 방 생성 핸들러
  const handleCreateRoom = useCallback(async (roomName: string) => {
    const savedUserName = getSavedUserName();
    if (savedUserName) {
      try {
        const roomId = await game.createRoom(roomName, savedUserName);
        if (roomId) {
          updateUrl(roomId); // URL을 /room/{roomId}로 변경
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
          updateUrl(roomId); // URL을 /room/{roomId}로 변경
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
        updateUrl(pendingRoomData.roomId); // URL 업데이트
      } else {
        // 새 방 생성
        const roomId = await game.createRoom(pendingRoomData.roomName, userName);
        if (roomId) {
          updateUrl(roomId); // URL 업데이트
        }
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
    updateUrl(); // URL을 메인(/)으로 변경
    setAppState('main');
    game.clearError();
  }, [game]);

  // 방 나가기 핸들러
  const handleLeaveRoom = useCallback(async () => {
    try {
      await game.leaveRoom();
      updateUrl(); // URL을 메인(/)으로 변경
      setAppState('main');
    } catch (error) {
      console.error('방 나가기 실패:', error);
      // 에러가 발생해도 메인으로 이동
      updateUrl(); // URL을 메인(/)으로 변경
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
          game={game}
        />
      );

    default:
      return null;
  }
}

export default App; 