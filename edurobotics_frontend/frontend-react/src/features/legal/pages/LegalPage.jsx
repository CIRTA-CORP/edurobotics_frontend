/**
 * LegalPage — terms / privacy / cookies. Content is editable from the admin
 * CMS (landing content → "legal"). One component, three routes via `type`.
 */
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PublicNav } from '@/shared/components/PublicNav'
import { getLandingContent } from '@/features/landing/services/landing'
import { mergeLandingContent } from '@/features/landing/landingContent'

const UPDATED = 'junio de 2026'

// Parse the editable body: a line starting with "## " is a section heading,
// blank lines separate paragraphs.
function parseBody(body) {
  const lines = (body || '').split('\n')
  const out = []
  let para = []
  const flush = () => {
    if (para.length) { out.push({ type: 'p', text: para.join(' ') }); para = [] }
  }
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('## ')) { flush(); out.push({ type: 'h', text: t.slice(3) }) }
    else if (t === '') { flush() }
    else para.push(t)
  }
  flush()
  return out
}

export default function LegalPage({ type = 'terminos' }) {
  const { data: stored, isLoading } = useQuery({
    queryKey: ['landing-content'],
    queryFn: getLandingContent,
    staleTime: 60_000,
    retry: false,
  })

  const content = mergeLandingContent(stored)
  const doc = content.legal?.[type] || content.legal?.terminos || { title: '', body: '' }
  const blocks = parseBody(doc.body)

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <article className="mx-auto max-w-3xl px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">{doc.title}</h1>
            <p className="mt-1 text-sm text-gray-400">Última actualización: {UPDATED}</p>

            <div className="mt-8 space-y-4">
              {blocks.map((b, i) =>
                b.type === 'h' ? (
                  <h2 key={i} className="pt-2 text-lg font-semibold text-gray-900">{b.text}</h2>
                ) : (
                  <p key={i} className="leading-relaxed text-gray-600">{b.text}</p>
                )
              )}
            </div>

            <div className="mt-12 border-t border-gray-100 pt-6 text-sm text-gray-400">
              <Link to="/legal" className="mr-4 hover:text-gray-700">Términos</Link>
              <Link to="/privacidad" className="mr-4 hover:text-gray-700">Privacidad</Link>
              <Link to="/cookies" className="hover:text-gray-700">Cookies</Link>
            </div>
          </>
        )}
      </article>
    </div>
  )
}
