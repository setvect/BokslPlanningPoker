import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../../../shared/constants';

interface TypingCreateRoomProps {
  onCreate: (roomName: string, playerName: string) => void;
  loading: boolean;
  error: string | null;
}

export function TypingCreateRoom({ onCreate, loading, error }: TypingCreateRoomProps) {
  const [roomName, setRoomName] = useState('');
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
    if (roomName.trim() && playerName.trim()) {
      // 이름 저장
      localStorage.setItem(STORAGE_KEYS.USER_NAME, playerName.trim());
      onCreate(roomName.trim(), playerName.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-dark-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
      <div className="text-4xl mb-4">⌨️</div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        게임 방 만들기
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="방 이름을 입력하세요"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="input"
          maxLength={50}
          required
        />
        <input
          type="text"
          placeholder="닉네임을 입력하세요"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="input"
          maxLength={7}
          required
        />

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!roomName.trim() || !playerName.trim() || loading}
        >
          {loading ? '생성 중...' : '방 만들기'}
        </button>
      </form>
    </div>
  );
}
