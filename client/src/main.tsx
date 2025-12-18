import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import {AuthModalProvider} from './context/auth-modal-provider.tsx'
import {AuthProvider} from './context/auth-provider.tsx'
import {ChatProvider} from './context/chat-provider.tsx'
import AuthModal from './components/auth-form.tsx'
import HomePage from './pages/home-page.tsx'
import ProfilePage from './pages/profile-page.tsx'
import CreateCommunity from './components/CreateCommunity.tsx'
import CommunityPage from "./pages/CreateCommunityPage.tsx";
import PostDetailPage from "./pages/PostDetailPage.tsx";
import SubmitPage from "./pages/submit.tsx";
import ChatPage from "./pages/chat-page.tsx";


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <ChatProvider>
                    <AuthModalProvider>
                        <Routes>
                            <Route path="/" element={<App/>}>
                                <Route index element={<HomePage/>}/>
                                <Route path="user/:username" element={<ProfilePage/>}/>
                                <Route path="/create-community" element={<CreateCommunity/>}/>
                                <Route path="r/:communityName" element={<CommunityPage/>}/>
                                <Route path="posts/:id" element={<PostDetailPage/>}/>
                                <Route path="submit" element={<SubmitPage/>}/>
                                <Route path="chat" element={<ChatPage/>}/>
                            </Route>
                        </Routes>
                        <AuthModal/>
                    </AuthModalProvider>
                </ChatProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
)