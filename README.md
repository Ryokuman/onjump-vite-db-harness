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
cp .env.example .env
```

서버와 Vite는 각각 별도 터미널에서 실행합니다.

```bash
npm run dev:server
npm run dev
```

브라우저에서 `http://localhost:5177`을 엽니다.

기본 포트는 아래와 같습니다.

- Vite 화면: `http://localhost:5177`
- Harness server: `http://localhost:4317`
- Docker Postgres: `localhost:55432`

`.env.example`의 기본값은 로컬 Docker DB와 Vite origin에 맞춰져 있습니다.

## 데모 흐름

1. `TASK-0036 식단 로그와 빠른 체크` 화면이 Vite로 실행됩니다.
2. mock user dependency와 `task-0036-user` DB baseline이 주입됩니다.
3. `DB Inspector`가 `users`, `auth_provider_identities`, `goals`, `daily_checks`, `food_logs` row를 보여줍니다.
4. 제품 API를 `DATABASE_URL=postgres://onjump:onjump@localhost:55432/onjump_harness ENABLE_DEV_LOGIN=true ENABLE_MOCK_SOCIAL_LOGIN=true PORT=4000 npm --workspace @onjump/api run dev`로 실행합니다.
5. `직접 입력 저장`을 누르면 제품 API가 Docker Postgres의 `food_logs`와 `daily_checks`를 갱신합니다.
6. `빠른 체크`와 `미기록`은 제품 API의 `/today/food/status`를 호출합니다.
7. `validation 실패 확인`은 `name=""`, `calories=-10` 입력이 저장되지 않는지 확인합니다.
8. `DB 초기화`를 누르면 baseline seed로 돌아갑니다.

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
