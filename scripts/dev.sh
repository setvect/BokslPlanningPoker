#!/bin/bash
# scripts/dev.sh - 개발 환경 Docker 실행 스크립트

set -e

echo "🛠️  복슬 플래닝 포커 개발 환경 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${BLUE}📋 단계: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 개발 환경 확인
print_step "개발 환경 의존성 확인..."

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    print_error "Node.js가 설치되지 않았습니다. Node.js 18+ 를 설치해주세요."
    exit 1
fi

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    print_error "Docker가 설치되지 않았습니다. Docker를 설치해주세요."
    exit 1
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose가 설치되지 않았습니다. Docker Compose를 설치해주세요."
    exit 1
fi

print_success "모든 의존성이 설치되어 있습니다."

# 개발 환경 실행
print_step "개발 환경 Docker 컨테이너 시작..."

# 기존 컨테이너 정리
print_step "기존 개발 컨테이너 정리..."
docker-compose --profile dev down

# 개발 환경 시작
if docker-compose --profile dev up --build -d; then
    print_success "개발 환경 시작 완료!"
    
    echo ""
    print_step "실행 중인 서비스:"
    docker-compose --profile dev ps
    
    echo ""
    print_success "개발 서버가 시작되었습니다:"
    echo "  📱 클라이언트: http://localhost:5173"
    echo "  🚀 서버: http://localhost:3001"
    echo ""
    echo "로그 확인:"
    echo "  docker-compose --profile dev logs -f"
    echo ""
    echo "개발 환경 종료:"
    echo "  docker-compose --profile dev down"
    
else
    print_error "개발 환경 시작 실패!"
    exit 1
fi 