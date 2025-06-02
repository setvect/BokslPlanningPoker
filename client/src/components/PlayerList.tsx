import React from 'react';
import type { User } from '../types';

interface PlayerListProps {
  users: User[];
  currentUserId?: string;
  gameState: 'selecting' | 'revealed' | 'finished';
  className?: string;
}

export default function PlayerList({ users, currentUserId, gameState, className = '' }: PlayerListProps) {
  // 사용자 상태별 정렬 (온라인 > 카드 선택 완료 > 오프라인)
  const sortedUsers = [...users].sort((a, b) => {
    // 현재 사용자를 맨 위에
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    
    // 온라인 상태 우선
    if (a.isConnected && !b.isConnected) return -1;
    if (!a.isConnected && b.isConnected) return 1;
    
    // 카드 선택 상태 우선
    if (a.selectedCard && !b.selectedCard) return -1;
    if (!a.selectedCard && b.selectedCard) return 1;
    
    return 0;
  });

  // 사용자 아바타 생성 (이름의 첫 글자)
  const getAvatarText = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // 아바타 색상 생성 (이름 기반 해시)
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // 사용자 상태 정보
  const getUserStatusInfo = (user: User) => {
    if (!user.isConnected) {
      return {
        icon: '⚫',
        text: '오프라인',
        className: 'text-gray-400',
        badgeClassName: 'bg-gray-100 text-gray-600'
      };
    }
    
    if (user.selectedCard) {
      return {
        icon: '✅',
        text: '선택완료',
        className: 'text-green-600',
        badgeClassName: 'bg-green-100 text-green-700'
      };
    }
    
    return {
      icon: '⏳',
      text: '선택중',
      className: 'text-blue-600',
      badgeClassName: 'bg-blue-100 text-blue-700'
    };
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          참여자 ({users.length}명)
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-green-600">✅</span>
          <span>{users.filter(u => u.selectedCard).length}</span>
          <span>/</span>
          <span>{users.length}</span>
        </div>
      </div>

      {/* 참여자 목록 */}
      <div className="max-h-96 overflow-hidden">
        <div className="overflow-y-auto max-h-full scrollbar-thin">
          {sortedUsers.map((user, index) => {
            const statusInfo = getUserStatusInfo(user);
            const isCurrentUser = user.id === currentUserId;
            
            return (
              <div
                key={user.id}
                className={`group relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 mb-2 sm:mb-3 rounded-lg transition-all duration-200 ${
                  isCurrentUser 
                    ? 'bg-primary-50 border border-primary-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* 아바타 */}
                <div className={`
                  relative flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm
                  ${getAvatarColor(user.name)} ${user.isConnected ? '' : 'opacity-50'}
                  ${isCurrentUser ? 'avatar-pulse' : ''}
                  transition-all duration-200 group-hover:scale-110
                `}>
                  {getAvatarText(user.name)}
                  
                  {/* 온라인 상태 표시 */}
                  <div className={`
                    absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white
                    ${user.isConnected ? 'bg-green-400' : 'bg-gray-400'}
                    transition-all duration-200
                  `} />
                </div>

                {/* 사용자 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <span className={`font-medium truncate text-sm sm:text-base ${
                      isCurrentUser ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {user.name}
                    </span>
                    {isCurrentUser && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        나
                      </span>
                    )}
                  </div>
                  
                  {/* 카드 선택 정보 (공개 상태일 때만) */}
                  {gameState === 'revealed' && user.selectedCard && (
                    <div className="text-xs text-gray-500">
                      <span className="hidden sm:inline">선택한 카드: </span>
                      <span className="font-mono font-bold text-gray-700">{user.selectedCard}</span>
                    </div>
                  )}
                </div>

                {/* 상태 표시 */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <span className={`text-sm sm:text-lg ${statusInfo.className} transition-all duration-200`}>
                    {statusInfo.icon}
                  </span>
                  <span className={`
                    hidden md:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${statusInfo.badgeClassName} transition-all duration-200
                  `}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* 빈 상태 */}
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>아직 참여자가 없습니다</p>
              <p className="text-sm mt-1">방 ID를 공유해서 친구들을 초대하세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 요약 통계 */}
      {users.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{users.length}</div>
              <div className="text-xs text-gray-500">총 참여자</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {users.filter(u => u.isConnected).length}
              </div>
              <div className="text-xs text-gray-500">온라인</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {users.filter(u => u.selectedCard).length}
              </div>
              <div className="text-xs text-gray-500">선택완료</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 