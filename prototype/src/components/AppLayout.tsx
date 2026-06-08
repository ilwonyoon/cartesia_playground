import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

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
}

export function AppLayout({ children, active, onNavigate, onResetDemo, fullBleed = false, wide = false }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-neutral-100">
      <Sidebar active={active} onNavigate={onNavigate} onResetDemo={onResetDemo} />
      {fullBleed ? (
        /* Full-bleed pages own a fixed-viewport shell: the main area never scrolls
           itself (overflow-hidden, h-screen) so the page can confine scrolling to an
           inner column — keeping header/tabs static and free of a full-height scrollbar. */
        <main className="flex-1 min-w-0 h-screen overflow-hidden">
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
        <main className="flex-1 min-w-0 overflow-y-auto pt-12 pb-12 flex justify-center">
          <div className="w-full max-w-[896px] px-4">
            {children}
          </div>
        </main>
      )}
    </div>
  )
}
