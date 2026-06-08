# Cartesia Take-Home — Design Brief

**Role:** Product Design Lead  
**Exercise:** Give Your Agent a Face  
**Date:** 2026-06-02

---

## 핵심 아이디어

### "데모가 곧 판매 도구"

Cartesia가 왜 voice agent with face를 정면에 안 박냐는 게 핵심 질문.

지금 console.cartesia.ai의 Welcome 화면은 **Try Sonic / Try Ink / Read the docs / Get API key** — 모두 기능 단위. 개발자를 위한 도구 목록.

하지만 가장 강력한 획득 루프는 이거임:

> "우리가 직접 만든 얼굴 달린 AI 에이전트를 먼저 경험하게 하고,  
> 그 다음 '너도 이거 만들 수 있어'로 이어지는 것"

ElevenLabs가 바이럴 된 것도 결국 **사람들이 직접 체험하고 공유**했기 때문.  
Cartesia가 자기 기술(TTS + 실시간 + 아바타)로 만든 데모 에이전트를 첫 화면에 박으면 — 텍스트 설명보다 10배 강력한 세일즈 도구가 된다.

---

## ⭐ THE THESIS — "Create" 가 아니라 "Hire"

**과제의 척추. 모든 화면 결정이 여기서 나온다.**

### 프레임 전환

| | ❌ 대부분 후보가 갈 길 | ✅ 우리 프레임 |
|--|----------------------|---------------|
| 동사 | "Create an avatar" | **"Hire the right AI face & voice for your customer"** |
| 첫 화면 | 사진 업로드 | **"Who are you serving?"** |
| 사용자 행동 | 자유롭게 고르기 | 시스템이 맥락에 맞게 추천 → 미세조정 |
| 최적화 대상 | 예쁜 얼굴 / 인기 보이스 | **내 고객이 편하게 느끼는 페르소나** |

### 왜 이게 맞는가

지금까지 CS / Sales는 **사람**이 했다. 그래서 기업은 한 번도:
1. "어떤 보이스(성별·톤)가 우리 고객에게 맞는지"
2. "어떤 얼굴·배경이 적당한지"

**고민해 본 적이 없다.** 자유도를 주면 → 결정 마비(decision paralysis) → "그냥 제일 예쁜 거" 라는 잘못된 최적화.

사용자가 진짜 원하는 것:
> "내 고객이 더 편하고 쉽게 상담하고 구매할 수 있는 AI를 고용하고 싶다"

가장 인기있는 보이스도 X, 가장 잘생긴 얼굴도 X.  
**Task-fit > Beauty. Task-fit > Realism.**

### 이 프레임이 동시에 해결하는 것

- **Uncanny valley 우회** — "예쁜 사람"을 좇으면 uncanny에 빠지지만, "이 맥락에 신뢰감 주는 페르소나"를 좇으면 사실성보다 적합성이 우선됨. (다른 워크트리에서 연구 중인 live uncanny 문제와 짝을 이룸)
- **Decision paralysis 제거** — 빈 캔버스 대신 "당신의 고객은?" 한 질문으로 시작
- **업로드 플로우 강등** — "이미지 업로드"는 가치가 아니라 기능. Step 3의 옵션으로 내려감

### Reframed Creation Flow

```
Step 1 — Who are you serving?
  Customer Support / Sales / Healthcare / Onboarding / Education ...
  (또는 고객 특성: B2B 임원? 불안한 환자? 캐주얼 소비자?)

Step 2 — Here's who we'd hire for them   ← MAGIC MOMENT
  시스템이 맥락에 맞는 페르소나 추천:
  "차분한 30대 여성 · 따뜻한 톤 · 의료 환경에 맞는 중립 배경"
  + 왜 이 조합인지 1줄 (신뢰의 근거)

Step 3 — Make them yours
  추천 기반 미세조정 (보이스 변형 · 얼굴 교체 · 브랜드 컬러)

Step 4 — Preview in context
  실제 상담/세일즈 시나리오로 말하는 모습

Step 5 — Deploy
  embed snippet / widget URL
```

