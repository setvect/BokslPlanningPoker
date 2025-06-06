// client/src/config/environment.ts
// 환경별 설정 관리

interface EnvironmentConfig {
  socketUrl: string;
  apiUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// 환경 감지
const getEnvironment = (): EnvironmentConfig => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Socket URL 동적 결정
  const getSocketUrl = () => {
    // 개발 환경에서는 현재 페이지와 같은 호스트:포트 사용
    if (isDevelopment && window.location.hostname === 'localhost') {
      return `http://${window.location.hostname}:${window.location.port}`;
    }
    
    // 프로덕션이나 배포 환경에서는 현재 origin 사용
    return window.location.origin;
  };
  
  return {
    socketUrl: getSocketUrl(),
    apiUrl: window.location.origin,
    isDevelopment,
    isProduction,
  };
};

export const ENV = getEnvironment(); 