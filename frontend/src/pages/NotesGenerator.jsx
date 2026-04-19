import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase_config'
import './NotesGenerator.css'

export default function NotesGenerator() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState(null)
  const [transcript, setTranscript] = useState('')

  const url = location.state?.url

  useEffect(() => {
    if (!url) {
      navigate('/home')
      return
    }

    // Auto-fetch transcript and notes
    handleGenerateNotes()
  }, [url])

  function extractVideoId(youtubeUrl) {
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  async function handleGenerateNotes() {
    setLoading(true)
    setError(null)

    try {
      console.log('Extracting video ID...')
      const videoId = extractVideoId(url)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      console.log('Sending to backend...')
      // Get Supabase function URL from environment
      const FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL || 
        'http://localhost:54321/functions/v1/generate'

      console.log('Using function URL:', FUNCTION_URL)

      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,  // Send videoId, let backend fetch transcript
          type: 'notes'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes')
      }

      console.log('Notes generated:', data)
      setNotes(data)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notes-gen-page">
      <div className="notes-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Notes Generator</h1>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating your notes...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p className="error-msg">{error}</p>
          <button className="retry-btn" onClick={handleGenerateNotes}>Try Again</button>
          <button className="back-btn" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      )}

      {transcript && !notes && (
        <div className="transcript-preview">
          <h3>Transcript Found:</h3>
          <p>{transcript}</p>
        </div>
      )}

      {notes && (
        <div className="notes-container">
          {notes.notes ? (
            <div className="notes-content">
              <div className="notes-text">
                {notes.notes.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <button className="btn-primary" onClick={() => navigate('/home')}>
                Generate Another
              </button>
            </div>
          ) : notes.raw ? (
            <div className="notes-content">
              <div className="notes-text">
                <p>{notes.raw}</p>
              </div>
              <button className="btn-primary" onClick={() => navigate('/home')}>
                Generate Another
              </button>
            </div>
          ) : (
            <div className="error-msg">Invalid notes format</div>
          )}
        </div>
      )}
    </div>
  )
}
