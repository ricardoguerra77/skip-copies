import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, FilePlus2, History, Link2, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import SkipCopiesLogo from '@/components/SkipCopiesLogo'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/nova-revisao', label: 'Nova Revisão', icon: FilePlus2 },
  { to: '/revisoes', label: 'Revisões', icon: History },
  { to: '/tarefas', label: 'Tarefas', icon: ClipboardList },
  { to: '/integracoes', label: 'Integrações', icon: Link2 },
]
export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const title = location.pathname.startsWith('/integracoes')
    ? 'Integrações'
    : location.pathname.startsWith('/tarefas')
      ? 'Tarefas'
      : location.pathname === '/revisoes'
        ? 'Revisões'
        : location.pathname.startsWith('/revisoes/')
          ? 'Análise'
          : 'Nova Revisão'
  const leave = () => {
    logout()
    navigate('/login')
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/nova-revisao" className="sidebar-brand" aria-label="Skip Copies — início">
          <SkipCopiesLogo tone="on-dark" />
        </NavLink>
        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('nav-item', isActive && 'active')}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar-ink">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
          <div>
            <strong>{user?.name || 'Skip Copies'}</strong>
            <small>{user?.email}</small>
          </div>
          <button onClick={leave} aria-label="Sair">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span>Skip Copies /</span> {title}
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
            {location.pathname === '/revisoes' && (
              <button className="top-action" onClick={() => navigate('/nova-revisao')}>
                <FilePlus2 size={16} /> Nova revisão
              </button>
            )}
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
        <footer>
          Skip Copies <span>•</span> Revisão de copies com três agentes
        </footer>
      </div>
      <nav className="bottom-nav">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(isActive && 'active')}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" onClick={toggle} aria-label="Alternar tema">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>Tema</span>
        </button>
      </nav>
    </div>
  )
}
