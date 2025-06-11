#!/bin/bash
# scripts/setup-nginx-ssl.sh - nginx + SSL 자동 설정 스크립트

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

# 파라미터 확인
DOMAIN=${1:-""}
EMAIL=${2:-""}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "도메인과 이메일이 필요합니다."
    echo ""
    echo "사용법: $0 <domain> <email>"
    echo "예시: $0 poker.example.com webmaster@example.com"
    exit 1
fi

echo -e "${GREEN}🔒 nginx + SSL 설정 시작${NC}"
echo -e "${BLUE}🌐 도메인: $DOMAIN${NC}"
echo -e "${BLUE}📧 이메일: $EMAIL${NC}"
echo ""

# 1단계: nginx 설치
print_step "1. nginx 설치..."
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "nginx 설치 완료"

# 2단계: nginx 설정
print_step "2. nginx 설정 파일 생성..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
# $DOMAIN nginx 설정
server {
    listen 80;
    server_name $DOMAIN;
    
    # Let's Encrypt ACME Challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # HTTP to HTTPS 리다이렉트 (SSL 설정 후 활성화)
    # return 301 https://\$server_name\$request_uri;
    
    # 임시로 직접 프록시 (SSL 설정 전)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 3단계: 사이트 활성화
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
print_success "nginx 설정 완료"

# 4단계: Certbot 설치
print_step "3. Certbot 설치..."
sudo apt install -y certbot python3-certbot-nginx
print_success "Certbot 설치 완료"

# 5단계: SSL 인증서 발급
print_step "4. SSL 인증서 발급..."
print_info "Let's Encrypt SSL 인증서를 발급합니다..."
print_warning "도메인이 이 서버의 IP를 가리키고 있는지 확인하세요!"

# 비대화형 모드로 인증서 발급
if sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL; then
    print_success "SSL 인증서 발급 성공!"
else
    print_error "SSL 인증서 발급 실패"
    print_info "수동으로 실행하세요: sudo certbot --nginx -d $DOMAIN"
    exit 1
fi

# 6단계: nginx 설정 업데이트 (HTTPS 리다이렉트 활성화)
print_step "5. HTTPS 리다이렉트 설정..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
# $DOMAIN nginx 설정 (SSL 포함)
server {
    listen 80;
    server_name $DOMAIN;
    
    # HTTP to HTTPS 리다이렉트
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL 설정 (Certbot에서 자동 추가됨)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 복슬 플래닝 포커 프록시
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS 및 보안 설정
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Server \$host;
    }
}
EOF

# 7단계: nginx 재시작
sudo nginx -t
sudo systemctl reload nginx
print_success "HTTPS 설정 완료"

# 8단계: 방화벽 설정
print_step "6. 방화벽 설정..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 22
    print_success "방화벽 설정 완료"
else
    print_info "ufw가 설치되지 않음. 방화벽 설정을 건너뜁니다."
fi

# 9단계: 자동 갱신 설정
print_step "7. SSL 인증서 자동 갱신 설정..."
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
print_success "SSL 인증서 자동 갱신 설정 완료"

# 완료 메시지
echo ""
print_success "🎉 nginx + SSL 설정이 완료되었습니다!"
echo ""
print_info "🌐 접속 URL:"
echo "   https://$DOMAIN (HTTPS - 권장)"
echo "   http://$DOMAIN (HTTP - 자동으로 HTTPS로 리다이렉트)"
echo ""
print_info "📊 상태 확인 명령어:"
echo "   sudo nginx -t                    # nginx 설정 테스트"
echo "   sudo systemctl status nginx     # nginx 상태"
echo "   sudo certbot certificates       # SSL 인증서 상태"
echo "   curl -I https://$DOMAIN         # HTTPS 응답 헤더 확인"
echo ""
print_info "🔄 인증서 갱신:"
echo "   sudo certbot renew              # 수동 갱신"
echo "   sudo crontab -l                 # 자동 갱신 확인"

# 추가 테스트 명령어
curl -I http://$DOMAIN 