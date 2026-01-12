import { useEffect, useState, useRef } from 'react'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [clickCount, setClickCount] = useState(0)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 이미지 클릭 핸들러 (이스터에그)
  const handleImageClick = () => {
    setClickCount(prev => prev + 1)

    // 이전 타임아웃 클리어
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    // 1초 내에 5번 클릭하면 타자 게임으로 이동
    if (clickCount + 1 >= 5) {
      window.location.href = '/typing'
      return
    }

    // 1초 후 클릭 카운트 리셋
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0)
    }, 1000)
  }

  // 모달이 닫힐 때 클릭 카운트 리셋
  useEffect(() => {
    if (!isOpen) {
      setClickCount(0)
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [isOpen])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl p-8 max-w-md w-full relative shadow-lg border-2 border-gray-200 dark:border-dark-600">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl"
          title="닫기"
        >
          ✕
        </button>

        {/* 앱 정보 */}
        <div className="flex items-start gap-6 mb-6">
          {/* 앱 아이콘 (5번 클릭 시 타자 게임 이스터에그) */}
          <div className="flex-shrink-0">
            <img
              src="/images/about.png"
              alt="복슬 플래닝 포커"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-dark-600 cursor-pointer select-none"
              onClick={handleImageClick}
              draggable={false}
            />
          </div>

          {/* 앱 정보 */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              복슬 플래닝 포커
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Version Ver. 1.0.0 (2025. 06. 05)
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              팀과 함께 효율적으로 스토리 포인트를 추정하는
              실시간 협업 플래닝 포커 도구입니다.
            </p>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mb-6 space-y-2">
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>거의 대부분 인공지능 개발 도구를 통해 만들었음</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-500 dark:text-primary-400">•</span>
              <span>Cursor AI(claude 4 sonnet) 사용</span>
            </div>
          </div>
        </div>

        {/* 소스코드 링크 */}
        <div className="border-t border-gray-200 dark:border-dark-600 pt-4">
          <a
            href="https://github.com/setvect/BokslPlanningPoker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-sm"
          >
            <span>📦</span>
            <span>소스코드(github)</span>
          </a>
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
} 