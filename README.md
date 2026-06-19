# onjump-vite-db-harness

Vite로 특정 화면 또는 화면 일부를 띄우고, mock dependency와 Docker test DB를 함께 확인하는 페이지 테스트 하네스입니다.

## 목표

- Storybook 대신 실제 backend/DB side effect를 확인합니다.
- 개발 중인 화면 옆에 DB table panel을 띄웁니다.
- mock user data를 Docker Postgres에 seed하고, 저장/삭제 후 row 변화를 바로 확인합니다.
- production DB와 secret을 사용하지 않습니다.

## 실행

```bash
npm install
docker compose up -d db
npm run dev:server
npm run dev
```

브라우저에서 `http://localhost:5177`을 엽니다.

## 데모 흐름

1. `운동 로그 기록` 화면이 Vite로 실행됩니다.
2. mock user dependency가 주입됩니다.
3. `DB Inspector`가 `workout_logs` table row count와 최근 row를 보여줍니다.
4. `저장`을 누르면 backend API가 Docker Postgres에 row를 추가합니다.
5. `최근 기록 삭제`를 누르면 row가 삭제됩니다.
6. `DB 초기화`를 누르면 baseline seed로 돌아갑니다.

## 검증

```bash
npm test
npm run typecheck
npm run build
```

## 안전 규칙

- production DB URL을 사용하지 않습니다.
- secret 값은 repo에 기록하지 않습니다.
- `npm run dev:server`는 `DATABASE_URL` host가 `localhost`, `127.0.0.1`, `::1`, `db`, `host.docker.internal` 중 하나가 아니면 시작하지 않습니다.
- `DATABASE_URL`의 `host`, `port` query override는 `pg` 연결 대상 우회를 막기 위해 허용하지 않습니다.
- DB 이름에는 `harness`, `test`, `local`, `dev` 중 하나가 포함되어야 합니다.
- Vite 화면의 API base URL은 `HARNESS_SERVER_PORT`, `VITE_HARNESS_SERVER_PORT`, 또는 `VITE_HARNESS_API_BASE_URL`로 server port와 맞출 수 있습니다.
- mutating endpoint는 기본적으로 `http://localhost:5177`, `http://127.0.0.1:5177`, 또는 `HARNESS_ALLOWED_ORIGINS`에 등록된 Origin만 허용합니다.
- DB inspector는 manifest에 allowlist된 table과 column만 보여줍니다.
- arbitrary SQL editor는 제공하지 않습니다.
