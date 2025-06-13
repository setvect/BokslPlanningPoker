import React from 'react';
import { usePWA } from '../hooks/usePWA';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('앱이 성공적으로 설치되었습니다!');
    }
  };

  // 이미 설치되었거나 설치할 수 없는 경우 표시하지 않음
  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img 
              src="/icon/logo192.png" 
              alt="복슬포커 아이콘" 
              className="w-12 h-12 rounded-lg"
            />
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold text-gray-900 text-sm">
              복슬포커 앱 설치
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              홈 화면에 추가하여 더 빠르게 접속하세요!
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                설치
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 