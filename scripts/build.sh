#!/bin/bash
# scripts/build.sh - Docker 빌드 스크립트

set -e

echo "🚀 복슬 플래닝 포커 Docker 빌드 시작..."

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

# 이미지 태그 설정
IMAGE_NAME="boksl-planning-poker"
VERSION=${1:-latest}
FULL_TAG="${IMAGE_NAME}:${VERSION}"

print_step "Docker 이미지 빌드: ${FULL_TAG}"

# Docker 빌드 실행
if docker build -t "${FULL_TAG}" .; then
    print_success "Docker 이미지 빌드 완료!"
    
    # 이미지 정보 출력
    echo ""
    print_step "빌드된 이미지 정보:"
    docker images | grep "${IMAGE_NAME}" | head -1
    
    echo ""
    print_success "빌드 완료! 다음 명령어로 실행할 수 있습니다:"
    echo "  docker run -p 3000:3000 ${FULL_TAG}"
    echo "  또는"
    echo "  docker-compose up"
    
else
    print_error "Docker 빌드 실패!"
    exit 1
fi 