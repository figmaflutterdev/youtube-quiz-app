import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase_config'
import logoImg from '../assets/logo.png'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user)
    })

    // Close dropdown when clicking outside
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  function handleUrlChange(e) {
    const val = e.target.value
    setUrl(val)
    const id = extractVideoId(val)
    if (id) {
      setThumbnail(`https://img.youtube.com/vi/${id}/hqdefault.jpg`)
      setVideoTitle('YouTube Video')
    } else {
      setThumbnail(null)
      setVideoTitle('')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function getInitials(user) {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) return user.email[0].toUpperCase()
    return 'U'
  }

  return (
    <div className="home-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
          <img src={logoImg} alt="logo" width="32" height="32" />
          <span>EduConvert</span>
        </div>

        {/* Avatar with dropdown */}
        <div className="avatar-wrap" ref={dropdownRef}>
          <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                style={{width:'100%', height:'100%',
                borderRadius:'50%', objectFit:'cover'}}
              />
            ) : (
              <span className="avatar-initials">{getInitials(user)}</span>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="dropdown">
              <div className="dropdown-user">
                <div className="dropdown-avatar-big">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="avatar"
                      style={{width:'100%', height:'100%',
                      borderRadius:'50%', objectFit:'cover'}}
                    />
                  ) : (
                    <span>{getInitials(user)}</span>
                  )}
                </div>
                <div>
                  <p className="dropdown-name">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="dropdown-email">{user?.email}</p>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button className="dropdown-signout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" width="16" height="16">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="home-content">
        <div className="home-header">
          <h1>What will you <span>learn</span> today?</h1>
          <p>Paste any YouTube link and let AI do the rest</p>
        </div>

        <div className="url-card">
          <div className="url-input-wrap">
            <div className="url-icon">
              <svg viewBox="0 0 24 24" fill="#ff0000" width="22" height="22">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1
                1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73
                1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19
                0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28
                -1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83
                -1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1
                3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Paste your YouTube link here to begin..."
              value={url}
              onChange={handleUrlChange}
              className="url-input"
            />
            {url && (
              <button className="url-clear" onClick={() => {
                setUrl(''); setThumbnail(null); setVideoTitle('')
              }}>✕</button>
            )}
          </div>

          {thumbnail && (
            <div className="thumb-preview">
              <div className="thumb-img-wrap">
                <img src={thumbnail} alt="thumbnail" className="thumb-img" />
                <div className="thumb-play">
                  <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <p className="thumb-title">{videoTitle}</p>
            </div>
          )}
        </div>

        <div className="action-btns">
          <button
            className="btn-notes"
            disabled={!thumbnail}
            onClick={() => navigate('/notes', { state: { url } })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Generate Notes
          </button>

          <button
            className="btn-quiz"
            disabled={!thumbnail}
            onClick={() => navigate('/quiz-setup', { state: { url } })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Create Quiz
          </button>
        </div>

        <div className="info-chips">
          <div className="chip">
            <span className="chip-dot purple"></span>AI Powered
          </div>
          <div className="chip">
            <span className="chip-dot blue"></span>Instant Notes
          </div>
          <div className="chip">
            <span className="chip-dot green"></span>Smart Quiz
          </div>
        </div>
      </div>
    </div>
  )
}