핵심: **Step 1이 업로드가 아니라 "고객이 누구인가"라는 질문.**

### 메타 레벨 — Cartesia 자신이 첫 사용자 (dogfooding)

> "Cartesia의 고객은 누구이고, 우리는 어떤 보이스로 이걸 처음부터 만들까?"

- Cartesia 고객 = **개발자 / 제품팀** (B2B, 기술적, 신뢰·정확성 중시)
- 그럼 Welcome 화면 데모 에이전트는 화려한 게 아니라 → **명료하고 신뢰감 있는, 개발자에게 먹히는 페르소나**
- 즉 "Hire" 플로우의 **첫 번째 사용자가 Cartesia 자신**: *"We hired this face for developers"*

제품이 자기 논리로 닫힘:
> Cartesia가 이 플로우로 자기 데모 에이전트를 만들었고 → 그 데모를 본 고객이 "나도 우리 고객용으로 hire하고 싶다" → 다시 이 플로우로 진입.

### 추천 엔진 입력 — 스코핑 결정

| 옵션 | 설명 | 트레이드오프 |
|------|------|-------------|
| **A. Use-case 카테고리** | Sales / Support / Health 에서 고르기 | 빠르고 명확, 4–5h 스코프에 적합 |
| B. 고객 특성 질문 | 2–3개 질문으로 페르소나 생성 | 유연하지만 복잡 |
| **✅ Hybrid (추천)** | A를 베이스, B의 미세조정 살짝 | 명확함 + 개인화 |

---

## Part 1: Competitive Teardown

### 핵심 프레임 — Same goal, different belief

ElevenLabs와 Cartesia는 같은 목표(foundational audio)를 향해 달리지만, 사용자를 대하는 철학이 근본적으로 다르다.

| | Cartesia | ElevenLabs |
|--|----------|------------|
| **정체성** | Research lab that demos its tech | Product company built for outcomes |
| **첫 질문** | "우리 기술이 뭔지 볼래?" | "당신은 뭘 만들러 왔어?" |
| **IA 기준** | 시스템이 가진 것 (API keys, Models, Usage) | 사용자가 만드는 것 (Speech, Voices, Agents) |
| **콘텐츠 패널** | 기능 노출 → 스스로 탐색 | 인라인 가이드 → context 안에서 학습 |

**세 가지 비교 축:**

1. **Onboarding funnel** — ElevenLabs는 진입 즉시 use-case를 묻고 이후 모든 경험을 거기에 맞춘다. Cartesia는 콘솔로 직행.
2. **Side nav / IA** — ElevenLabs의 네비는 output 기준(무엇을 만드는가). Cartesia의 네비는 input 기준(무엇을 갖고 있는가).
3. **Content panel** — ElevenLabs는 패널 안에서 가르치면서 빌드하게 한다. Cartesia는 깔끔하지만 조용하다.

**결론:** Cartesia는 cutting-edge 기술을 갖고 있지만 아직 research lab 언어로 말하고 있다. 격차를 좁히려면 기술이 아니라 사용자의 goal을 출발점으로 삼는 IA와 onboarding이 필요하다.

---

### 세부 비교 (이미지/영상 첨부 예정)

**① Onboarding funnel**

**② Side nav / IA**

**③ Content panel**

---

### 경쟁사: ElevenLabs (기존 finding 3개)

**1. 실시간 대화 에이전트 데모를 첫 화면에 박음**

- elevenlabs.io 랜딩에 바로 "Talk to an AI" CTA
- 기술 설명 전에 체험 먼저
- **왜 더 나음:** 개발자도 사람 — "와 이거 되네"를 먼저 느끼면 문서 읽을 동기가 생김
- **Cartesia 적용:** Welcome 화면에 아바타 에이전트 데모 위젯 삽입. "The developer platform for AI voice" 아래에 바로 Live demo

**2. 음성 라이브러리 미리듣기 UX**

