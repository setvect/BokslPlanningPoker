import React from 'react';
import type { User, GameResult as GameResultType } from '../types';

interface GameResultProps {
  users: User[];
  gameResult: GameResultType;
  onNewRound: () => void;
  className?: string;
}

export default function GameResult({ users, gameResult, onNewRound, className = '' }: GameResultProps) {
  // 통계 계산
  const totalUsers = users.length;
  const participatedUsers = users.filter(user => user.selectedCard).length;
  const participationRate = totalUsers > 0 ? (participatedUsers / totalUsers) * 100 : 0;

  return (
    <div className={`${className} flex items-center justify-center h-full`}>
      {/* 평균값 및 참여율 - 한 줄 배치 */}
      <div className="flex gap-4 w-full max-w-md">
        {/* 평균 포인트 */}
        <div className="flex-1 text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">평균 포인트</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
            {gameResult.average !== null ? gameResult.average.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-400">
            {gameResult.average !== null ? `${participatedUsers}명 기준` : '숫자 투표 없음'}
          </div>
        </div>

        {/* 참여율 */}
        <div className="flex-1 text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">참여율</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
            {participationRate.toFixed(0)}%
          </div>
          <div className="text-xs text-green-500 dark:text-green-400">
            {participatedUsers}/{totalUsers}명 참여
          </div>
        </div>
      </div>
    </div>
  );
}  