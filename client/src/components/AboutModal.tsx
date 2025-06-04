import { useEffect } from 'react'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative shadow-lg border-2 border-gray-200">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl"
          title="닫기"
        >
          ✕
        </button>

        {/* 앱 정보 */}
        <div className="flex items-start gap-6 mb-6">
          {/* 앱 아이콘 */}
          <div className="flex-shrink-0">
            <img 
              src="/images/about.png" 
              alt="복슬 플래닝 포커" 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          </div>

          {/* 앱 정보 */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              복슬 플래닝 포커
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              Version Ver. 1.0.0 (2025. 06. 05)
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              팀과 함께 효율적으로 스토리 포인트를 추정하는
              실시간 협업 플래닝 포커 도구입니다.
            </p>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mb-6 space-y-2">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-primary-500">•</span>
              <span>거의 대부분 인공지능 개발 도구를 통해 만들었음</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-500">•</span>
              <span>Cursor AI(claude 4 sonnet) 사용</span>
            </div>
          </div>
        </div>

        {/* 소스코드 링크 */}
        <div className="border-t border-gray-200 pt-4">
          <a
            href="https://github.com/setvect/BokslPlanningPoker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors text-sm"
          >
            <span>📦</span>
            <span>소스코드(github)</span>
          </a>
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
} 