- 각 음성에 즉시 재생 + 텍스트 커스텀 입력 가능
- Cartesia는 리스트에서 재생만 됨, 텍스트 바꾸려면 TTS 플레이그라운드로 이동해야 함
- **왜 더 나음:** 의사결정 컨텍스트에서 바로 테스트 가능
- **Cartesia 적용:** Voice Library 카드에 인라인 텍스트 입력 + 즉시 생성

**3. Agent 템플릿 갤러리**

- 카테고리별 에이전트 템플릿 (Customer Support, Sales, Education 등) 시각적으로 브라우징 가능
- Cartesia는 "Basic Chat" 하나만, 선택지 없음
- **왜 더 나음:** 첫 에이전트를 만드는 인지 부하를 낮춤
- **Cartesia 적용:** Agent 생성 플로우에 use-case 갤러리 추가

---

## Part 2: Give Your Agent a Face

### 컨셉: "Voice agent with a face — yours to ship in 5 minutes"

Cartesia 콘솔에서 기존 에이전트에 아바타 레이어를 붙이는 플로우.

### 5단계 플로우

| Step | 화면 | 핵심 |
|------|------|------|
| 1 | **Agent 상세** | Configuration 탭 옆에 **Avatar** 탭 추가 (Beta 배지) |
| 2 | **Upload** | 이미지 업로드 (photo / illustration / character). 드래그앤드롭, URL 입력, 갤러리 선택 |
| 3 | **Configure** | 표현도(Expressiveness), 배경, 디스플레이 비율 설정 |
| 4 | **Preview** | 아바타가 에이전트 음성으로 말하는 라이브 프리뷰. "Call" 버튼으로 실시간 테스트 |
| 5 | **Deploy** | `<script>` 스니펫 또는 위젯 URL. One-click copy |

### 핵심 디자인 결정

**왜 탭 안에 넣나 (별도 메뉴 X)**
- 아바타는 에이전트의 속성, 독립 기능이 아님
- 기존 Configuration → Deployment 플로우에 자연스럽게 끼워짐

**왜 "Beta" 배지**
- Cartesia의 기존 패턴 (Language detection에도 Beta 사용)
- 기대치 관리 + 얼리어답터 신호

**왜 이미지 하나만**
- 복잡도 낮춤. 일단 static avatar로도 충분히 가치 있음
- 립싱크/모션은 다음 단계

**왜 배경에 모션**
- static face + moving background = 살아있는 느낌의 최소 비용 구현
- Cartesia 기술 시연에 집중, 아바타 생성 AI는 서드파티

### 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 얼굴 없는 이미지 업로드 | 경고 토스트 + 계속 진행 가능 (캐릭터/마스코트도 허용) |
| 아바타 off 상태 | 토글로 비활성화, 설정은 저장됨 |
| 임베드 후 에이전트 설정 변경 | 위젯은 자동 최신화 (agent_id 기반) |
| 모바일에서 위젯 | 기본 비율 설정에서 모바일 대응 옵션 제공 |

### 스코핑 결정 (하지 않은 것)

- 에이전트 생성/수정 — 기존 것 그대로
- 립싱크 / 실시간 표정 — V2
- 멀티 아바타 / 아바타 라이브러리 — V2
- 아바타 생성 AI 직접 통합 — 파트너십 또는 V3

---

## 다음에 탐구할 것

1. **Welcome 화면에 Live demo 에이전트 위젯** — "Try before you build"
2. **아바타 템플릿 갤러리** — 이미지 없어도 바로 시작 가능
3. **Analytics** — 위젯 조회수, 대화 전환율 (Agent Metrics 확장)
4. **Whitelabel** — 기업 고객이 자체 도메인에 위젯 배포

---

## 브레인스토밍 — ChatGPT 대화 요약 (2026-06-02)

### 핵심 재정의: Avatar tool이 아니라 "Deployable business surface"

