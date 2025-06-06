import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { setupSocketHandlers } from './socket/handlers';
import { GAME_CONFIG } from '../../shared';

// 환경 변수 설정
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS 설정 - 환경에 따라 동적으로 설정
const getCorsOrigins = () => {
  if (NODE_ENV === 'production') {
    // 프로덕션: 현재 서버 주소와 일반적인 포트들
    return [
      `http://localhost:${PORT}`,
      `https://localhost:${PORT}`,
      // 추가적인 도메인이 있다면 여기에 추가
    ];
  } else {
    // 개발: 개발 서버들
    return ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];
  }
};

const corsOrigins = getCorsOrigins();

// Express 앱 생성
const app = express();
const server = createServer(app);

// Socket.IO 서버 생성
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
const clientBuildPath = NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'public')  // Docker 환경
  : path.join(process.cwd(), '../client/dist');  // 로컬 개발 환경

console.log(`📁 클라이언트 파일 경로 확인: ${clientBuildPath}`);
console.log(`📁 경로 존재 여부: ${fs.existsSync(clientBuildPath)}`);

if (fs.existsSync(clientBuildPath)) {
  console.log(`📁 클라이언트 파일 서빙: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript');
      }
    }
  }));
} else {
  console.log(`❌ 클라이언트 파일을 찾을 수 없습니다: ${clientBuildPath}`);
}

// API 라우트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    config: {
      maxRooms: GAME_CONFIG.MAX_ROOMS,
      maxUsersPerRoom: GAME_CONFIG.MAX_USERS_PER_ROOM
    }
  });
});

// 통계 API
app.get('/api/stats', (req, res) => {
  // TODO: 실제 통계 데이터 조회 구현
  res.json({
    totalRooms: 0,
    totalUsers: 0,
    activeRooms: 0,
    averageUsersPerRoom: 0
  });
});

// SPA 라우팅 지원
const indexPath = path.join(clientBuildPath, 'index.html');
console.log(`📁 index.html 경로: ${indexPath}`);
console.log(`📁 index.html 존재 여부: ${fs.existsSync(indexPath)}`);

if (fs.existsSync(indexPath)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      console.log(`📄 SPA 라우팅: ${req.path} -> index.html`);
      res.sendFile(indexPath);
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({ 
      message: '플래닝 포커 API 서버',
      environment: NODE_ENV,
      health: '/health',
      stats: '/api/stats'
    });
  });
}

// Socket.io 이벤트 핸들러 설정
setupSocketHandlers(io);

// 에러 핸들링
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('서버 에러:', err);
  res.status(500).json({ 
    error: NODE_ENV === 'development' ? err.message : '내부 서버 오류' 
  });
});

// 404 핸들링
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 플래닝 포커 서버가 시작되었습니다!`);
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log(`🏠 헬스체크: http://localhost:${PORT}/health`);
  console.log(`📊 통계: http://localhost:${PORT}/api/stats`);
  console.log(`🌍 환경: ${NODE_ENV}`);
  console.log(`🔗 CORS 허용 origins:`, corsOrigins);
  console.log(`🎮 최대 방 개수: ${GAME_CONFIG.MAX_ROOMS}`);
  console.log(`👥 방당 최대 인원: ${GAME_CONFIG.MAX_USERS_PER_ROOM}`);
});

// 우아한 종료 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신됨. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호 수신됨. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});

export { app, server, io }; 