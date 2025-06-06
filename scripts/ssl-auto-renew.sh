#!/bin/bash
# scripts/ssl-auto-renew.sh - SSL 인증서 자동 갱신 스크립트

# 로그 파일 설정
LOG_FILE="/var/log/ssl-renew.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 로그 함수
log_message() {
    echo "[$DATE] $1" | sudo tee -a $LOG_FILE
}

log_message "=== SSL 인증서 갱신 시작 ==="

# 갱신 전 인증서 만료일 확인
EXPIRY_DATE=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/poker.boksl.com/fullchain.pem | cut -d= -f2)
log_message "현재 인증서 만료일: $EXPIRY_DATE"

# 갱신 시도
log_message "certbot renew 실행 중..."
if sudo /usr/bin/certbot renew --quiet; then
    log_message "✅ 인증서 갱신 성공"
    
    # nginx 설정 테스트
    if sudo /usr/sbin/nginx -t; then
        log_message "✅ nginx 설정 검증 성공"
        
        # nginx 재로드
        if sudo /usr/sbin/nginx -s reload; then
            log_message "✅ nginx 재로드 성공"
        else
            log_message "❌ nginx 재로드 실패"
            exit 1
        fi
    else
        log_message "❌ nginx 설정 검증 실패"
        exit 1
    fi
    
    # 갱신 후 인증서 만료일 확인
    NEW_EXPIRY_DATE=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/poker.boksl.com/fullchain.pem | cut -d= -f2)
    log_message "갱신 후 인증서 만료일: $NEW_EXPIRY_DATE"
    
    # 컨테이너 상태 확인
    if docker ps | grep -q planning-poker; then
        log_message "✅ 복슬 플래닝 포커 컨테이너 정상 실행 중"
    else
        log_message "⚠️ 복슬 플래닝 포커 컨테이너 상태 확인 필요"
    fi
    
    # 웹사이트 접근 테스트
    if curl -f -s https://poker.boksl.com > /dev/null; then
        log_message "✅ 웹사이트 HTTPS 접근 성공"
    else
        log_message "⚠️ 웹사이트 HTTPS 접근 실패"
    fi
    
else
    log_message "❌ 인증서 갱신 실패"
    
    # 실패 시 알림 (선택사항)
    # echo "SSL 인증서 갱신 실패: poker.boksl.com" | mail -s "SSL 갱신 실패" admin@example.com
    
    exit 1
fi

log_message "=== SSL 인증서 갱신 완료 ==="
echo "갱신 작업이 완료되었습니다. 로그: $LOG_FILE" 