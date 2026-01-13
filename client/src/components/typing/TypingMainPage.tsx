import { useState, useEffect, useCallback } from 'react';
import { useTypingGame } from '../../hooks/useTypingGame';
import { TypingCreateRoom } from './TypingCreateRoom';
import { TypingRoomList } from './TypingRoomList';
import { TypingJoinRoom } from './TypingJoinRoom';
import { TypingGameRoom } from './TypingGameRoom';
import { ThemeToggle } from '../ThemeToggle';
import type { TypingRoomListItem } from '../../../../shared/types';

export function TypingMainPage() {
  const game = useTypingGame();

  // 상태
  const [roomList, setRoomList] = useState<TypingRoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 방 참여 모달 상태
  const [joiningRoom, setJoiningRoom] = useState<{ id: string; name: string } | null>(null);

  // 방 목록 로드
  const loadRoomList = useCallback(async () => {
    if (!game.isConnected) {
      return;
    }

    try {
      setRefreshing(true);
      const rooms = await game.getRoomList();
      setRoomList(rooms);
    } catch (error) {
      console.error('방 목록 로드 실패:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.isConnected]);

  // 컴포넌트 마운트 시 방 목록 로드
  useEffect(() => {
    if (game.isConnected) {
      loadRoomList();
    }
  }, [game.isConnected, loadRoomList]);

  // 2초마다 방 목록 자동 새로고침
  useEffect(() => {
    if (!game.isConnected || game.roomId) {
      return;
    }

    const interval = setInterval(() => {
      loadRoomList();
    }, 2000);

    return () => clearInterval(interval);
  }, [game.isConnected, game.roomId, loadRoomList]);

  // 방 생성
  const handleCreateRoom = async (roomName: string, playerName: string) => {
    try {
      await game.createRoom(roomName, playerName);
    } catch (error) {
      console.error('방 생성 실패:', error);
    }
  };

  // 방 참여 시작
  const handleStartJoin = (roomId: string, roomName: string) => {
    setJoiningRoom({ id: roomId, name: roomName });
  };

  // 방 참여 완료
  const handleJoinRoom = async (playerName: string) => {
    if (!joiningRoom) {
      return;
    }

    try {
      await game.joinRoom(joiningRoom.id, playerName);
      setJoiningRoom(null);
    } catch (error) {
      console.error('방 참여 실패:', error);
    }
  };

  // 방 참여 취소
  const handleCancelJoin = () => {
    setJoiningRoom(null);
    game.clearError();
  };

  // 방 나가기
  const handleLeaveRoom = async () => {
    await game.leaveRoom();
    loadRoomList();
  };

  // 게임 중이면 게임 화면 표시
  if (game.roomId) {
    return <TypingGameRoom game={game} onLeave={handleLeaveRoom} />;
  }

  // 메인 화면
  return (
    <div className="min-h-screen flex items-start justify-center pt-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-900 dark:to-dark-800">
      {/* 화면 우측 상단 고정 컨트롤 버튼들 */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-50">
        {/* 테마 토글 버튼 */}
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto text-center w-full p-5">
        {/* 헤더 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            천하제일 타자대회
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            천하를 호령하는 타자의 고수가 되어보세요!
          </p>
        </div>

        {/* 연결 상태 표시 */}
        {game.isConnecting && (
          <div className="mb-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">서버에 연결 중...</p>
          </div>
        )}

        {!game.isConnected && !game.isConnecting && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <span className="text-red-800 dark:text-red-300 font-medium">연결 오류</span>
            </div>
            <p className="text-red-700 dark:text-red-400 text-sm">서버에 연결할 수 없습니다.</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {game.error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <span className="text-red-800 dark:text-red-300 font-medium">오류</span>
            </div>
            <p className="text-red-700 dark:text-red-400 text-sm">{game.error}</p>
            <button
              onClick={game.clearError}
              className="text-red-600 dark:text-red-400 text-sm mt-2 underline"
            >
              오류 닫기
            </button>
          </div>
        )}

        {/* 액션 카드들 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* 방 생성 */}
          <TypingCreateRoom
            onCreate={handleCreateRoom}
            loading={game.loading}
            error={null}
          />

          {/* 활성 방 목록 */}
          <TypingRoomList
            rooms={roomList}
            loading={loading}
            onRefresh={loadRoomList}
            onJoinRoom={handleStartJoin}
            refreshing={refreshing}
          />
        </div>

        {/* 메인 페이지 링크 */}
        <div className="mt-8">
          <a
            href="/"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
          >
            ← 플래닝 포커로 돌아가기
          </a>
        </div>
      </div>

      {/* 방 참여 모달 */}
      {joiningRoom && (
        <TypingJoinRoom
          roomId={joiningRoom.id}
          roomName={joiningRoom.name}
          onJoin={handleJoinRoom}
          onCancel={handleCancelJoin}
          loading={game.loading}
          error={game.error}
        />
      )}
    </div>
  );
}
