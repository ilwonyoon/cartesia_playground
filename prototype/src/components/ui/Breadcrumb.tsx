import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  items: { label: string; href?: string }[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-[13px]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-neutral-400" />}
          {i === items.length - 1 ? (
            <span className="text-neutral-900">{item.label}</span>
          ) : (
            <a href={item.href ?? '#'} className="text-neutral-500 hover:text-neutral-700 transition-colors">
              {item.label}
            </a>
          )}
        </span>
      ))}
    </nav>
  )
}
