/**
 * CodeBlock — light, line-numbered code viewer matching the Cartesia console
 * snippet style (white card, gutter line numbers, subtle highlighting,
 * top-right Copy). Highlighting is a lightweight hand-tokenizer (no syntax
 * library, no cold colors): strings reuse the brand green, keywords/tags sit
 * on warm neutrals. Covers the small set of langs the embed picker shows.
 */
import { useState, type ReactNode } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export type CodeLang = 'html' | 'js' | 'python'

const KEYWORDS: Record<CodeLang, string[]> = {
  html: [],
  js: ['const', 'let', 'var', 'new', 'await', 'async', 'function', 'return', 'import', 'from', 'export'],
  python: ['from', 'import', 'await', 'async', 'def', 'return', 'with', 'as', 'class'],
}

const COMMENT_PREFIX: Record<CodeLang, string | null> = {
  html: null, js: '//', python: '#',
}

/* Tokenize one line into colored spans. Strings → brand green; HTML tags and
   language keywords → warm neutral-700; comments → muted. Deliberately small. */
function highlight(line: string, lang: CodeLang): ReactNode[] {
  // Whole-line comment.
  const cp = COMMENT_PREFIX[lang]
  if (cp && line.trimStart().startsWith(cp)) {
    return [<span key="c" className="text-neutral-400 italic">{line}</span>]
  }

  const out: ReactNode[] = []
  // Split on quoted strings (single or double) so values stay intact.
  const parts = line.split(/("[^"]*"|'[^']*')/g)
  parts.forEach((part, i) => {
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      out.push(<span key={i} className="text-brand">{part}</span>)
      return
    }
    if (lang === 'html') {
      const sub = part.split(/(<\/?[a-zA-Z-]+|\/?>)/g)
      sub.forEach((s, j) => {
        const cls = (/^<\/?[a-zA-Z-]+$/.test(s) || /^\/?>$/.test(s))
          ? 'text-neutral-700 font-[500]' : 'text-neutral-600'
        out.push(<span key={`${i}-${j}`} className={cls}>{s}</span>)
      })
      return
    }
    // js / python — color keywords by word boundary.
    const words = KEYWORDS[lang]
    const sub = part.split(/(\b(?:[a-zA-Z_]\w*)\b)/g)
    sub.forEach((s, j) => {
      const cls = words.includes(s) ? 'text-neutral-700 font-[600]' : 'text-neutral-600'
      out.push(<span key={`${i}-${j}`} className={cls}>{s}</span>)
    })
  })
  return out
}

export function CodeBlock({ code, lang = 'html', className }: { code: string; lang?: CodeLang; className?: string }) {
  const [copied, setCopied] = useState(false)
  const lines = code.split('\n')

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }

  return (
    <div className={cn('relative rounded-[10px] border border-neutral-400 bg-white overflow-hidden', className)}>
      {/* Copy — top-right, mirrors the console's icon row (read-only snippet
          needs only Copy, not the JSON validate/AI actions). */}
      <button
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-[6px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 cursor-pointer transition-colors"
      >
        {copied ? <Check size={14} strokeWidth={2} className="text-brand" /> : <Copy size={14} strokeWidth={1.6} />}
      </button>

      <div className="overflow-x-auto py-3.5 pr-12">
        <table className="border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="select-none text-right align-top pl-4 pr-4 text-[12px] leading-[1.7] font-mono text-neutral-400 tabular-nums w-px">
                  {i + 1}
                </td>
                <td className="whitespace-pre text-[12.5px] leading-[1.7] font-mono">
                  {highlight(line, lang)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
