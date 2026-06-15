import { Routes, Route, Navigate, useLocation, useNavigate, useParams, matchPath } from 'react-router-dom'
import { useState } from 'react'
import type { AgentNavContext } from './components/Sidebar'
import { AppLayout } from './components/AppLayout'
import { WelcomePage } from './pages/WelcomePage'
import { VoiceAgentsPage } from './pages/VoiceAgentsPage'
import { VoiceLibraryPage } from './pages/VoiceLibraryPage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { ContentSystemPage } from './pages/ContentSystemPage'
import { ButtonStateSandbox } from './pages/ButtonStateSandbox'
import { AgentDetailPage } from './pages/AgentDetailPage'
import { AvatarsPage } from './pages/AvatarsPage'
import { OnboardingModal } from './components/discovery/OnboardingModal'
import { resetAvatarAnalysis } from './components/avatar/AvatarPickerModal'
import { getRecommendedFaces, type Avatar } from './data/avatars'

/* URL path → sidebar label mapping (for active state) */
const PATH_TO_LABEL: Record<string, string> = {
  '/agents':        'Voice Agents',
  '/avatars':       'Avatar Library',
  '/avatars/upload': 'Upload Avatar',
  '/voices':        'Voice Library',
  '/tts':           'Text-to-Speech',
  '/stt':           'Speech-to-Text',
  '/metrics':       'Agent Metrics',
  '/phone-numbers': 'Phone Numbers',
  '/instant-clone': 'Instant Clone',
  '/pro-clone':     'Pro Voice Clone',
  '/localize':      'Localize a Voice',
  '/voice-changer': 'Voice Changer',
  '/pronunciation': 'Pronunciation',
  '/api-keys':      'API Keys',
  '/subscription':  'Subscription',
  '/usage':         'Usage',
  '/deprecated':    'Deprecated Models',
}

const LABEL_TO_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(PATH_TO_LABEL).map(([path, label]) => [label, path])
)

function isFullBleed(pathname: string) {
  return pathname.startsWith('/agents/') && pathname !== '/agents'
}

function isWide(pathname: string) {
  return pathname === '/voices' || pathname === '/__content_system'
}

/* Remounts the detail page per agent id so each stored agent's config
   initializes cleanly (tab changes keep the same key). */
