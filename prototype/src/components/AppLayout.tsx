import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
  active?: string
  onNavigate?: (label: string) => void
  /* Full-bleed pages (e.g. agent detail) own the entire Main area —
     no centered 896px column, no vertical padding. */
  fullBleed?: boolean
}

export function AppLayout({ children, active, onNavigate, fullBleed = false }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-neutral-100">
      <Sidebar active={active} onNavigate={onNavigate} />
      {fullBleed ? (
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
