import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';

// 환경 변수 설정
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Express 앱 생성
const app = express();
const server = createServer(app);

// Socket.IO 서버 생성
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: false // Socket.IO를 위해 비활성화
}));
app.use(compression());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (프로덕션 환경에서 클라이언트 빌드 파일)
if (NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  
  // React 라우팅을 위한 fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

// 간단한 API 상태 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log(`사용자 연결됨: ${socket.id}`);
  
  // 기본 이벤트 처리
  socket.on('disconnect', () => {
    console.log(`사용자 연결 해제됨: ${socket.id}`);
  });
  
  // 테스트용 핑퐁 이벤트
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

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
  console.log(`🚀 서버가 포트 ${PORT}에서 시작되었습니다.`);
  console.log(`📱 환경: ${NODE_ENV}`);
  console.log(`🌐 CORS 허용 원본: ${CORS_ORIGIN}`);
  
  if (NODE_ENV === 'development') {
    console.log(`🔧 개발 서버: http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

export { app, server, io }; 