import { useState } from 'react'
import { AppLayout } from './components/AppLayout'
import { WelcomePage } from './pages/WelcomePage'
import { VoiceAgentsPage } from './pages/VoiceAgentsPage'
import { VoiceLibraryPage } from './pages/VoiceLibraryPage'
import { DesignSystemPage } from './pages/DesignSystemPage'

type Page = string | null

function getPage(active: Page): React.ReactNode {
  switch (active) {
    case null:          return <WelcomePage />
    case 'Voice Agents': return <VoiceAgentsPage />
    case 'Voice Library': return <VoiceLibraryPage />
    case '__design_system': return <DesignSystemPage />
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
    <AppLayout active={active ?? undefined} onNavigate={setActive}>
      {getPage(active)}
    </AppLayout>
  )
}
