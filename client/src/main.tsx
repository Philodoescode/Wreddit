import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthModalProvider } from './context/auth-modal-provider.tsx'
import AuthModal from './components/auth-form.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthModalProvider>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
        <AuthModal />
      </AuthModalProvider>
    </BrowserRouter>
  </StrictMode>
)