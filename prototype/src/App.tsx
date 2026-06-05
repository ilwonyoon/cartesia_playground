import { useState } from 'react'
import { AppLayout } from './components/AppLayout'
import { WelcomePage } from './pages/WelcomePage'
import { VoiceAgentsPage } from './pages/VoiceAgentsPage'
import { VoiceLibraryPage } from './pages/VoiceLibraryPage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { AgentDetailPage } from './pages/AgentDetailPage'

type Page = string | null

/* Pages that own the full Main area (no centered 896px column). */
const FULL_BLEED_PAGES = new Set<string>(['__agent_detail'])

function getPage(active: Page): React.ReactNode {
  switch (active) {
    case null:          return <WelcomePage />
    case 'Voice Agents': return <VoiceAgentsPage />
    case 'Voice Library': return <VoiceLibraryPage />
    case '__design_system': return <DesignSystemPage />
    case '__agent_detail': return <AgentDetailPage />
    default:
      return (
        <div className="flex items-center justify-center h-48 px-4">
          <p className="text-[13px] text-neutral-500">{active} — coming soon</p>
        </div>
      )
  }
}

export default function App() {
  const [active, setActive] = useState<Page>(null)

  return (
    <AppLayout
      active={active ?? undefined}
      onNavigate={setActive}
      fullBleed={active != null && FULL_BLEED_PAGES.has(active)}
    >
      {getPage(active)}
    </AppLayout>
  )
}
