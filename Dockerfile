# Dockerfile - Planning Poker Application
# Multi-stage build for optimal production image

# Stage 1: Build client (React + Vite)
FROM node:18-alpine AS client-builder

WORKDIR /app
COPY shared/ ./shared/
COPY client/package*.json ./client/

# 개발 의존성도 포함하여 설치 (빌드에 필요)
WORKDIR /app/client
RUN npm ci

# 소스 코드 복사 (node_modules 제외)
COPY client/src ./src
COPY client/public ./public
COPY client/index.html ./
COPY client/vite.config.ts ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./
COPY client/tsconfig.json ./
COPY client/tsconfig.node.json ./

ENV NODE_ENV=production
RUN npm run build

# Stage 2: Build server (Node.js + TypeScript)
FROM node:18-alpine AS server-builder

WORKDIR /app
COPY shared/ ./shared/
COPY server/package*.json ./server/

WORKDIR /app/server
RUN npm ci

# 소스 코드 복사 (node_modules 제외)
COPY server/src ./src
COPY server/tsconfig.json ./

RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# 운영용 의존성만 설치
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 서버 빌드 파일 복사
COPY --from=server-builder /app/server/dist ./dist

# 클라이언트 빌드 파일 복사
COPY --from=client-builder /app/client/dist ./public

# shared 모듈 복사
COPY shared/ ./shared/

# 헬스체크 스크립트 복사
COPY healthcheck.js ./

# 사용자 권한 설정
RUN chown -R nextjs:nodejs /app
USER nextjs

# 환경변수 설정
ENV PORT=3000
ENV NODE_ENV=production

# 포트 노출
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# 애플리케이션 시작
CMD ["node", "dist/server/src/index.js"] 