대부분의 후보자는 **avatar creation tooling** (upload wizard, style editor, animation controls)으로 갈 것.  
하지만 실제 고객이 돈 내는 순간은 **"사이트에서 실제로 잘 동작할 때"** 다.

> ❌ Wrong framing: "Advanced avatar configuration tool"  
> ✅ Better framing: "Turn your agent into a customer-facing personality"

---

### 검증할 Product Hypothesis 3가지

**Hypothesis 1 — Presence over realism**
> "Voice agents become more approachable and trustworthy with visual presence"

- Key screen: **Embedded Website Experience** (hero screen)
- Metrics: Engagement rate, Conversation duration, Onboarding completion, Trust

**Hypothesis 2 — Brand safety drives deployment**
> "Customers will deploy this if it feels brand-safe and easy"

- Key screen: **Deployment Configuration** (lightweight)
- Metrics: Deployment intent, Brand confidence, Time-to-deploy

**Hypothesis 3 — Minimal motion creates enough presence**
> "Subtle embodiment (blink, idle breathing) is enough — full realism not needed"

- Key screen: **Speaking / Listening States**
- Metrics: Presence perception, Comfort (not creepy), Attention

---

### Key Screen 우선순위 (metric 역산)

| 우선순위 | Screen | 검증하는 것 |
|----------|--------|-------------|
| 1 | **Embedded Website Experience** | "이걸 실제 deploy하고 싶은가?" |
| 2 | **Conversation State** (speaking/listening/idle) | "Minimal embodiment이 presence를 만드는가?" |
| 3 | **Lightweight Deploy Config** | "쉽고 brand-safe하게 launch 가능한가?" |

Upload wizard는 **low-value** — novelty는 있지만 deployment desire를 증명 못 함.

---

### "Creepy" 문제 해결 원칙

**절대 피해야 할 느낌:** metaverse, VTuber, uncanny human, gaming NPC, crypto AI  
**가야 할 느낌:** Linear / Stripe / Arc / Notion 수준의 premium software aesthetic

> **Principle: Presence over realism**  
> Task-first framing이 되면 얼굴도 자연스러워진다.  
> "Setup assistant", "Pricing guide", "Onboarding concierge" — 역할이 명확하면 덜 이상함.

---

### Magic Moment 설계

업로드하자마자 일어나야 하는 것:

```
BEFORE: 정적 이미지
↓
AFTER: subtle breathing + blink + tiny mouth motion + speaking preview
```

업로드 직후 contextual framing 예시:
> "Your onboarding assistant is ready.  
> Visitors can now speak naturally with your agent directly on your website."

---

### Primary Metric

**Deployment Intent** — "우리 사이트에 넣고 싶다"를 느끼는가

| Supporting Metric | Why |
|-------------------|-----|
| Engagement | 더 interact 하나 |
| Trust | 더 human하게 느끼나 |
| Brand fit | 브랜드와 어울리나 |
| Clarity | 뭘 하는지 이해되나 |
| Comfort | creepy하지 않나 |

---

### Writeup에 쓸 framing

> Rather than focusing on avatar creation tooling, I focused on validating whether embodied voice agents meaningfully improve deployability, approachability, and customer engagement in real website contexts.

---

### 실제 Face Avatar + Voice 서비스 / 예제 레퍼런스

> ⚠️ PDF에서 추출 필요 — 아래는 채울 공간

- [ ] PDF에서 언급된 실제 데모 서비스들
- [ ] 써볼 수 있는 예제 사이트들
- [ ] Cartesia API로 구현 가능한 방식 예시

---

## 메모 / 브레인스토밍

- Cartesia의 강점은 **latency** — 아바타도 latency로 차별화 가능 ("< 200ms response face")
- 경쟁사 대비 Cartesia의 포지셔닝: "개발자가 진짜 쓰는 API" → 아바타도 "개발자가 embed할 수 있는 위젯"으로 포지셔닝
- 첫 화면 데모 에이전트 이름 제안: "Ask Aria" 또는 브랜드 마스코트화 가능
