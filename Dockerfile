# Dockerfile
# 플래닝 포커 단일 컨테이너 프로덕션 빌드

# 빌드 스테이지 1: 클라이언트 빌드
FROM node:18-alpine AS client-builder

WORKDIR /app

# 공통 타입 복사
COPY shared/ ./shared/

# 클라이언트 의존성 설치
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci && npm cache clean --force

# 클라이언트 소스 복사 및 빌드
COPY client/src ./src
COPY client/public ./public
COPY client/index.html ./
COPY client/vite.config.ts ./
COPY client/tsconfig*.json ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./

# 환경 변수 설정
ENV VITE_SERVER_URL=/

# 프로덕션 빌드
RUN npm run build

# 빌드 스테이지 2: 서버 빌드
FROM node:18-alpine AS server-builder

WORKDIR /app

# 공통 타입 복사
COPY shared/ ./shared/

# 서버 의존성 설치
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# TypeScript 빌드용 의존성 추가 설치
RUN npm install typescript ts-node @types/node

# 서버 소스 복사 및 빌드
COPY server/src ./src
COPY server/tsconfig.json ./
RUN npm run build

# 프로덕션 스테이지: 모든 것을 결합
FROM node:18-alpine AS production

# 보안: non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# nginx 설치
RUN apk add --no-cache nginx

WORKDIR /app

# 공통 타입 복사
COPY --chown=appuser:nodejs shared/ ./shared/

# 서버 파일 복사
COPY --from=server-builder --chown=appuser:nodejs /app/server/dist ./server/dist
COPY --from=server-builder --chown=appuser:nodejs /app/server/package*.json ./server/
COPY --from=server-builder --chown=appuser:nodejs /app/server/node_modules ./server/node_modules

# 클라이언트 빌드 파일을 nginx 웹 루트와 서버 정적 파일 디렉토리에 복사
COPY --from=client-builder --chown=appuser:nodejs /app/client/dist /usr/share/nginx/html
COPY --from=client-builder --chown=appuser:nodejs /app/client/dist ./server/dist/public

# nginx 설정 복사
COPY docker/nginx-single.conf /etc/nginx/nginx.conf

# 시작 스크립트 복사
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# 포트 노출
EXPOSE 80 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 앱 사용자로 전환
USER appuser

# 시작 스크립트 실행
CMD ["/start.sh"] 