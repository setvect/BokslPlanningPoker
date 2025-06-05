#!/bin/sh
# docker/start.sh
# 단일 컨테이너에서 nginx와 Node.js 서버를 함께 실행

# 에러 발생 시 스크립트 중단
set -e

echo "🚀 복슬 플래닝 포커 시작 중..."

# nginx 설정 테스트
echo "📋 nginx 설정 검증 중..."
nginx -t

# 백그라운드에서 Node.js 서버 시작
echo "🖥️  Node.js 서버 시작 중..."
cd /app/server
NODE_ENV=production node dist/index.js &
SERVER_PID=$!

# 서버가 시작될 때까지 대기
echo "⏳ 서버 시작 대기 중..."
sleep 5

# 서버 헬스체크
for i in 1 2 3 4 5; do
    if wget --quiet --tries=1 --spider http://localhost:3001/health; then
        echo "✅ 서버 헬스체크 성공 (시도 $i/5)"
        break
    else
        echo "⚠️  서버 헬스체크 실패 (시도 $i/5), 재시도 중..."
        sleep 2
    fi
    
    if [ $i -eq 5 ]; then
        echo "❌ 서버 시작 실패"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
done

# nginx 시작 (foreground)
echo "🌐 nginx 시작 중..."
exec nginx -g "daemon off;" 