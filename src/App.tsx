import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Reviews from '@/pages/Reviews'
import ReviewDetail from '@/pages/ReviewDetail'
import Tasks from '@/pages/Tasks'
import Integrations from '@/pages/Integrations'
import Auth from '@/pages/Auth'
import NotFound from '@/pages/NotFound'

function Protected() {
  const { user, ready } = useAuth()
  if (!ready) return null
  return user ? <Layout /> : <Navigate to="/login" replace />
}
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner position="bottom-right" />
            <Routes>
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
              <Route path="/verify-email" element={<Auth mode="verify" />} />
              <Route path="/forgot-password" element={<Auth mode="forgot" />} />
              <Route path="/reset-password" element={<Auth mode="reset" />} />
              <Route path="/confirm-email-change" element={<Auth mode="email-change" />} />
              <Route element={<Protected />}>
                <Route path="/" element={<Navigate to="/nova-revisao" replace />} />
                <Route path="/nova-revisao" element={<Index />} />
                <Route path="/revisoes" element={<Reviews />} />
                <Route path="/revisoes/:id" element={<ReviewDetail />} />
                <Route path="/tarefas" element={<Tasks />} />
                <Route path="/integracoes" element={<Integrations />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
