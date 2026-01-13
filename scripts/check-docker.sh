#!/bin/bash
# scripts/check-docker.sh - Docker 설치 및 설정 확인 스크립트

set -e

echo "🐳 Docker 환경 확인 중..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Docker 설치 확인
print_step "Docker 설치 확인"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker가 설치되어 있습니다: $DOCKER_VERSION"
else
    print_error "Docker가 설치되지 않았습니다."
    echo ""
    print_info "Docker Desktop WSL 통합 설정 방법:"
    echo "1. Windows에서 Docker Desktop 실행"
    echo "2. Settings → Resources → WSL Integration"
    echo "3. 'Enable integration with my default WSL distro' 체크"
    echo "4. 사용 중인 WSL 배포판 체크"
    echo "5. 'Apply & Restart' 클릭"
    echo ""
    print_info "또는 WSL 내에서 직접 설치:"
    echo "curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "sudo sh get-docker.sh"
    echo "sudo usermod -aG docker \$USER"
    echo "newgrp docker"
    exit 1
fi

# Docker Compose 확인
print_step "Docker Compose 확인"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose가 설치되어 있습니다: $COMPOSE_VERSION"
else
    print_warning "Docker Compose가 설치되지 않았습니다."
    print_info "Docker Desktop을 통해 Docker Compose도 자동으로 설치됩니다."
fi

# Docker 서비스 상태 확인
print_step "Docker 서비스 상태 확인"
if docker info &> /dev/null; then
    print_success "Docker 서비스가 정상적으로 실행 중입니다."
else
    print_error "Docker 서비스에 접근할 수 없습니다."
    print_info "Docker Desktop이 실행 중인지 확인해주세요."
    exit 1
fi

# WSL 환경 정보
print_step "WSL 환경 정보"
if [ -f /proc/version ]; then
    WSL_INFO=$(grep -i microsoft /proc/version || echo "정보 없음")
    echo "WSL 버전: $WSL_INFO"
fi

echo ""
print_success "🎉 Docker 환경이 올바르게 설정되었습니다!"
echo ""
print_info "이제 다음 명령어를 사용할 수 있습니다:"
echo "  ./scripts/build.sh    # Docker 이미지 빌드"
echo "  ./scripts/dev.sh      # 개발 환경 실행"
echo "  docker-compose up     # 프로덕션 실행" 