import React from 'react';
import type { PlanningPokerCard } from '../types';
import { FaCoffee } from 'react-icons/fa';

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCard: PlanningPokerCard | null;
  onSelectCard: (card: PlanningPokerCard) => void;
  loading: boolean;
}

export default function CardSelectionModal({ 
  isOpen, 
  onClose, 
  selectedCard, 
  onSelectCard, 
  loading 
}: CardSelectionModalProps) {
  // 플래닝 포커 카드 덱
  const cards: PlanningPokerCard[] = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '60', '100', '?', '커피'];

  // 카드별 특수 스타일 클래스 반환
  const getCardSpecialClass = (card: PlanningPokerCard) => {
    switch (card) {
      case '?':
        return 'planning-card-question';
      case '커피':
        return 'planning-card-coffee';
      case '100':
        return 'planning-card-infinity';
      default:
        return '';
    }
  };

  // 카드 내용 렌더링 함수
  const renderCardContent = (card: PlanningPokerCard) => {
    if (card === '커피') {
      return <FaCoffee className="text-amber-600 text-3xl" />;
    }
    return card;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto scrollbar-thin border border-gray-200 dark:border-dark-600">
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              스토리 포인트 선택
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* 카드 선택 영역 */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card) => {
              const isSelected = selectedCard === card;
              
              return (
                <button
                  key={card}
                  className={`planning-card ${
                    isSelected ? 'selected' : ''
                  } ${getCardSpecialClass(card)} aspect-[3/4] min-h-[4rem]`}
                  onClick={() => {
                    onSelectCard(card);
                    onClose();
                  }}
                  disabled={loading}
                  title={`${card} 포인트 선택`}
                >
                  <span className="planning-card-content">
                    {renderCardContent(card)}
                  </span>
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-20 rounded-xl">
                      <div className="w-4 h-4 border-2 border-primary-600 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-700 px-6 py-4 rounded-b-xl border-t border-gray-200 dark:border-dark-600">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              {selectedCard ? (
                <>
                  선택됨: {renderCardContent(selectedCard)}
                </>
              ) : (
                '카드를 선택하세요'
              )}
            </div>
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm"
              disabled={loading}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 