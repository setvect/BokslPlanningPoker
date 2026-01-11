# 배포 가이드

복슬 플래닝 포커를 프로덕션 환경에 배포하는 방법을 안내합니다.

## 📋 개요

이 가이드는 nginx 리버스 프록시와 Let's Encrypt SSL 인증서를 사용하여 HTTPS로 서비스를 제공하는 방법을 다룹니다.

## 🎯 아키텍처 구조

```
인터넷 → nginx (SSL 터미네이션) → Docker 컨테이너 (복슬 플래닝 포커)
         ↓
    80 → 443 리다이렉트 (HTTP → HTTPS)
    443 → localhost:3000 프록시 (nginx → Docker)
```

**트래픽 흐름:**
1. 사용자가 `https://your-domain.com` 접속
2. nginx가 SSL 암호화/복호화 처리
3. nginx가 `localhost:3000`으로 프록시 (Docker 컨테이너)
4. Docker에서 실행 중인 복슬 플래닝 포커 앱이 응답

## 🚀 자동 배포 (권장)

### 사전 준비

1. **도메인 준비**: 유효한 도메인 이름 (예: `poker.example.com`)
2. **DNS 설정**: 도메인이 서버 IP를 가리키도록 A 레코드 설정
3. **서버 접근**: SSH로 서버에 접근 가능해야 함

### 자동 배포 스크립트 실행

```bash
# 스크립트를 서버로 전송
scp scripts/setup-nginx-ssl.sh user@server:~/

# 서버에서 실행
ssh user@server
chmod +x setup-nginx-ssl.sh
./setup-nginx-ssl.sh your-domain.com admin@your-domain.com

# 예시
./setup-nginx-ssl.sh poker.example.com webmaster@example.com
```

### 스크립트가 자동으로 수행하는 작업

1. **nginx 설치 및 리버스 프록시 설정**
   - Docker 컨테이너(`localhost:3000`)로 프록시 연결
   - 웹소켓(Socket.io) 지원 설정

2. **Let's Encrypt SSL 인증서 발급**
   - 무료 SSL 인증서 자동 발급
   - nginx SSL 설정 자동 적용

3. **보안 설정**
   - HTTP → HTTPS 자동 리다이렉트
   - 보안 헤더 추가 (HSTS, XSS 보호 등)

4. **방화벽 및 자동 갱신 설정**
   - nginx 포트 허용 (80, 443)
   - SSL 인증서 자동 갱신 cron 설정

## 🔧 수동 배포 (고급 사용자용)

### 1. Docker 컨테이너 실행

```bash
# Docker로 애플리케이션 실행
docker run -d \
  --name planning-poker \
  -p 3000:3000 \
  --restart unless-stopped \
  boksl-planning-poker:latest
```

### 2. nginx 설치

```bash
sudo apt update
sudo apt install -y nginx
```

### 3. nginx 설정

```bash
# nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/your-domain.com
```

**설정 파일 내용:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # WebSocket 지원 (Socket.io)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**설정 활성화:**
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# 기본 설정 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# nginx 재시작
sudo systemctl reload nginx
```

### 4. SSL 인증서 설치

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급 및 자동 설정
sudo certbot --nginx -d your-domain.com

# 이메일 입력 및 약관 동의 후 진행
```

### 5. 방화벽 설정

```bash
# ufw 방화벽 사용 시
sudo ufw allow 'Nginx Full'
sudo ufw status

# 또는 iptables 사용 시
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## 🔄 SSL 인증서 자동 갱신

### 자동 갱신 스크립트

Let's Encrypt 인증서는 90일마다 갱신해야 합니다. 자동 갱신 스크립트를 사용하세요.

```bash
# 스크립트를 서버로 전송
scp scripts/ssl-auto-renew.sh user@server:~/

# 서버에서 실행 권한 부여
ssh user@server
chmod +x ssl-auto-renew.sh

# cron에 등록 (매일 새벽 2시 실행)
sudo crontab -e

# 다음 줄 추가
0 2 * * * /home/user/ssl-auto-renew.sh >> /var/log/ssl-renew.log 2>&1
```

### 수동 갱신

```bash
# 갱신 테스트 (실제 갱신은 하지 않음)
sudo certbot renew --dry-run

# 수동 갱신
sudo certbot renew

# 특정 도메인만 갱신
sudo certbot renew --cert-name your-domain.com
```

### 갱신 로그 확인

```bash
# 자동 갱신 로그
sudo tail -f /var/log/ssl-renew.log

# Certbot 로그
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## 📊 모니터링

### nginx 로그 확인

