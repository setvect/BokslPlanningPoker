# scripts/build.ps1
# 플래닝 포커 Docker 빌드 스크립트 (Windows PowerShell)

param(
    [string]$Mode = "dev",  # dev, fast, prod, clean
    [string]$Platform = "local",  # local, production
    [switch]$NoBuild = $false,
    [switch]$Verbose = $false
)

# 색상 출력 함수
function Write-ColorOutput([string]$ForegroundColor, [string]$Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success([string]$Message) {
    Write-ColorOutput "Green" "✅ $Message"
}

function Write-Info([string]$Message) {
    Write-ColorOutput "Cyan" "ℹ️  $Message"
}

function Write-Warning([string]$Message) {
    Write-ColorOutput "Yellow" "⚠️  $Message"
}

function Write-Error([string]$Message) {
    Write-ColorOutput "Red" "❌ $Message"
}

function Write-Header([string]$Message) {
    Write-ColorOutput "Magenta" "🚀 $Message"
}

# 메인 스크립트 시작
Write-Header "복슬 플래닝 포커 Docker 빌드 스크립트"
Write-Info "모드: $Mode, 플랫폼: $Platform"

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Info "프로젝트 디렉토리: $projectRoot"

# Docker가 설치되어 있는지 확인
try {
    $dockerVersion = docker --version
    Write-Success "Docker 발견: $dockerVersion"
} catch {
    Write-Error "Docker가 설치되어 있지 않습니다. Docker Desktop을 설치해주세요."
    exit 1
}

# Docker Compose가 설치되어 있는지 확인
try {
    $composeVersion = docker-compose --version
    Write-Success "Docker Compose 발견: $composeVersion"
} catch {
    Write-Error "Docker Compose가 설치되어 있지 않습니다."
    exit 1
}

switch ($Mode) {
    "fast" {
        Write-Header "⚡ 빠른 개발 환경 실행 (빌드 없음)"
        
        Write-Info "기존 컨테이너 정지..."
        docker-compose -f docker-compose.yml down 2>$null
        docker-compose -f docker-compose.prod.yml down 2>$null
        docker-compose -f docker-compose.dev.yml down 2>$null
        
        Write-Info "빠른 개발 서버 시작 중..."
        docker-compose -f docker-compose.dev.yml up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "빠른 개발 서버 시작 완료!"
            Write-Info ""
            Write-Info "⏳ 서버 준비 대기 중 (약 30-60초 소요 - npm install 포함)..."
            Start-Sleep -Seconds 30
            
            Write-Info "📱 클라이언트: http://localhost:5173"
            Write-Info "🖥️  서버: http://localhost:3001"
            Write-Info "🏥 헬스체크: http://localhost:3001/health"
            Write-Info ""
            Write-Info "💡 유용한 명령어:"
            Write-Info "   로그 보기: docker-compose -f docker-compose.dev.yml logs -f"
            Write-Info "   서버만 로그: docker-compose -f docker-compose.dev.yml logs -f server"
            Write-Info "   클라이언트만 로그: docker-compose -f docker-compose.dev.yml logs -f client"
            Write-Info "   중지하기: docker-compose -f docker-compose.dev.yml down"
        } else {
            Write-Error "빠른 개발 서버 시작 실패"
            exit 1
        }
    }
    
    "clean" {
        Write-Header "🧹 Docker 정리 작업"
        
        Write-Info "기존 컨테이너 중지 및 제거..."
        docker-compose -f docker-compose.yml down --remove-orphans 2>$null
        docker-compose -f docker-compose.prod.yml down --remove-orphans 2>$null
        docker-compose -f docker-compose.dev.yml down --remove-orphans 2>$null
        
        Write-Info "사용하지 않는 이미지 정리..."
        docker image prune -f
        
        Write-Info "사용하지 않는 볼륨 정리..."
        docker volume prune -f
        
        Write-Info "사용하지 않는 네트워크 정리..."
        docker network prune -f
        
        Write-Success "정리 작업 완료!"
    }
    
    "dev" {
        Write-Header "🔧 개발 환경 빌드 및 실행"
        
        if (-not $NoBuild) {
            Write-Info "개발용 Docker 이미지 빌드 중..."
            # 병렬 빌드로 시간 단축
            docker-compose -f docker-compose.yml build --parallel
            if ($LASTEXITCODE -ne 0) {
                Write-Error "빌드 실패"
                exit 1
            }
        }
        
        Write-Info "개발 서버 시작 중..."
        docker-compose -f docker-compose.yml up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "개발 서버 시작 완료!"
            Write-Info ""
            Write-Info "⏳ 서버 준비 대기 중 (약 10-15초 소요)..."
            Start-Sleep -Seconds 15
            
            Write-Info "📱 클라이언트: http://localhost:5173"
            Write-Info "🖥️  서버: http://localhost:3001"
            Write-Info "🏥 헬스체크: http://localhost:3001/health"
            Write-Info ""
            Write-Info "💡 유용한 명령어:"
            Write-Info "   로그 보기: docker-compose logs -f"
            Write-Info "   서버만 로그: docker-compose logs -f server"
            Write-Info "   클라이언트만 로그: docker-compose logs -f client"
            Write-Info "   중지하기: docker-compose down"
        } else {
            Write-Error "개발 서버 시작 실패"
            exit 1
        }
    }
    
    "prod" {
        Write-Header "🚀 프로덕션 환경 빌드 및 실행"
        
        if (-not $NoBuild) {
            Write-Info "프로덕션용 Docker 이미지 빌드 중..."
            docker-compose -f docker-compose.prod.yml build --no-cache
            if ($LASTEXITCODE -ne 0) {
                Write-Error "빌드 실패"
                exit 1
            }
        }
        
        Write-Info "프로덕션 서버 시작 중..."
        docker-compose -f docker-compose.prod.yml up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "프로덕션 서버 시작 완료!"
            Write-Info "🌐 웹사이트: http://localhost"
            Write-Info "🖥️  API 서버: http://localhost:3001"
            Write-Info "🏥 헬스체크: http://localhost:3001/health"
            Write-Info ""
            Write-Info "로그 보기: docker-compose -f docker-compose.prod.yml logs -f"
            Write-Info "중지하기: docker-compose -f docker-compose.prod.yml down"
        } else {
            Write-Error "프로덕션 서버 시작 실패"
            exit 1
        }
    }
    
    default {
        Write-Error "알 수 없는 모드: $Mode"
        Write-Info "사용법: .\scripts\build.ps1 -Mode [fast|dev|prod|clean] [-NoBuild] [-Verbose]"
        Write-Info ""
        Write-Info "예시:"
        Write-Info "  .\scripts\build.ps1 -Mode fast     # 빠른 개발 환경 (빌드 없음, 권장)"
        Write-Info "  .\scripts\build.ps1 -Mode dev      # 개발 환경 빌드 및 실행"
        Write-Info "  .\scripts\build.ps1 -Mode prod     # 프로덕션 환경 빌드 및 실행"
        Write-Info "  .\scripts\build.ps1 -Mode clean    # Docker 정리"
        Write-Info "  .\scripts\build.ps1 -Mode dev -NoBuild  # 빌드 없이 실행"
        exit 1
    }
}

Write-Success "스크립트 실행 완료!" 