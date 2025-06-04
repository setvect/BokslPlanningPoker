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
    <div className={`${className}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">🎯</span>
        <h3 className="text-xl font-semibold text-gray-900">게임 결과</h3>
      </div>

      {/* 평균값 및 참여율 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 평균 포인트 */}
        <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-2">평균 포인트</div>
          <div className="text-4xl font-bold text-blue-700 mb-2">
            {gameResult.average !== null ? gameResult.average.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-blue-500">
            {gameResult.average !== null ? `${participatedUsers}명의 숫자 투표 기준` : '숫자 투표 없음'}
          </div>
        </div>

        {/* 참여율 */}
        <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-2">참여율</div>
          <div className="text-4xl font-bold text-green-700 mb-2">
            {participationRate.toFixed(0)}%
          </div>
          <div className="text-sm text-green-500">
            {participatedUsers}/{totalUsers}명 참여
          </div>
        </div>
      </div>
    </div>
  );
} 