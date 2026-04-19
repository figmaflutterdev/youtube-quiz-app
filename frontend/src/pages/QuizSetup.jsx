import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase_config'
import './QuizSetup.css'

export default function QuizSetup() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [transcript, setTranscript] = useState('')

  const url = location.state?.url

  useEffect(() => {
    if (!url) {
      navigate('/home')
      return
    }

    // Auto-fetch transcript and quiz
    handleGenerateQuiz()
  }, [url])

  function extractVideoId(youtubeUrl) {
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  async function handleGenerateQuiz() {
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
          type: 'quiz'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz')
      }

      console.log('Quiz generated:', data)
      setQuiz(data)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="quiz-setup-page">
      <div className="quiz-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Quiz Generator</h1>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating your quiz...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p className="error-msg">{error}</p>
          <button className="retry-btn" onClick={handleGenerateQuiz}>Try Again</button>
          <button className="back-btn" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      )}

      {transcript && !quiz && (
        <div className="transcript-preview">
          <h3>Transcript Found:</h3>
          <p>{transcript}</p>
        </div>
      )}

      {quiz && (
        <div className="quiz-container">
          {quiz.quiz ? (
            quiz.quiz.map((q, idx) => (
              <div key={idx} className="quiz-card">
                <h3>Q{idx + 1}: {q.question}</h3>
                <div className="options">
                  {q.options.map((opt, i) => (
                    <div 
                      key={i} 
                      className={`option ${opt === q.answer ? 'correct' : ''}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="answer">✓ Answer: {q.answer}</p>
              </div>
            ))
          ) : (
            <div className="error-msg">Invalid quiz format</div>
          )}
          <button className="btn-primary" onClick={() => navigate('/home')}>
            Generate Another
          </button>
        </div>
      )}
    </div>
  )
}
