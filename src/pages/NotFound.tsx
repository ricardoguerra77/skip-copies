import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import SkipCopiesLogo from '@/components/SkipCopiesLogo'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <main className="not-found-page">
      <SkipCopiesLogo tone="on-light" variant="full" className="not-found-logo" />
      <p className="eyebrow">Skip Copies</p>
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <p className="not-found-path">{location.pathname}</p>
      <Link to="/nova-revisao" className="skip-btn not-found-cta">
        Voltar para a central
      </Link>
    </main>
  )
}
