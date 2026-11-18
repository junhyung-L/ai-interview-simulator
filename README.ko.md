# Job Simulator AI

[English](README.md) · [프로젝트 자세히 보기](PORTFOLIO.ko.md)

고객 응대·면접·영업 대화를 연습하는 Next.js 웹앱입니다. 대화 유형과 난이도를 고르면 LLM 상대와 역할극을 하고, 대화가 끝나면 강점·개선점과 0~100점 척도의 네 가지 점수가 담긴 LLM 피드백 보고서를 받습니다. LLM 키가 없으면 스크립트 데모 경로로 동작합니다.

**구현 범위:** `lib/personas.ts`의 시나리오 프롬프트 9개(3개 범주 x 3개 난이도), 세션·채팅·피드백 API 라우트, `OPENROUTER_API_KEY`가 있으면 OpenRouter(여러 LLM을 묶은 호스팅 게이트웨이)로 LLM을 호출하고 없으면 스크립트 데모 응답을 쓰는 분기, 선택 기능인 Supabase(인증을 갖춘 호스팅 Postgres) 저장과 Google 로그인.

**바로 실행:** `npm ci` 후 `npm run dev`. 키가 없어도 채팅과 피드백은 데모 내용을 반환합니다(Supabase 의존성은 [한계](#한계) 참고).

바로 가기: [사례 연구와 설계 판단](PORTFOLIO.ko.md) · [앱 흐름](#앱-흐름) · [로컬 실행](#로컬-실행) · [한계](#한계)

## 구현한 기능

LLM이 생성하는 부분은 따로 표시했고, 나머지는 결정적으로 동작하는 코드입니다.

- 고객 응대·면접·영업 3개 범주와 초급·중급·고급 3단계 프롬프트를 `lib/personas.ts`에 정의합니다. 시나리오별 첫 대사는 고정 문구입니다.
- `/api/session`에서 세션을 만들며, Supabase를 설정하지 않으면 UUID를 대신 씁니다.
- `/api/chat`은 `OPENROUTER_API_KEY`가 있으면 OpenRouter 호환 클라이언트로 LLM을 호출하고(**LLM 생성** 응답), 없으면 스크립트 데모 응답을 반환합니다.
- `/api/feedback`은 강점·개선점과 네 가지 수치 점수를 LLM에 요청합니다(**LLM 생성**). API 키가 없으면 고정 데모 피드백을 반환합니다.
- Google OAuth, Supabase 저장, 세션별 피드백, 로그인 사용자의 누적 피드백 대시보드는 선택 기능입니다.

## 앱 흐름

```mermaid
flowchart LR
    A[시나리오·난이도·이름 선택] --> B["/api/session"]
    B --> C[역할극 대화 화면]
    C --> D["/api/chat"]
    D --> E{OPENROUTER_API_KEY 설정 여부}
    E -->|예| F[OpenRouter 호환 LLM 호출]
    E -->|아니오| G[스크립트 데모 응답]
    F --> H[대화 및 선택적 메시지 저장]
    G --> H
    H --> I["/api/feedback"]
    I --> J[LLM 또는 데모 피드백]
    J --> K[피드백 화면]
    K --> L[선택적 Supabase 대시보드]
```

## 구조와 데이터 처리

| 계층 | 역할 | 근거 파일 |
|---|---|---|
| 클라이언트 | 시나리오 선택, 채팅, 피드백, 대시보드, webview 안내 | `app/page.tsx`, `app/roleplay/page.tsx`, `app/feedback/page.tsx`, `app/dashboard/page.tsx`, `components/` |
| API | 세션 수명주기, 역할극 응답, 구조화된 피드백 요청 | `app/api/session/route.ts`, `app/api/chat/route.ts`, `app/api/feedback/route.ts` |
| LLM | `lib/personas.ts`의 시나리오 프롬프트와 API 라우트의 OpenRouter 호환 chat completion 호출 | `lib/personas.ts`, `app/api/chat/route.ts`, `app/api/feedback/route.ts` |
| 저장 | Supabase 브라우저 클라이언트와 sessions·messages·feedback 테이블 | `lib/supabase.ts`, `lib/auth.ts` |

Supabase 자격증명이 없으면 API 라우트는 데모 경로를 쓰고, 피드백은 브라우저의 `sessionStorage`에만 남습니다.

## 환경 변수

[`.env.example`](.env.example)을 `.env.local`로 복사한 뒤 필요한 연동만 채웁니다.

| 변수 | 설정했을 때 | 비워 두었을 때 |
|---|---|---|
| `OPENROUTER_API_KEY` | 실제 LLM 응답과 피드백 | 스크립트 데모 응답과 고정 데모 피드백 |
| `OPENROUTER_MODEL` | 모델 변경 | `google/gemini-2.0-flash-exp:free`(소스 기본값) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Google 로그인과 데이터베이스 저장 | 임의 세션 UUID, 피드백은 `sessionStorage`에 보관 |

데이터베이스 타입 선언은 `sessions`, `messages`, `feedback` 테이블을 기대합니다.

## 로컬 실행

Node.js 18.18 이상이 필요합니다(Next.js 15 요구 사항이며, `engines` 필드는 지정되어 있지 않습니다). 패키지 스크립트는 Next.js 15.1.4를 씁니다.

```powershell
npm ci
copy .env.example .env.local   # 선택 사항, 위 표 참고
npm run dev
```

Next.js가 출력하는 로컬 URL을 엽니다. 변수를 하나도 설정하지 않으면 `/api/chat`과 `/api/feedback`은 스크립트 응답을, `/api/session`은 임의 UUID를 반환합니다.

## 저장소 구조

```text
app/
  api/                 # 세션·채팅·피드백 라우트 핸들러
  auth/                # OAuth 콜백·오류 경로
  roleplay/            # 대화 화면
  feedback/            # 세션별 LLM 피드백 화면
  dashboard/           # 로그인 사용자의 저장 세션 요약
components/             # 인증 및 webview UI 보조 컴포넌트
lib/                    # persona, Supabase 클라이언트, 인증 도우미
public/                 # 로고와 favicon
.env.example            # 변수 이름만 기재(값 없음)
```

## 한계

- 소스 코드만 있습니다. 배포 서비스, 사용자 연구, 응답 지연 시간, 채용 성과, 모델 품질 평가를 검증한 자료는 없습니다.
- 네 가지 점수(`total_score`, `empathy_score`, `problem_solving_score`, `communication_score`)는 LLM이 생성하며 루브릭 보정, 사람 평가자 간 일치도, 테스트셋, 공정성 분석, 신뢰도 근거가 없습니다. 연습을 돌아보는 용도로만 쓰고 고용·교육·기타 고위험 판단에 쓰지 않습니다.
- 피드백 화면과 대시보드가 `empathy_score`를 "COMMUNICATION"으로, `communication_score`를 "ADAPTABILITY"로 표시합니다(`app/feedback/page.tsx`, `app/dashboard/page.tsx`).
- 피드백 라우트는 모델 텍스트를 스키마 검증 없이 JSON으로 파싱하므로, 형식이 깨진 응답에는 HTTP 500을 반환합니다.
- 첫 화면과 로그인 버튼이 로딩 시 Supabase 클라이언트를 호출하고 `lib/supabase.ts`는 Supabase 변수가 없으면 오류를 던지므로, 변수 없이 브라우저에서 동작하는지는 확인되지 않았습니다(코드를 읽어 확인).
- 깨끗한 `npm ci` 설치에서 `npm run lint`와 `npm run build`의 통과는 확인되지 않았습니다(2026년 11월 불완전한 `node_modules`로 시도했으나 시작되지 않음). `next.config.ts`가 `eslint.ignoreDuringBuilds`와 `typescript.ignoreBuildErrors`를 켜 두어, 빌드 성공만으로 lint·타입 검사 통과를 뜻하지 않습니다.
- Supabase 스키마와 RLS SQL이 버전 관리되어 있지 않고, 통합 테스트가 없습니다.
- 데모 모드는 클라이언트가 보낸 대화 데이터를 제한하지 않으며, LLM 호출에 악용 방지·rate limit·관측 기능이 없습니다.

## 문서

- [포트폴리오 사례 연구](PORTFOLIO.ko.md)
- [프로젝트 리뷰](docs/PROJECT_REVIEW.md)
- [아키텍처](docs/ARCHITECTURE.md)
- [CV 활용 가이드](docs/CV_BULLETS.md)