function AgentDetailRoute(props: React.ComponentProps<typeof AgentDetailPage>) {
  const { id } = useParams<{ id?: string }>()
  return <AgentDetailPage key={id ?? 'demo'} {...props} />
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-48 px-4">
      <p className="text-[13px] text-neutral-500">{label} — coming soon</p>
    </div>
  )
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(() => getRecommendedFaces()[0] ?? null)
  /* Agent-scoped sidebar state: the builder reports its live name and the
     per-section counts (knowledge docs, flow steps) up here so the nav can
     show them while the conversation builds the agent. */
  const [builderName, setBuilderName] = useState('untitled-agent')
  const [agentCounts, setAgentCounts] = useState<Record<string, number>>({})

  const builderMatch = matchPath('/agents/new/voice/:tab?', location.pathname)
  const agentIdMatch = builderMatch ? null : matchPath('/agents/:id/:tab?', location.pathname)
  const agentContext: AgentNavContext | null = builderMatch
    ? {
        name: builderName,
        builder: true,
        activeTab: builderMatch.params.tab ?? 'configuration',
        counts: agentCounts,
        onSelectTab: (slug) => navigate(`/agents/new/voice/${slug}`),
        onBack: () => navigate('/agents'),
      }
    : agentIdMatch?.params.id
      ? {
          name: agentIdMatch.params.id === 'demo' ? 'open-dialogue' : agentIdMatch.params.id,
          activeTab: agentIdMatch.params.tab ?? 'configuration',
          counts: agentCounts,
          onSelectTab: (slug) => navigate(`/agents/${agentIdMatch.params.id}/${slug}`),
          onBack: () => navigate('/agents'),
        }
      : null

  function handleResetDemo() {
    setSelectedAvatar(null)
    resetAvatarAnalysis()
  }

  const activeLabel = location.pathname === '/' ? '__home'
    : PATH_TO_LABEL[location.pathname]
    ?? (location.pathname.startsWith('/agents/') ? 'Voice Agents' : undefined)

  function handleNavigate(label: string) {
    if (label === '__home') { navigate('/'); return }
    const path = LABEL_TO_PATH[label]
    if (path) navigate(path)
    else if (label === '__design_system') navigate('/__design_system')
    else if (label === '__content_system') navigate('/__content_system')
    else if (label === '__button_states') navigate('/__button_states')
    else if (label === '__agent_detail') navigate('/agents/demo')
    else if (label === 'Avatar Library') navigate('/avatars')
    else if (label === 'Upload Avatar') navigate('/avatars/upload')
  }

  const fullBleed = isFullBleed(location.pathname)
  const wide = isWide(location.pathname)

  return (
    <>
      <AppLayout
        active={activeLabel}
        onNavigate={handleNavigate}
        onResetDemo={handleResetDemo}
        fullBleed={fullBleed}
        wide={wide}
        agentContext={agentContext}
        onOpenAgent={(id) => navigate(`/agents/${id}`)}
      >
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/agents" element={
            <VoiceAgentsPage
              onOpenAgent={(id) => navigate(`/agents/${id}`)}
              onStartAvatar={() => setModalOpen(true)}
              modalOpen={modalOpen}
            />
          } />
          <Route path="/agents/new/voice/:tab?" element={
            <AgentDetailPage
              builderMode
              onBack={() => navigate('/agents')}
              selectedAvatar={selectedAvatar}
              onSelectAvatar={setSelectedAvatar}
              onNameChange={setBuilderName}
              onCountsChange={setAgentCounts}
            />
          } />
          <Route path="/agents/:id/:tab?" element={
            <AgentDetailRoute
              onBack={() => navigate('/agents')}
              selectedAvatar={selectedAvatar}
              onSelectAvatar={setSelectedAvatar}
              onCountsChange={setAgentCounts}
            />
          } />
          <Route path="/avatars" element={<AvatarsPage />} />
          <Route path="/avatars/upload" element={<AvatarsPage initialTab="upload" />} />
          <Route path="/avatars/:id" element={<AvatarsPage />} />
          <Route path="/voices" element={<VoiceLibraryPage />} />
          <Route path="/__design_system" element={<DesignSystemPage />} />
          <Route path="/__content_system" element={<ContentSystemPage />} />
          <Route path="/__button_states" element={<ButtonStateSandbox />} />
          <Route path="/tts" element={<ComingSoon label="Text-to-Speech" />} />
          <Route path="/stt" element={<ComingSoon label="Speech-to-Text" />} />
          <Route path="/metrics" element={<ComingSoon label="Agent Metrics" />} />
          <Route path="/phone-numbers" element={<ComingSoon label="Phone Numbers" />} />
          <Route path="/instant-clone" element={<ComingSoon label="Instant Clone" />} />
          <Route path="/pro-clone" element={<ComingSoon label="Pro Voice Clone" />} />
          <Route path="/localize" element={<ComingSoon label="Localize a Voice" />} />
          <Route path="/voice-changer" element={<ComingSoon label="Voice Changer" />} />
          <Route path="/pronunciation" element={<ComingSoon label="Pronunciation" />} />
          <Route path="/api-keys" element={<ComingSoon label="API Keys" />} />
          <Route path="/subscription" element={<ComingSoon label="Subscription" />} />
          <Route path="/usage" element={<ComingSoon label="Usage" />} />
          <Route path="/deprecated" element={<ComingSoon label="Deprecated Models" />} />
          <Route path="*" element={<Navigate to="/agents" replace />} />
        </Routes>
      </AppLayout>
      <OnboardingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGetStarted={() => setModalOpen(false)}
      />
    </>
  )
}

export default function App() {
  return <AppShell />
}
