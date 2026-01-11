# Docker 가이드

복슬 플래닝 포커를 Docker를 사용하여 빌드하고 실행하는 방법을 안내합니다.

## 📋 사전 준비

### Docker 설치 확인

```bash
docker --version
docker-compose --version
```

### WSL2 환경 (Windows 개발 환경)

**WSL2에서 Docker 명령어가 인식되지 않는 경우:**

1. **Docker Desktop WSL 통합 활성화 (권장)**
   ```
   1. Windows에서 Docker Desktop 실행
   2. Settings → Resources → WSL Integration
   3. ✅ Enable integration with my default WSL distro
   4. ✅ 사용 중인 WSL 배포판 (Ubuntu 등) 체크
   5. 🔄 Apply & Restart
   ```

2. **WSL 재시작 후 확인**
   ```bash
   # 새 터미널에서 확인
   docker --version
   docker-compose --version

   # Docker 환경 확인 스크립트 실행
   ./scripts/check-docker.sh
   ```

### Linux 서버 환경

**원격 Ubuntu 서버에 Docker 설치:**

#### 방법 1: 자동 설치 스크립트 (권장)

```bash
# 스크립트를 서버로 전송
scp scripts/install-docker.sh user@server:~/

# 서버에서 실행
ssh user@server
chmod +x install-docker.sh
./install-docker.sh
```

#### 방법 2: 수동 설치

```bash
# 시스템 업데이트
sudo apt update

# Docker 공식 설치 스크립트
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 사용자 권한 설정
sudo usermod -aG docker $USER
newgrp docker

# 설치 확인
docker --version
docker run hello-world
```

#### 방법 3: APT 패키지 매니저

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

### sudo 권한 관리

**Docker 설치 후 sudo 없이 사용하기:**

```bash
# 문제: sudo가 필요함
sudo docker run hello-world  # ✅ 작동
docker run hello-world       # ❌ 권한 오류

# 해결: docker 그룹에 사용자 추가
sudo usermod -aG docker $USER

# 권한 적용 (다음 중 하나 선택)
newgrp docker                # 1️⃣ 즉시 적용
# 또는 새 터미널 열기        # 2️⃣ 터미널 재시작
# 또는 재로그인             # 3️⃣ SSH 재접속

# 확인
docker run hello-world       # ✅ sudo 없이 작동
groups                       # docker 그룹 포함 확인
```

## 🚀 Docker로 실행하기

### 개발 환경

개발 중 코드 변경사항을 즉시 반영하는 환경입니다.

```bash
# 개발 환경 실행 (핫 리로드 지원)
./scripts/dev.sh

# 또는 수동 실행
docker-compose --profile dev up --build
```

**특징:**
- 소스 코드를 볼륨 마운트하여 실시간 반영
- nodemon과 Vite HMR 활성화
- 개발용 포트 노출 (서버: 3001, 클라이언트: 5173)

### 프로덕션 빌드

#### 방법 1: Docker Compose 사용 (권장)

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

#### 방법 2: Docker 명령어 직접 사용

```bash
# 이미지 빌드
docker build -t boksl-planning-poker .

# 컨테이너 실행
docker run -d \
  --name planning-poker \
  -p 3000:3000 \
  --restart unless-stopped \
  boksl-planning-poker
```

#### 방법 3: 빌드 스크립트 사용

```bash
# Docker 이미지 빌드
./scripts/build.sh
```

### 포트 변경

기본 포트(3000) 대신 다른 포트를 사용하려면:

```bash
# 8080 포트로 실행
docker run -d -p 8080:3000 --name planning-poker boksl-planning-poker

# 또는 docker-compose.yml 수정
ports:
  - "8080:3000"
```

## 📦 배포 방법

### Docker Hub를 통한 배포 (온라인)

인터넷이 연결된 환경에서 Docker Hub를 통해 배포합니다.

```bash
# 1. Docker Hub 로그인
docker login

# 2. 자동화 스크립트로 빌드 및 업로드
./scripts/deploy-dockerhub.sh YOUR_DOCKERHUB_USERNAME v1.0.0

# 3. 원격 서버에서 이미지 Pull 및 실행
docker pull YOUR_DOCKERHUB_USERNAME/boksl-planning-poker:v1.0.0
docker run -d -p 3000:3000 --name planning-poker \
  YOUR_DOCKERHUB_USERNAME/boksl-planning-poker:v1.0.0

# 4. 또는 생성된 배포 스크립트 사용
scp deploy-to-server.sh user@server:~/
ssh user@server './deploy-to-server.sh'
```

**스크립트가 수행하는 작업:**
1. Docker 이미지 빌드
2. 태그 지정 (latest 및 버전)
3. Docker Hub에 푸시
4. 배포 스크립트 자동 생성

### 오프라인 배포

인터넷이 없는 폐쇄망 환경에서 배포하는 방법입니다.

