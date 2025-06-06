#!/bin/bash
# scripts/deploy.sh - 프로덕션 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
IMAGE_NAME="setvect/boksl-planning-poker"
VERSION=${1:-latest}
REGISTRY_URL=""  # 비워두면 Docker Hub 사용
SERVER_HOST=${2:-"your-server.com"}
SERVER_USER=${3:-"ubuntu"}
DEPLOY_PATH="/opt/planning-poker"

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1단계: 로컬 빌드
print_step "1. Docker 이미지 빌드 중..."
docker build -t ${IMAGE_NAME}:${VERSION} .
docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
print_success "이미지 빌드 완료"

# 2단계: Registry에 푸시
print_step "2. 이미지를 Registry에 업로드 중..."
docker push ${IMAGE_NAME}:${VERSION}
docker push ${IMAGE_NAME}:latest
print_success "이미지 업로드 완료"

# 3단계: 서버에 배포 파일 전송
print_step "3. 서버에 배포 파일 전송 중..."
scp docker-compose.prod.yml ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
print_success "배포 파일 전송 완료"

# 4단계: 서버에서 배포 실행
print_step "4. 서버에서 서비스 배포 중..."
ssh ${SERVER_USER}@${SERVER_HOST} "
    cd ${DEPLOY_PATH}
    
    # 이전 컨테이너 정리
    docker-compose -f docker-compose.prod.yml down
    
    # 새 이미지 pull
    docker pull ${IMAGE_NAME}:latest
    
    # 서비스 시작
    docker-compose -f docker-compose.prod.yml up -d
    
    # 상태 확인
    sleep 10
    docker-compose -f docker-compose.prod.yml ps
    docker logs planning-poker-prod --tail 20
"
print_success "배포 완료!"

# 5단계: 헬스체크
print_step "5. 서비스 헬스체크..."
sleep 5
curl -f http://${SERVER_HOST}:3000/health || {
    print_error "헬스체크 실패!"
    exit 1
}
print_success "서비스가 정상적으로 실행 중입니다!"

echo ""
echo -e "${GREEN}🎉 배포가 성공적으로 완료되었습니다!${NC}"
echo -e "${BLUE}🌐 서비스 URL: http://${SERVER_HOST}:3000${NC}" 