import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar, type AgentNavContext } from './Sidebar'
import { CartesiaLogo } from './CartesiaLogo'

interface AppLayoutProps {
  children: ReactNode
  active?: string
  onNavigate?: (label: string) => void
  onResetDemo?: () => void
  /* Full-bleed pages (e.g. agent detail) own the entire Main area —
     no centered 896px column, no vertical padding. */
  fullBleed?: boolean
  /* Wide pages (e.g. Voice Library) span the full Main width with only
     gutter padding, instead of the centered 896px column. The page itself
     decides how to constrain its inner content (e.g. a max-1200 box). */
  wide?: boolean
  /* When inside an agent, the sidebar swaps to that agent's sections. */
  agentContext?: AgentNavContext | null
  /* Opens a built agent from the sidebar's "Your agents" list. */
  onOpenAgent?: (id: string) => void
}

export function AppLayout({ children, active, onNavigate, onResetDemo, fullBleed = false, wide = false, agentContext, onOpenAgent }: AppLayoutProps) {
  const [navOpen, setNavOpen] = useState(false)

  /* Drawer variants close the drawer after navigating. */
  const drawerNavigate = (label: string) => { setNavOpen(false); onNavigate?.(label) }
  const drawerOpenAgent = (id: string) => { setNavOpen(false); onOpenAgent?.(id) }
  const drawerAgentContext: AgentNavContext | null = agentContext
    ? {
        ...agentContext,
        onSelectTab: (slug) => { setNavOpen(false); agentContext.onSelectTab(slug) },
        onBack: () => { setNavOpen(false); agentContext.onBack() },
      }
    : null

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row">

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 h-12 shrink-0 flex items-center gap-3 px-3 bg-neutral-100 border-b border-neutral-400">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-[7px] text-neutral-700 hover:bg-neutral-200 cursor-pointer"
        >
          <Menu size={19} strokeWidth={1.7} />
        </button>
        <CartesiaLogo width={118} height={17} />
      </div>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/25" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-[8px_0_24px_rgba(0,0,0,0.12)]">
            <Sidebar
              active={active}
              onNavigate={drawerNavigate}
              onResetDemo={onResetDemo}
              agentContext={drawerAgentContext}
              onOpenAgent={drawerOpenAgent}
            />
          </div>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="absolute top-3 left-[219px] w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 border border-neutral-400 text-neutral-700 cursor-pointer"
          >
            <X size={17} strokeWidth={1.7} />
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar active={active} onNavigate={onNavigate} onResetDemo={onResetDemo} agentContext={agentContext} onOpenAgent={onOpenAgent} />
      </div>

      {fullBleed ? (
        /* Full-bleed pages own a fixed-viewport shell: the main area never scrolls
           itself (overflow-hidden) so the page can confine scrolling to an inner
           column — keeping the header static and free of a full-height scrollbar.
           Mobile subtracts the 48px top bar. */
        <main className="flex-1 min-w-0 h-[calc(100dvh-48px)] md:h-screen overflow-hidden">
          {children}
        </main>
      ) : wide ? (
        /* Wide pages own the full Main column with NO padding — the page draws its
           own full-width header bar (Figma 9:1707) flush to the top, then constrains
           its body content (e.g. a max-1200 box) below. */
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      ) : (
        /*
          Figma: Main = 1232px, Container pLeft:160.5 pRight:175.5 pTop:48
          → content area = 896px, centered within Main
          → inner container pLeft:16 pRight:16 → inner content 864px
        */
        <main className="flex-1 min-w-0 overflow-y-auto pt-6 md:pt-12 pb-12 flex justify-center">
          <div className="w-full max-w-[896px] px-4">
            {children}
          </div>
        </main>
      )}
    </div>
  )
}