#### 방법 1: 자동화 스크립트 (권장)

```bash
# 1. 배포 패키지 생성
./scripts/deploy-offline.sh v1.0.0

# 생성되는 파일:
# - docker-images/boksl-planning-poker-v1.0.0.tar.gz (Docker 이미지)
# - docker-images/docker-compose.offline.yml (실행 설정)
# - docker-images/install.sh (설치 스크립트)

# 2. docker-images/ 폴더를 대상 서버로 전송
scp -r docker-images/ user@offline-server:/opt/planning-poker/

# 3. 대상 서버에서 설치 실행
ssh user@offline-server
cd /opt/planning-poker
chmod +x install.sh
./install.sh
```

#### 방법 2: 수동 배포

```bash
# 1. 로컬에서 이미지 빌드 및 저장
docker build -t boksl-planning-poker:v1.0.0 .
docker save -o planning-poker.tar boksl-planning-poker:v1.0.0
gzip planning-poker.tar

# 2. 파일 전송 (scp, USB, 물리적 매체 등)
scp planning-poker.tar.gz user@offline-server:/tmp/

# 3. 대상 서버에서 이미지 로드 및 실행
ssh user@offline-server
gunzip -c /tmp/planning-poker.tar.gz | docker load
docker run -d -p 3000:3000 --name planning-poker boksl-planning-poker:v1.0.0
```

#### 방법 3: USB 드라이브 활용

```bash
# 1. USB 마운트 후 이미지 저장
mount /dev/sdb1 /media/usb
docker save boksl-planning-poker:v1.0.0 | gzip > /media/usb/planning-poker.tar.gz

# 2. 대상 서버에서 USB 마운트 후 로드
mount /dev/sdb1 /media/usb
gunzip -c /media/usb/planning-poker.tar.gz | docker load
docker run -d -p 3000:3000 --name planning-poker boksl-planning-poker:v1.0.0
```

## 🔍 모니터링 및 관리

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 목록
docker ps

# 모든 컨테이너 (중지된 것 포함)
docker ps -a

# Docker Compose 상태
docker-compose ps
```

### 로그 확인

```bash
# 실시간 로그 보기
docker logs -f planning-poker

# Docker Compose 로그
docker-compose logs -f

# 마지막 100줄만 보기
docker logs --tail 100 planning-poker
```

### 컨테이너 접속

```bash
# 컨테이너 내부 쉘 접속
docker exec -it planning-poker sh

# 특정 명령어 실행
docker exec planning-poker ls -la
```

### 리소스 사용량

```bash
# 실시간 리소스 모니터링
docker stats planning-poker

# 모든 컨테이너 리소스
docker stats
```

### 컨테이너 재시작

```bash
# 컨테이너 재시작
docker restart planning-poker

# Docker Compose 재시작
docker-compose restart
```

### 컨테이너 중지 및 삭제

```bash
# 컨테이너 중지
docker stop planning-poker

# 컨테이너 삭제
docker rm planning-poker

# 이미지 삭제
docker rmi boksl-planning-poker

# Docker Compose 중지 및 삭제
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

## 🧹 정리 작업

### 사용하지 않는 리소스 정리

```bash
# 중지된 컨테이너 삭제
docker container prune

# 사용하지 않는 이미지 삭제
docker image prune

# 사용하지 않는 볼륨 삭제
docker volume prune

# 모든 사용하지 않는 리소스 삭제 (주의!)
docker system prune -a
```

## 🐛 문제 해결

### 빌드 오류

**문제: 빌드 중 의존성 설치 실패**
```bash
# Docker 빌드 캐시 무시하고 재빌드
docker build --no-cache -t boksl-planning-poker .
```

### 포트 충돌

**문제: 포트가 이미 사용 중**
```bash
# 사용 중인 프로세스 확인
lsof -i :3000
sudo netstat -tulpn | grep 3000

# 다른 포트로 실행
docker run -d -p 8080:3000 --name planning-poker boksl-planning-poker
```

### 컨테이너 시작 실패

**문제: 컨테이너가 바로 종료됨**
```bash
# 로그 확인
docker logs planning-poker

# 인터랙티브 모드로 실행하여 디버깅
docker run -it boksl-planning-poker sh
```

### 네트워크 문제

**문제: 컨테이너 간 통신 불가**
```bash
# Docker 네트워크 확인
docker network ls
docker network inspect bridge

# 새 네트워크 생성
docker network create planning-poker-network
docker run -d --network planning-poker-network ...
```

## 📚 다음 단계

- [배포 가이드](DEPLOYMENT.md) - nginx + SSL 설정 및 프로덕션 환경 구성
- [시작하기](GETTING_STARTED.md) - 로컬 개발 환경 설정
- [아키텍처](ARCHITECTURE.md) - 프로젝트 구조 이해
