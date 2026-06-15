import type { ContentEntry } from './types'

export const SHELL_ENTRIES: ContentEntry[] = [
  { key: 'shell.nav.back-all-agents', value: { en: 'Back', ko: '뒤로' }, context: 'Back link at the top of the agent-scoped sidebar. Was "All Agents"; shortened since the agent switcher box now carries the context.', surface: 'shell', kind: 'cta' },
  { key: 'shell.nav.switcher-empty', value: { en: 'No other agents yet', ko: '다른 에이전트가 아직 없습니다' }, context: 'Empty state inside the sidebar agent-switcher dropdown.', surface: 'shell', kind: 'empty' },
  { key: 'shell.nav.agent-eyebrow', value: { en: 'Agent', ko: '에이전트' }, context: 'Tiny uppercase eyebrow above the agent name in the sidebar box.', surface: 'shell', kind: 'label' },
  { key: 'shell.nav.new-agent-eyebrow', value: { en: 'New agent', ko: '새 에이전트' }, context: 'Eyebrow while the builder is drafting (Draft badge beside it).', surface: 'shell', kind: 'label' },
  { key: 'shell.nav.draft-badge', value: { en: 'Draft', ko: '초안' }, context: 'Badge on an unfinished builder agent.', surface: 'shell', kind: 'badge' },
  { key: 'shell.nav.your-agents', value: { en: 'Your agents', ko: '내 에이전트' }, context: 'Label for the built-agents list nested under the Voice Agents nav item.', surface: 'shell', kind: 'label' },
  { key: 'shell.nav.more', value: { en: 'More ({n})', ko: '{n}개 더 보기' }, context: 'Expands the nested built-agents list past the newest 3.', surface: 'shell', kind: 'cta' },
  { key: 'shell.nav.less', value: { en: 'Show less', ko: '접기' }, surface: 'shell', kind: 'cta' },
  { key: 'shell.nav.section.configuration', value: { en: 'Configuration', ko: '구성' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.flow', value: { en: 'Observability', ko: '옵저버빌리티' }, context: 'Sidebar section label; slug stays "flow" for URL stability.', surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.deployment', value: { en: 'Deployment', ko: '배포' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.widget', value: { en: 'Widget', ko: '위젯' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.environment', value: { en: 'Environment', ko: '환경' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.knowledge-base', value: { en: 'Knowledge Base', ko: '지식 베이스' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.metrics', value: { en: 'Metrics', ko: '지표' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.calls', value: { en: 'Calls', ko: '통화' }, surface: 'shell', kind: 'label' },
  { key: 'shell.nav.section.settings', value: { en: 'Settings', ko: '설정' }, surface: 'shell', kind: 'label' },
]
