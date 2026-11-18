# Job Simulator AI: 실서비스와 데모를 분리한 LLM 연습 도구

[English](PORTFOLIO.md) | [한국어](PORTFOLIO.ko.md)

## 요약

고객 응대·면접·영업 대화를 LLM 상대와 연습하고, 강점·개선점과 0~100점 척도의 네 가지 점수로 된 구조화된 피드백을 받는 Next.js 애플리케이션이다. 역할극은 3개 범주 x 3개 난이도, 모두 9개의 시나리오 프롬프트로 움직인다. 핵심 설계는 실제 LLM 출력과 체크인된 데모 출력을 서로 다른 경로로 분명히 나눈 것이다.

## 어려웠던 점

- 상대 역할이 대화 내내 유지돼야 하므로, 매 요청에 선택한 persona와 지금까지의 대화를 함께 보낸다.
- 검토자는 보통 API 키나 데이터베이스가 없다. 그래도 역할극에서 피드백까지의 흐름을 볼 수 있어야 하고, 예시를 실제 사용자 기록으로 오해해서도 안 된다.
- 피드백은 화면에 그리고 저장할 수 있는 형태로 와야 하므로, 자유 텍스트를 내는 모델에 구조화된 출력을 요청해야 한다.

## 설계 판단

**1. 자격증명 없이 어떻게 동작시킬 것인가.**
선택지: 어떤 사용이든 API 키와 데이터베이스를 요구, 앱 전체를 목업, 또는 연동마다 해당 환경 변수로 분기. 선택: 변수별 분기. `/api/chat`과 `/api/feedback`은 `OPENROUTER_API_KEY`가 있을 때만 모델을 호출하고, 없으면 체크인된 데모 응답과 고정 데모 피드백을 반환한다. `/api/session`은 Supabase URL이 있을 때만 데이터베이스에 쓰고, 없으면 UUID를 발급한다. 데모 피드백은 브라우저 `sessionStorage`에만 남는다. 이유: 검토자가 비밀 값 없이 흐름을 따라갈 수 있고, 데모 내용이 실제 세션과 같은 저장소에 섞이지 않는다. 대가: 라우트마다 경로가 둘이 되고, 고정 데모 점수가 실제 출력처럼 보일 수 있으며, 첫 화면은 여전히 로딩 시 Supabase 클라이언트를 호출한다.

**2. 어떤 LLM 인터페이스를 쓸 것인가.**
선택지: 특정 공급자 SDK 하나, 또는 OpenRouter를 가리키는 OpenAI 호환 클라이언트. 선택: 후자. 모델은 `OPENROUTER_MODEL`에서 읽고 기본값은 `google/gemini-2.0-flash-exp:free`다. 이유: 코드 수정 없이 설정만으로 모델을 바꿀 수 있다. 대가: 동작이 설정된 모델에 따라 달라지고, 무료 기본 모델은 바뀌거나 사라질 수 있으며, `@anthropic-ai/sdk`는 어떤 라우트도 쓰지 않지만 `package.json`에 남아 있다.

**3. 피드백을 어떤 형태로 받을 것인가.**
선택지: 자유 텍스트 코칭, 또는 고정 필드를 가진 JSON. 선택: 강점, 개선점, `total_score`, `empathy_score`, `problem_solving_score`, `communication_score`를 담은 JSON. 화면에 점수 링을 그리고 대시보드에서 저장된 결과를 평균 낼 수 있다. 대가: 숫자가 정밀해 보이지만 보정되지 않았다. 라우트는 모델 텍스트를 스키마 검증 없이 JSON으로 파싱하므로 형식이 깨진 응답에는 HTTP 500을 반환한다. 화면은 `empathy_score`를 "COMMUNICATION"으로, `communication_score`를 "ADAPTABILITY"로 표시한다.

## 결과

| 구현된 것 | 근거 |
|---|---|
| 9개 시나리오 프롬프트와 고정 첫 대사 | `lib/personas.ts` |
| 실제/데모 분기를 갖춘 세션·채팅·피드백 API | `app/api/session`, `app/api/chat`, `app/api/feedback` |
| 선택적 Supabase 저장, Google 로그인, 사용자별 대시보드 | `lib/supabase.ts`, `lib/auth.ts`, `app/dashboard/page.tsx` |
| 모든 연동의 변수 이름 | `.env.example` |

## 한계

- 연습 흐름을 연결한 앱이며, 코칭 효과가 입증된 도구가 아니다. 배포 URL, 활성 사용자 수, 응답 지연 시간, 피드백 품질 연구, 다른 시스템이나 사람 코치와의 비교가 없다.
- 네 가지 점수는 코칭 인터페이스이며 채용 판단이나 교육 평가가 아니다.
- Supabase 변수 없이 브라우저에서 동작하는지는 확인되지 않았다(코드를 읽어 확인).
- 깨끗한 설치 환경에서 `npm run lint`와 `npm run build`의 통과는 확인되지 않았다(README 참고).

## 다음에 할 일

1. 점수 이름표를 바로잡고, API 경계에서 피드백 JSON을 스키마로 검증한다.
2. 첫 화면의 Supabase 호출에 조건을 걸어 자격증명 없는 데모 경로가 처음부터 끝까지 동작하게 하고, 깨끗한 `npm ci`와 `npm run build`로 확인한다.
3. Supabase 스키마와 RLS 정책을 버전 관리하고 실제·데모 경로의 통합 테스트를 추가한다.
4. 루브릭을 정의하고 LLM 점수와 훈련된 사람 평가자 사이의 일치도, 시나리오별 편향을 측정한다. 그 전에는 점수를 연습용 피드백 이상으로 내세우지 않는다.

## 근거

- 구현 개요: [`README.ko.md`](README.ko.md)
- 구조: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 라우트: `app/api/session`, `app/api/chat`, `app/api/feedback`
