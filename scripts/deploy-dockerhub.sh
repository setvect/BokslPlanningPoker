#!/bin/bash
# scripts/deploy-dockerhub.sh - Docker Hub를 이용한 온라인 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
DOCKERHUB_USERNAME=${1:-""}
VERSION=${2:-"latest"}
IMAGE_NAME="boksl-planning-poker"
FULL_IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_NAME}"

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

# 사용법 표시
show_usage() {
    echo -e "${YELLOW}사용법:${NC}"
    echo "  $0 <dockerhub-username> [version]"
    echo ""
    echo -e "${YELLOW}예시:${NC}"
    echo "  $0 setvect latest"
    echo "  $0 setvect v1.0.0"
    echo ""
    echo -e "${YELLOW}참고:${NC}"
    echo "  - Docker Hub에 가입하고 로그인이 필요합니다"
    echo "  - docker login 명령어로 먼저 로그인하세요"
}

# 파라미터 확인
if [ -z "$DOCKERHUB_USERNAME" ]; then
    print_error "Docker Hub 사용자명이 필요합니다."
    echo ""
    show_usage
    exit 1
fi

echo -e "${GREEN}🚀 Docker Hub 배포 시작${NC}"
echo -e "${BLUE}🐳 이미지: ${FULL_IMAGE_NAME}:${VERSION}${NC}"
echo ""

# Docker 로그인 확인
print_step "1. Docker Hub 로그인 상태 확인..."
if ! docker info | grep -q "Username:"; then
    print_warning "Docker Hub에 로그인되어 있지 않습니다."
    print_info "다음 명령어로 로그인하세요: docker login"
    exit 1
fi
print_success "Docker Hub 로그인 확인됨"

# 이미지 빌드
print_step "2. Docker 이미지 빌드 중..."
docker build -t ${IMAGE_NAME} .
print_success "이미지 빌드 완료"

# 이미지 태그
print_step "3. Docker Hub용 태그 생성 중..."
docker tag ${IMAGE_NAME} ${FULL_IMAGE_NAME}:${VERSION}

# latest 태그도 추가 (버전이 latest가 아닌 경우)
if [ "$VERSION" != "latest" ]; then
    docker tag ${IMAGE_NAME} ${FULL_IMAGE_NAME}:latest
    print_success "태그 생성 완료: ${FULL_IMAGE_NAME}:${VERSION}, ${FULL_IMAGE_NAME}:latest"
else
    print_success "태그 생성 완료: ${FULL_IMAGE_NAME}:${VERSION}"
fi

# 이미지 푸시
print_step "4. Docker Hub에 이미지 업로드 중..."
docker push ${FULL_IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker push ${FULL_IMAGE_NAME}:latest
fi

print_success "이미지 업로드 완료"

# 배포 가이드 생성
DEPLOY_SCRIPT="deploy-to-server.sh"
print_step "5. 서버 배포 스크립트 생성 중..."

cat > ${DEPLOY_SCRIPT} << EOF
#!/bin/bash
# ${DEPLOY_SCRIPT} - 원격 서버 배포 스크립트
# 생성 시각: $(date)

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\${GREEN}🚀 복슬 플래닝 포커 배포 시작\${NC}"
echo -e "\${BLUE}🐳 이미지: ${FULL_IMAGE_NAME}:${VERSION}\${NC}"

# 기존 컨테이너 정지 및 제거
echo "📋 기존 컨테이너 정리 중..."
docker stop planning-poker 2>/dev/null || true
docker rm planning-poker 2>/dev/null || true

# 최신 이미지 다운로드
echo "📥 최신 이미지 다운로드 중..."
docker pull ${FULL_IMAGE_NAME}:${VERSION}

# 컨테이너 실행
echo "🚀 컨테이너 실행 중..."
docker run -d \\
  --name planning-poker \\
  -p 3000:3000 \\
  --restart unless-stopped \\
  -e NODE_ENV=production \\
  -e PORT=3000 \\
  ${FULL_IMAGE_NAME}:${VERSION}

# 헬스체크
echo "🔍 서비스 상태 확인 중..."
sleep 10

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "\${GREEN}✅ 배포 성공! 서비스가 정상 실행 중입니다.\${NC}"
    echo -e "\${BLUE}🌐 서비스 URL: http://\$(hostname -I | awk '{print \$1}'):3000\${NC}"
else
    echo "❌ 헬스체크 실패. 로그를 확인하세요:"
    echo "  docker logs planning-poker"
fi

# 컨테이너 정보 표시
echo ""
echo "📊 컨테이너 상태:"
docker ps | grep planning-poker || echo "컨테이너를 찾을 수 없습니다."
EOF

chmod +x ${DEPLOY_SCRIPT}
print_success "서버 배포 스크립트 생성 완료: ${DEPLOY_SCRIPT}"

# Docker Compose 파일 생성
print_step "6. Docker Compose 파일 생성 중..."
cat > docker-compose.hub.yml << EOF
# docker-compose.hub.yml - Docker Hub 이미지 사용
version: '3.8'

services:
  planning-poker:
    image: ${FULL_IMAGE_NAME}:${VERSION}
    container_name: planning-poker-hub
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "sh", "-c", "curl -f http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  default:
    name: planning-poker-hub-network
EOF

print_success "Docker Compose 파일 생성 완료: docker-compose.hub.yml"

# 완료 메시지
echo ""
print_success "🎉 Docker Hub 배포 완료!"
echo ""
echo -e "${GREEN}📦 업로드된 이미지:${NC}"
echo "  - ${FULL_IMAGE_NAME}:${VERSION}"
if [ "$VERSION" != "latest" ]; then
    echo "  - ${FULL_IMAGE_NAME}:latest"
fi
echo ""
echo -e "${YELLOW}📋 다음 단계:${NC}"
echo ""
echo -e "${BLUE}1. 원격 서버에서 직접 실행:${NC}"
echo "   docker run -d -p 3000:3000 --name planning-poker ${FULL_IMAGE_NAME}:${VERSION}"
echo ""
echo -e "${BLUE}2. 배포 스크립트 사용:${NC}"
echo "   scp ${DEPLOY_SCRIPT} user@server:~/"
echo "   ssh user@server './${DEPLOY_SCRIPT}'"
echo ""
echo -e "${BLUE}3. Docker Compose 사용:${NC}"
echo "   scp docker-compose.hub.yml user@server:~/"
echo "   ssh user@server 'docker-compose -f docker-compose.hub.yml up -d'"
echo ""
echo -e "${GREEN}🌐 Docker Hub 링크:${NC}"
echo "   https://hub.docker.com/r/${DOCKERHUB_USERNAME}/${IMAGE_NAME}" 