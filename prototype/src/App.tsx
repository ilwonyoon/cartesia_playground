import { useState } from 'react'
import { AppLayout } from './components/AppLayout'
import { WelcomePage } from './pages/WelcomePage'
import { VoiceAgentsPage } from './pages/VoiceAgentsPage'
import { VoiceLibraryPage } from './pages/VoiceLibraryPage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { AgentDetailPage } from './pages/AgentDetailPage'
import { OnboardingModal } from './components/discovery/OnboardingModal'

type Page = string | null

const FULL_BLEED_PAGES = new Set<string>(['__agent_detail'])

export default function App() {
  const [active, setActive] = useState<Page>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function getPage(active: Page): React.ReactNode {
    switch (active) {
      case null:           return <WelcomePage />
      case 'Voice Agents': return <VoiceAgentsPage onStartAvatar={() => setModalOpen(true)} />
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

  return (
    <>
      <AppLayout
        active={active ?? undefined}
        onNavigate={setActive}
        fullBleed={active != null && FULL_BLEED_PAGES.has(active)}
      >
        {getPage(active)}
      </AppLayout>
      <OnboardingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGetStarted={() => { setModalOpen(false); /* Create your own flow — next */ }}
      />
    </>
  )
}
