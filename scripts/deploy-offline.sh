#!/bin/bash
# scripts/deploy-offline.sh - 폐쇄망 환경 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
IMAGE_NAME="boksl-planning-poker"
VERSION=${1:-"v1.0.0"}
OUTPUT_DIR="./docker-images"
TAR_FILE="${OUTPUT_DIR}/${IMAGE_NAME}-${VERSION}.tar"
COMPRESSED_FILE="${TAR_FILE}.gz"

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

# 출력 디렉토리 생성
mkdir -p ${OUTPUT_DIR}

# 1단계: Docker 이미지 빌드
print_step "1. Docker 이미지 빌드 중..."
docker build -t ${IMAGE_NAME}:${VERSION} .
print_success "이미지 빌드 완료: ${IMAGE_NAME}:${VERSION}"

# 2단계: 이미지를 tar 파일로 저장
print_step "2. Docker 이미지를 tar 파일로 저장 중..."
docker save -o ${TAR_FILE} ${IMAGE_NAME}:${VERSION}
print_success "이미지 저장 완료: ${TAR_FILE}"

# 3단계: 압축
print_step "3. 이미지 파일 압축 중..."
gzip ${TAR_FILE}
print_success "압축 완료: ${COMPRESSED_FILE}"

# 파일 크기 확인
FILE_SIZE=$(du -h ${COMPRESSED_FILE} | cut -f1)
print_success "압축된 파일 크기: ${FILE_SIZE}"

# 4단계: 배포 패키지 생성
print_step "4. 배포 패키지 생성 중..."

# docker-compose.offline.yml 복사
if [ -f "docker-compose.offline.yml" ]; then
    cp docker-compose.offline.yml ${OUTPUT_DIR}/
    print_success "기존 docker-compose.offline.yml 파일을 복사했습니다."
else
    print_step "docker-compose.offline.yml 파일을 새로 생성합니다."
    cat > ${OUTPUT_DIR}/docker-compose.offline.yml << EOF
# docker-compose.offline.yml - 오프라인 배포용
version: '3.8'

services:
  planning-poker:
    image: ${IMAGE_NAME}:${VERSION}
    container_name: planning-poker-offline
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
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
    name: planning-poker-offline-network
EOF
fi

# 배포 스크립트 생성
cat > ${OUTPUT_DIR}/install.sh << 'EOF'
#!/bin/bash
# install.sh - 대상 서버에서 실행할 설치 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
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

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    print_error "Docker가 설치되지 않았습니다."
    echo "Docker를 먼저 설치해주세요:"
    echo "  sudo apt update"
    echo "  sudo apt install -y docker.io docker-compose"
    echo "  sudo systemctl start docker"
    echo "  sudo usermod -aG docker \$USER"
    exit 1
fi

# 현재 디렉토리에서 tar.gz 파일 찾기
TAR_FILE=$(find . -name "*.tar.gz" -type f | head -1)

if [ -z "$TAR_FILE" ]; then
    print_error "Docker 이미지 tar.gz 파일을 찾을 수 없습니다."
    exit 1
fi

print_step "Docker 이미지 로드 중: $TAR_FILE"

# 압축 해제 및 이미지 로드
gunzip -c "$TAR_FILE" | docker load

print_success "Docker 이미지 로드 완료"

# 기존 컨테이너 정리
print_step "기존 컨테이너 정리 중..."
docker-compose -f docker-compose.offline.yml down 2>/dev/null || true

# 서비스 시작
print_step "서비스 시작 중..."
docker-compose -f docker-compose.offline.yml up -d

# 상태 확인
sleep 10
print_step "서비스 상태 확인..."
docker-compose -f docker-compose.offline.yml ps

# 헬스체크
print_step "헬스체크 수행 중..."
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "🎉 배포가 성공적으로 완료되었습니다!"
    echo -e "${BLUE}🌐 서비스 URL: http://localhost:3000${NC}"
else
    print_error "헬스체크 실패. 로그를 확인해주세요:"
    echo "  docker logs planning-poker-offline"
fi
EOF

chmod +x ${OUTPUT_DIR}/install.sh

# README 파일 생성
cat > ${OUTPUT_DIR}/README.md << EOF
# 복슬 플래닝 포커 - 오프라인 배포 패키지

## 📦 포함된 파일
- \`${IMAGE_NAME}-${VERSION}.tar.gz\`: Docker 이미지 파일
- \`docker-compose.offline.yml\`: Docker Compose 설정
- \`install.sh\`: 자동 설치 스크립트

## 🚀 설치 방법

### 1. 전체 폴더를 대상 서버로 복사
\`\`\`bash
scp -r docker-images/ user@target-server:/opt/planning-poker/
\`\`\`

### 2. 대상 서버에서 설치 실행
\`\`\`bash
ssh user@target-server
cd /opt/planning-poker
chmod +x install.sh
./install.sh
\`\`\`

### 3. 수동 설치 (옵션)
\`\`\`bash
# Docker 이미지 로드
gunzip -c ${IMAGE_NAME}-${VERSION}.tar.gz | docker load

# 서비스 시작
docker-compose -f docker-compose.offline.yml up -d
\`\`\`

## 🔧 서비스 관리

\`\`\`bash
# 상태 확인
docker-compose -f docker-compose.offline.yml ps

# 로그 확인
docker logs planning-poker-offline

# 서비스 중지
docker-compose -f docker-compose.offline.yml down

# 서비스 재시작
docker-compose -f docker-compose.offline.yml restart
\`\`\`

## 🌐 접속
- URL: http://server-ip:3000
- 헬스체크: http://server-ip:3000/health
EOF

print_success "배포 패키지 생성 완료!"
echo ""
echo -e "${GREEN}📦 배포 패키지 위치: ${OUTPUT_DIR}${NC}"
echo -e "${BLUE}포함된 파일:${NC}"
ls -la ${OUTPUT_DIR}
echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo "1. ${OUTPUT_DIR} 폴더 전체를 대상 서버로 복사"
echo "2. 대상 서버에서 ./install.sh 실행"
echo ""
echo -e "${GREEN}예시:${NC}"
echo "  scp -r ${OUTPUT_DIR} user@target-server:/opt/"
echo "  ssh user@target-server 'cd /opt/docker-images && ./install.sh'" 