import type { ContentEntry } from './types'

export const AGENT_SHELL_ENTRIES: ContentEntry[] = [
  /* ── Detail header ── */
  { key: 'agent.header.preview', value: { en: 'Preview', ko: '미리보기' }, surface: 'agent', kind: 'cta' },
  { key: 'agent.header.publish', value: { en: 'Publish', ko: '게시' }, surface: 'agent', kind: 'cta' },
  { key: 'agent.header.publishing', value: { en: 'Publishing…', ko: '게시 중…' }, surface: 'agent', kind: 'status' },
  { key: 'agent.header.send-call', value: { en: 'Send Call to Phone Number', ko: '전화번호로 통화 보내기' }, context: 'Call split-button popover title.', surface: 'agent', kind: 'title' },
  { key: 'agent.tab.coming-soon', value: { en: '{tab} — coming soon', ko: '{tab} — 준비 중' }, surface: 'agent', kind: 'empty' },

  /* ── Configuration tab ── */
  { key: 'agent.config.title', value: { en: 'Configuration', ko: '구성' }, surface: 'agent', kind: 'title' },
  { key: 'agent.config.system-prompt', value: { en: 'System Prompt', ko: '시스템 프롬프트' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.generate', value: { en: 'Generate', ko: '생성' }, surface: 'agent', kind: 'cta' },
  { key: 'agent.config.initial-message', value: { en: 'Initial Message', ko: '첫 메시지' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.skip-intro', value: { en: 'Skip agent introduction', ko: '에이전트 인사 생략' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.avatar', value: { en: 'Avatar', ko: '아바타' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.avatar.badge-new', value: { en: 'New', ko: '신규' }, surface: 'agent', kind: 'badge' },
  { key: 'agent.config.avatar.select', value: { en: 'Select an avatar', ko: '아바타 선택' }, surface: 'agent', kind: 'cta' },
  { key: 'agent.config.avatar.voice-note', value: { en: 'Voice: {voice}', ko: '보이스: {voice}' }, surface: 'agent', kind: 'hint' },
  { key: 'agent.config.avatar.pair-hint', value: { en: 'Avatars are paired with a voice. Selecting one may update your current voice.', ko: '아바타에는 보이스가 짝지어져 있어 선택 시 현재 보이스가 바뀔 수 있습니다.' }, surface: 'agent', kind: 'hint' },
  { key: 'agent.config.avatar.browse', value: { en: 'Browse all →', ko: '전체 보기 →' }, surface: 'agent', kind: 'cta' },
  { key: 'agent.config.voice', value: { en: 'Voice & Language', ko: '보이스 & 언어' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.language-note', value: { en: 'Language: {language}', ko: '언어: {language}' }, surface: 'agent', kind: 'hint' },
  { key: 'agent.config.asr', value: { en: 'Automatic Speech Recognition', ko: '자동 음성 인식' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.asr.model', value: { en: 'Model', ko: '모델' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.asr.lang-detect', value: { en: 'Language detection', ko: '언어 감지' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.asr.lang-detect-hint', value: { en: "Auto-detect the caller's language and respond in kind. Supports English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, and Dutch.", ko: '콜러의 언어를 자동 감지해 같은 언어로 응답합니다. 영어, 스페인어, 프랑스어, 독일어, 힌디어, 러시아어, 포르투갈어, 일본어, 이탈리아어, 네덜란드어를 지원합니다.' }, surface: 'agent', kind: 'hint' },
  { key: 'agent.config.bg-sound', value: { en: 'Background Sound', ko: '배경 사운드' }, surface: 'agent', kind: 'label' },
  { key: 'agent.config.bg-sound-hint', value: { en: "Add sound to play in the background of your agent's speech.", ko: '에이전트 음성 뒤에 깔리는 배경 사운드를 추가합니다.' }, surface: 'agent', kind: 'hint' },
  { key: 'agent.config.choose-file', value: { en: 'Choose File', ko: '파일 선택' }, surface: 'agent', kind: 'cta' },
  { key: 'agent.config.no-file', value: { en: 'No file chosen', ko: '선택된 파일 없음' }, surface: 'agent', kind: 'status' },

  /* ── Preview panel ── */
  { key: 'preview.tab.build', value: { en: 'Build', ko: '빌드' }, context: 'The right dock: the conversational builder. Also the header toggle.', surface: 'preview', kind: 'label' },
  { key: 'preview.bar.test-cta', value: { en: 'Test call', ko: '테스트 콜' }, context: 'Bottom test bar — starts a browser call to the agent from any tab.', surface: 'preview', kind: 'cta' },
  { key: 'preview.phone.test-title', value: { en: 'Test your agent', ko: '에이전트 테스트' }, surface: 'preview', kind: 'title' },
  { key: 'preview.phone.test-sub', value: { en: 'Start a call to preview {name} over the phone.', ko: '{name}을(를) 전화로 미리 들어보세요.' }, surface: 'preview', kind: 'hint' },
  { key: 'preview.phone.live-call', value: { en: 'Live call', ko: '통화 중' }, surface: 'preview', kind: 'status' },
  { key: 'preview.phone.agent-speaking', value: { en: 'Agent speaking', ko: '에이전트 발화' }, surface: 'preview', kind: 'status' },
  { key: 'preview.phone.mic-muted', value: { en: 'Mic muted', ko: '마이크 음소거' }, surface: 'preview', kind: 'status' },
  { key: 'preview.phone.mic-connected', value: { en: 'Mic connected', ko: '마이크 연결됨' }, surface: 'preview', kind: 'status' },
  { key: 'preview.phone.label-agent', value: { en: 'Agent', ko: '에이전트' }, context: 'Waveform row label. Max ~6 chars — column is 28px wide.', surface: 'preview', kind: 'label' },
  { key: 'preview.phone.label-you', value: { en: 'You', ko: '나' }, surface: 'preview', kind: 'label' },
  { key: 'preview.widget.no-avatar-title', value: { en: 'No avatar yet', ko: '아직 아바타가 없습니다' }, surface: 'preview', kind: 'empty' },
  { key: 'preview.widget.select-avatar', value: { en: 'Select an avatar', ko: '아바타 선택' }, surface: 'preview', kind: 'cta' },
]
