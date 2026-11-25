import { useMemo } from 'react'

const SECTION_LABELS = [
  'Fontes de informação',
  'Hooks e provas',
  'Problema',
  'Promessa',
  'Prova',
  'Proposta',
  'Objeções',
  'Estratégias de atenção',
  'Posicionamento exemplo',
  'Posicionamento',
  'Hook',
  'CTA',
  'Benefício',
  'Mecanismo',
]

export function normalizeAgentText(raw: string): string {
  return String(raw || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\u2022/g, '•')
    .trim()
}

/** Insere quebras quando o agente devolve tudo em uma linha com rótulos "X:". */
export function structureAgentText(raw: string): string {
  let text = normalizeAgentText(raw)
  if (!text) return ''

  for (const label of SECTION_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?<!\\n)(\\s*)(${escaped}\\s*:)`)
    text = text.replace(re, '\n\n$2')
  }

  text = text.replace(/(?<=[.;])\s+(?=[-•*]\s)/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function inlineNodes(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-b-${i}`}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function FormattedAgentText({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const structured = structureAgentText(text)
    return structured
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter(Boolean)
  }, [text])

  if (blocks.length === 0) return null

  return (
    <div className="formatted-copy">
      {blocks.map((block, i) => {
        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
        const first = lines[0] || ''
        const labelMatch = first.match(/^(.{2,90}):\s*(.*)$/)

        if (labelMatch && lines.length === 1) {
          const [, label, body] = labelMatch
          return (
            <div className="formatted-copy-block" key={i}>
              <strong>{label}:</strong>
              <p>{body ? inlineNodes(body, `${i}`) : null}</p>
            </div>
          )
        }

        if (labelMatch && lines.length > 1) {
          const [, label, body] = labelMatch
          const rest = [body, ...lines.slice(1)].filter(Boolean).join('\n')
          return (
            <div className="formatted-copy-block" key={i}>
              <strong>{label}:</strong>
              <p>{inlineNodes(rest, `${i}`)}</p>
            </div>
          )
        }

        if (lines.every((l) => /^[-•*]\s/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inlineNodes(l.replace(/^[-•*]\s+/, ''), `${i}-${j}`)}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="formatted-copy-paragraph">
            {inlineNodes(block, `${i}`)}
          </p>
        )
      })}
    </div>
  )
}
