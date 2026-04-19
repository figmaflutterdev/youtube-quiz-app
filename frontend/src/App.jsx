import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import QuizSetup from './pages/QuizSetup'
import NotesGenerator from './pages/NotesGenerator'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/quiz-setup" element={<QuizSetup />} />
        <Route path="/notes" element={<NotesGenerator />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App