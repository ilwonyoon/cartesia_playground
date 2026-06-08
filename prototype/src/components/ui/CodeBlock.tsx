/**
 * CodeBlock — light, line-numbered code viewer matching the Cartesia console
 * snippet style (white card, gutter line numbers, subtle HTML highlighting,
 * top-right Copy). Highlighting is a lightweight hand-tokenizer for the small
 * HTML embed snippet — no syntax library, no cold colors (strings reuse the
 * brand green, tags/attrs sit on warm neutrals).
 */
import { useState, type ReactNode } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/* Tokenize one line of the embed HTML into colored spans. Kept deliberately
   small — it only needs to handle tags, attribute names, and quoted strings. */
function highlightHtml(line: string): ReactNode[] {
  const out: ReactNode[] = []
  // Split on quoted strings first so attribute values stay intact.
  const parts = line.split(/("[^"]*")/g)
  parts.forEach((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      out.push(<span key={i} className="text-brand">{part}</span>)
      return
    }
    // Within non-string text, color tag names and angle brackets.
    const sub = part.split(/(<\/?[a-zA-Z-]+|\/?>)/g)
    sub.forEach((s, j) => {
      if (/^<\/?[a-zA-Z-]+$/.test(s) || /^\/?>$/.test(s)) {
        out.push(<span key={`${i}-${j}`} className="text-neutral-700 font-[500]">{s}</span>)
      } else {
        out.push(<span key={`${i}-${j}`} className="text-neutral-600">{s}</span>)
      }
    })
  })
  return out
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
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
                  {highlightHtml(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