```bash
# 접근 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log

# 특정 도메인 로그 (설정에 따라)
sudo tail -f /var/log/nginx/your-domain.com.access.log
sudo tail -f /var/log/nginx/your-domain.com.error.log
```

### Docker 컨테이너 상태

```bash
# 컨테이너 상태 확인
docker ps | grep planning-poker

# 컨테이너 로그
docker logs -f planning-poker

# 리소스 사용량
docker stats planning-poker
```

### SSL 인증서 상태

```bash
# 인증서 정보 확인
sudo certbot certificates

# 만료일 확인
sudo certbot certificates | grep "Expiry Date"
```

## 🛡️ 보안 강화

### 추가 보안 헤더

nginx 설정에 다음 내용을 추가하세요:

```nginx
server {
    # ... 기존 설정 ...

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Rate Limiting

DDoS 공격 방지를 위한 rate limiting 설정:

```nginx
# /etc/nginx/nginx.conf의 http 블록에 추가
http {
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

    server {
        location / {
            limit_req zone=mylimit burst=20 nodelay;
            # ... 기존 proxy 설정 ...
        }
    }
}
```

### 방화벽 강화

```bash
# 필요한 포트만 열기
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🐛 문제 해결

### 1. 도메인 DNS 설정 확인

```bash
# 도메인이 서버 IP를 가리키는지 확인
nslookup your-domain.com
dig your-domain.com

# 결과에 서버 IP가 나와야 함
```

### 2. nginx 설정 오류

```bash
# 설정 파일 문법 검사
sudo nginx -t

# 설정 파일 확인
sudo cat /etc/nginx/sites-available/your-domain.com

# nginx 재시작
sudo systemctl restart nginx
sudo systemctl status nginx
```

### 3. SSL 인증서 발급 실패

**일반적인 원인:**
- DNS가 서버 IP를 가리키지 않음
- 방화벽에서 80, 443 포트가 막혀있음
- nginx가 80 포트를 이미 사용 중이지 않음

**해결 방법:**
```bash
# 수동으로 인증서 발급 시도 (디버그 모드)
sudo certbot --nginx -d your-domain.com --verbose

# 또는 standalone 모드 (nginx 중지 필요)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d your-domain.com
sudo systemctl start nginx
```

### 4. Docker 컨테이너 연결 확인

```bash
# 3000 포트에서 앱이 실행 중인지 확인
curl http://localhost:3000

# Docker 컨테이너 상태
docker ps | grep planning-poker

# 컨테이너 재시작
docker restart planning-poker
```

### 5. WebSocket 연결 오류

nginx에서 WebSocket 프록시 설정이 누락되었을 수 있습니다.

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;

    # WebSocket 필수 설정
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 📈 성능 최적화

### nginx 캐싱

정적 파일 캐싱을 위한 설정:

```nginx
server {
    # ... 기존 설정 ...

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
}
```

### Gzip 압축

```nginx
# /etc/nginx/nginx.conf의 http 블록에 추가
http {
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
```

## 🔄 업데이트 및 재배포

### 애플리케이션 업데이트

```bash
# 1. 새 이미지 Pull (Docker Hub 사용 시)
docker pull your-username/boksl-planning-poker:latest

# 2. 기존 컨테이너 중지 및 삭제
docker stop planning-poker
docker rm planning-poker

# 3. 새 컨테이너 실행
docker run -d \
  --name planning-poker \
  -p 3000:3000 \
  --restart unless-stopped \
  your-username/boksl-planning-poker:latest

# 4. 상태 확인
docker logs -f planning-poker
```

### 무중단 배포 (Blue-Green)

```bash
# 1. 새 컨테이너 실행 (다른 포트)
docker run -d \
  --name planning-poker-new \
  -p 3001:3000 \
  boksl-planning-poker:latest

# 2. 헬스 체크
curl http://localhost:3001

# 3. nginx 설정 변경
sudo nano /etc/nginx/sites-available/your-domain.com
# proxy_pass http://localhost:3001; 로 변경

# 4. nginx 재로드
sudo nginx -t && sudo systemctl reload nginx

# 5. 기존 컨테이너 중지
docker stop planning-poker
docker rm planning-poker

# 6. 새 컨테이너 이름 변경
docker rename planning-poker-new planning-poker
```

## 📚 다음 단계

- [Docker 가이드](DOCKER.md) - Docker 관련 상세 가이드
- [시작하기](GETTING_STARTED.md) - 로컬 개발 환경 설정
- [아키텍처](ARCHITECTURE.md) - 프로젝트 구조 이해
