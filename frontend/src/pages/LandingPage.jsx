import { useNavigate } from 'react-router-dom'
import { BsStars, BsLightningFill, BsGraphUpArrow } from 'react-icons/bs'
import { FaBrain } from 'react-icons/fa'
import heroImage from '../assets/hero-image.png'
import logoImg from '../assets/logo.png'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <nav className="nav">
        <div className="logo">
        <img src={logoImg} alt="logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
         EduConvert
        </div>
        <div className="nav-btns">
          <button className="btn-login" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-signup" onClick={() => navigate('/signup')}>Sign up</button>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-left">
          <h1>Turn any <span>YouTube video</span> into your personal tutor.</h1>
          <p>Paste a link. Get structured notes. Ace custom quizzes. Powered by AI.</p>
          <button className="btn-cta" onClick={() => navigate('/signup')}>
            Get Started for Free
          </button>
        </div>
        <div className="hero-right">
          <img src={heroImage} alt="hero" className="hero-img-png" />
        </div>
      </div>

      <div className="features">
        <div className="feat-card">
          <div className="feat-icon purple">
            <BsStars size={28} color="#7c3aed" />
          </div>
          <h3>AI Transcription</h3>
          <p>Magic AI transcription from any YouTube video instantly</p>
        </div>

        <div className="feat-card">
          <div className="feat-icon blue">
           <FaBrain size={28} color="#2563eb" />
          </div>
          <h3>Smart Quizzing</h3>
          <p>Smart quizzing and notes generated automatically</p>
        </div>

        <div className="feat-card">
          <div className="feat-icon green">
            <BsGraphUpArrow size={28} color="#059669" />
          </div>
          <h3>Progress Tracking</h3>
          <p>Track your learning progress across all videos</p>
        </div>
      </div>
    </div>
  )
}