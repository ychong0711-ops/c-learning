# 배포 가이드 (VPS / Docker)

## 1. 환경 준비
```bash
cp .env.example .env
```

## 2. 빌드 및 실행
```bash
docker compose up -d --build
```

## 3. DB 스키마 적용 (최초 1회)
```bash
docker compose exec app npx drizzle-kit push
```

## 4. 접속
- 브라우저: `http://<server-ip>:3000`
- 헬스 체크: `http://<server-ip>:3000/api/health`

## 5. 오프라인 사용 준비
- PWA 설치 후 `/standalone`, `/offline-ide` 1회 방문
- Shiro/TCC 캐시 워밍
- JSON 백업/복원으로 진행도 보존

## 6. 보안 권장
- PostgreSQL 비밀번호 변경
- 방화벽에서 5432 직접 노출 제거
- Reverse proxy (Nginx/Caddy) + HTTPS 적용