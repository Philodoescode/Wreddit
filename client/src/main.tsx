import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthModalProvider } from './context/auth-modal-provider.tsx'
import { AuthProvider } from './context/auth-provider.tsx'
import AuthModal from './components/auth-form.tsx'
import HomePage from './pages/home-page.tsx'
import ProfilePage from './pages/profile-page.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthModalProvider>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<HomePage />} />
              <Route path="user/:username" element={<ProfilePage />} />
            </Route>
          </Routes>
          <AuthModal />
        </AuthModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)