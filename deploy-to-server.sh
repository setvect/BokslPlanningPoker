#!/bin/bash
# deploy-to-server.sh - 원격 서버 배포 스크립트
# 생성 시각: 2026년 1월 13일 화요일 18시 14분 08초 KST

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 복슬 플래닝 포커 배포 시작${NC}"
echo -e "${BLUE}🐳 이미지: setvect/boksl-planning-poker:v1.1.0${NC}"

# 기존 컨테이너 정지 및 제거
echo "📋 기존 컨테이너 정리 중..."
docker stop planning-poker 2>/dev/null || true
docker rm planning-poker 2>/dev/null || true

# 최신 이미지 다운로드
echo "📥 최신 이미지 다운로드 중..."
docker pull setvect/boksl-planning-poker:v1.1.0

# 컨테이너 실행
echo "🚀 컨테이너 실행 중..."
docker run -d \
  --name planning-poker \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e PORT=3000 \
  setvect/boksl-planning-poker:v1.1.0

# 헬스체크
echo "🔍 서비스 상태 확인 중..."
sleep 10

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 배포 성공! 서비스가 정상 실행 중입니다.${NC}"
    echo -e "${BLUE}🌐 서비스 URL: http://$(hostname -I | awk '{print $1}'):3000${NC}"
else
    echo "❌ 헬스체크 실패. 로그를 확인하세요:"
    echo "  docker logs planning-poker"
fi

# 컨테이너 정보 표시
echo ""
echo "📊 컨테이너 상태:"
docker ps | grep planning-poker || echo "컨테이너를 찾을 수 없습니다."
