#!/bin/bash
# scripts/install-docker.sh - Docker 자동 설치 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}💡 $1${NC}"
}

echo -e "${GREEN}🐳 Docker 설치 스크립트 시작${NC}"
echo ""

# 운영체제 확인
print_step "1. 시스템 정보 확인..."
OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
VERSION=$(lsb_release -sr 2>/dev/null || echo "Unknown")
ARCH=$(uname -m)

echo "   운영체제: $OS $VERSION"
echo "   아키텍처: $ARCH"

if [ "$OS" != "Ubuntu" ]; then
    print_warning "이 스크립트는 Ubuntu용으로 작성되었습니다."
    print_info "다른 배포판의 경우 수동 설치를 권장합니다."
fi

# Docker가 이미 설치되어 있는지 확인
if command -v docker &> /dev/null; then
    print_success "Docker가 이미 설치되어 있습니다."
    docker --version
    print_info "설치를 건너뛰고 설정만 확인합니다."
    DOCKER_ALREADY_INSTALLED=true
else
    DOCKER_ALREADY_INSTALLED=false
fi

# sudo 권한 확인
print_step "2. sudo 권한 확인..."
if ! sudo -n true 2>/dev/null; then
    print_info "sudo 권한이 필요합니다. 비밀번호를 입력해주세요."
    sudo true
fi
print_success "sudo 권한 확인됨"

if [ "$DOCKER_ALREADY_INSTALLED" = false ]; then
    # 시스템 업데이트
    print_step "3. 시스템 패키지 업데이트..."
    sudo apt update
    print_success "패키지 목록 업데이트 완료"
    
    # 설치 방법 선택
    echo ""
    print_info "Docker 설치 방법을 선택하세요:"
    echo "1) 공식 Docker 설치 스크립트 (권장)"
    echo "2) APT 패키지 매니저 (docker.io)"
    echo "3) Docker 공식 저장소 + APT"
    echo ""
    read -p "선택 (1-3, 기본값: 1): " INSTALL_METHOD
    INSTALL_METHOD=${INSTALL_METHOD:-1}
    
    case $INSTALL_METHOD in
        1)
            print_step "4. Docker 공식 설치 스크립트 사용..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            rm get-docker.sh
            print_success "Docker 설치 완료 (공식 스크립트)"
            ;;
        2)
            print_step "4. APT로 Docker 설치..."
            sudo apt install -y docker.io docker-compose
            print_success "Docker 설치 완료 (APT)"
            ;;
        3)
            print_step "4. Docker 공식 저장소 설정..."
            sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt update
            sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            print_success "Docker 설치 완료 (공식 저장소)"
            ;;
        *)
            print_error "잘못된 선택입니다."
            exit 1
            ;;
    esac
else
    print_step "3. Docker 이미 설치되어 있음 - 설정 확인으로 이동..."
fi

# Docker 서비스 시작 및 활성화
print_step "5. Docker 서비스 설정..."
sudo systemctl start docker
sudo systemctl enable docker
print_success "Docker 서비스 시작 및 부팅 시 자동 시작 설정 완료"

# 사용자를 docker 그룹에 추가
print_step "6. 사용자 권한 설정..."
sudo usermod -aG docker $USER
print_success "사용자 $USER를 docker 그룹에 추가했습니다"

# Docker 버전 확인
print_step "7. 설치 확인..."
DOCKER_VERSION=$(docker --version)
print_success "Docker 설치 확인: $DOCKER_VERSION"

# Docker Compose 확인
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose 확인: $COMPOSE_VERSION"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose Plugin 확인: $COMPOSE_VERSION"
else
    print_warning "Docker Compose가 설치되지 않았습니다."
    print_info "필요하면 다음 명령어로 설치하세요: sudo apt install docker-compose"
fi

# 테스트 실행
print_step "8. Docker 테스트 실행..."
if sudo docker run hello-world > /dev/null 2>&1; then
    print_success "Docker 테스트 성공!"
else
    print_warning "Docker 테스트 실패. 서비스 상태를 확인하세요."
fi

# 권한 적용 테스트
print_step "9. 권한 적용 확인 및 처리..."

# 현재 그룹 확인
CURRENT_GROUPS=$(groups)
if echo "$CURRENT_GROUPS" | grep -q "docker"; then
    print_success "docker 그룹이 이미 활성화되어 있습니다."
    DOCKER_GROUP_ACTIVE=true
else
    print_info "docker 그룹 권한을 적용합니다..."
    if newgrp docker; then
        print_success "docker 그룹 권한 적용 완료"
        DOCKER_GROUP_ACTIVE=true
    else
        print_warning "newgrp 명령 실행 실패. 수동으로 권한을 적용해야 합니다."
        DOCKER_GROUP_ACTIVE=false
    fi
fi

# sudo 없이 Docker 명령 테스트
print_step "10. sudo 없이 Docker 명령 테스트..."
if [ "$DOCKER_GROUP_ACTIVE" = true ]; then
    if timeout 30 docker run --rm hello-world > /dev/null 2>&1; then
        print_success "✅ sudo 없이 Docker 명령 실행 성공!"
        DOCKER_READY=true
    else
        print_warning "Docker 명령 실행 실패. 권한 설정을 확인하세요."
        DOCKER_READY=false
    fi
else
    print_info "권한 적용 후 테스트를 건너뜁니다."
    DOCKER_READY=false
fi

# 최종 안내
echo ""
print_success "🎉 Docker 설치가 완료되었습니다!"
echo ""

if [ "$DOCKER_READY" = true ]; then
    print_success "✅ 모든 설정이 완료되었습니다. sudo 없이 Docker를 사용할 수 있습니다!"
    echo ""
    print_info "🚀 바로 사용해보세요:"
    echo "   docker --version"
    echo "   docker run hello-world"
else
    print_warning "⚠️  권한 설정이 완전히 적용되지 않았습니다."
    echo ""
    print_info "🔧 다음 중 하나를 실행하세요:"
    echo ""
    echo "1️⃣ 그룹 권한 즉시 적용:"
    echo "   newgrp docker"
    echo "   docker run hello-world"
    echo ""
    echo "2️⃣ 새 터미널 세션 시작:"
    echo "   exit"
    echo "   ssh user@server"
    echo "   docker run hello-world"
    echo ""
    echo "3️⃣ sudo로 임시 사용:"
    echo "   sudo docker run hello-world"
fi

echo ""
print_info "📊 현재 상태 확인:"
echo "   groups                    # 사용자 그룹 확인"
echo "   docker --version          # Docker 버전"
echo "   sudo systemctl status docker  # Docker 서비스 상태"
echo ""
print_info "🎯 복슬 플래닝 포커 배포 준비 완료!"
echo "   이제 Docker Hub에서 이미지를 pull하거나"
echo "   오프라인 배포 패키지를 사용할 수 있습니다." 