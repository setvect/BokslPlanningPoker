import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../../../shared/constants';

interface TypingJoinRoomProps {
  roomId: string;
  roomName: string;
  onJoin: (playerName: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export function TypingJoinRoom({
  roomId,
  roomName,
  onJoin,
  onCancel,
  loading,
  error,
}: TypingJoinRoomProps) {
  const [playerName, setPlayerName] = useState('');

  // 저장된 이름 로드
  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      // 이름 저장
      localStorage.setItem(STORAGE_KEYS.USER_NAME, playerName.trim());
      onJoin(playerName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-200 dark:border-dark-600">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          타자 게임 방 참여
        </h2>

        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">참여할 방</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{roomName}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              닉네임
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="input"
              maxLength={7}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading || !playerName.trim()}
            >
              {loading ? '참여 중...' : '참여하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
