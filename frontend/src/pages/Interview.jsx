import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function Interview({ navigate, interviewData, setInterviewData, theme, isDark, toggleTheme }) {
  const [webcamReady, setWebcamReady] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)
  const [emotionData, setEmotionData] = useState(null)
  const [voiceData, setVoiceData] = useState(null)
  const [timeLeft, setTimeLeft] = useState(120)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [webcamError, setWebcamError] = useState('')
  const mediaRecorderRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const chunksRef = useRef([])
  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  const t = theme
  const questions = interviewData.questions || []
  const currentQuestion = questions[currentQ]
  const progress = ((currentQ + 1) / questions.length) * 100
  const isVoiceOnly = currentQuestion?.type === 'voice_only'
  const isBehavioral = currentQuestion?.type === 'behavioral'

  // Attach stream to video when webcamReady
  useEffect(() => {
    if (webcamReady && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [webcamReady, currentQ])

  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimeLeft(120)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startWebcam = async () => {
    setWebcamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      // Show preview on gate screen
      if (previewRef.current) previewRef.current.srcObject = stream
      setWebcamReady(true)
      startTimer()
    } catch (err) {
      setWebcamError('Could not access webcam. Please allow camera permission and try again.')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
    } catch (err) { alert('Microphone error: ' + err.message) }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingTimerRef.current)
    }
  }

  const captureEmotion = async () => {
    if (!webcamReady || !videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = 320; canvas.height = 240
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240)
    try {
      const res = await axios.post('https://aiinterviewerstimulator-production.up.railway.app//api/analyze-emotion', { image: canvas.toDataURL('image/jpeg') })
      setEmotionData(res.data.analysis)
    } catch (err) { console.log('Emotion error:', err) }
  }

  const analyzeVoiceFile = async (file) => {
    const formData = new FormData()
    formData.append('audio', file)
    try {
      const res = await axios.post('https://aiinterviewerstimulator-production.up.railway.app//api/analyze-voice', formData)
      setVoiceData(res.data.analysis)
      return res.data.analysis
    } catch (err) { console.log('Voice error:', err) }
  }

  const goToQuestion = (i) => {
    if (i === currentQ) return
    setCurrentQ(i)
    setAnswer('')
    setRecordedBlob(null)
    setRecordingTime(0)
    clearInterval(timerRef.current)
    startTimer()
  }

  const submitAnswer = async () => {
    if (isVoiceOnly && !recordedBlob) { alert('Please record your voice answer!'); return }
    if (!isVoiceOnly && !answer.trim()) { alert('Please write your answer!'); return }
    setLoading(true)
    clearInterval(timerRef.current)
    await captureEmotion()
    let voiceResult = null
    if (recordedBlob) {
      const file = new File([recordedBlob], 'recorded_answer.wav', { type: 'audio/wav' })
      voiceResult = await analyzeVoiceFile(file)
    }
    try {
      const finalAnswer = isVoiceOnly ? (voiceResult?.transcript || 'Voice answer recorded') : answer
      const res = await axios.post('https://aiinterviewerstimulator-production.up.railway.app//api/evaluate-answer', {
        question: currentQuestion.question, answer: finalAnswer, role: interviewData.role
      })
      const newEvaluations = [...evaluations]
      newEvaluations[currentQ] = { question: currentQuestion.question, answer: finalAnswer, type: currentQuestion.type, evaluation: res.data.evaluation }
      setEvaluations(newEvaluations)

      // Check if all answered
      const allAnswered = questions.every((_, i) => newEvaluations[i] !== undefined)
      if (allAnswered) {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        setInterviewData({ ...interviewData, answers: newEvaluations.filter(Boolean), emotionData, voiceData })
        navigate('report')
      } else {
        // Go to next unanswered
        const nextUnanswered = questions.findIndex((_, i) => !newEvaluations[i])
        if (nextUnanswered !== -1) {
          setCurrentQ(nextUnanswered)
          setAnswer('')
          setRecordedBlob(null)
          setRecordingTime(0)
          startTimer()
        }
      }
    } catch (err) { alert('Error evaluating answer!') }
    setLoading(false)
  }

  const getTypeColor = (type) => {
    if (type === 'technical') return '#3B82F6'
    if (type === 'behavioral') return '#10B981'
    if (type === 'voice_only') return '#EC4899'
    return '#F59E0B'
  }

  const getTypeLabel = (type) => {
    if (type === 'technical') return '💻 Technical'
    if (type === 'behavioral') return '🧠 Behavioral'
    if (type === 'voice_only') return '🎙️ Voice Only'
    return type
  }

  // ── WEBCAM GATE ──────────────────────────────────────────
  if (!webcamReady) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📷</div>
          <h1 style={{ color: t.text, fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>Enable Webcam to Start</h1>
          <p style={{ color: t.textSecondary, fontSize: 15, margin: '0 0 24px', lineHeight: 1.7 }}>
            Webcam is required for live emotion detection. Your camera feed is never stored.
          </p>

          {/* Live Preview */}
          <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: `1px solid ${t.border}`, position: 'relative', minHeight: 200 }}>
            <video ref={previewRef} autoPlay muted playsInline style={{ width: '100%', display: 'block', borderRadius: 16 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 13, pointerEvents: 'none' }}>
              {!streamRef.current && 'Click button below to enable camera'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { icon: '😊', title: 'Emotion Detection', desc: 'Real-time confidence tracking' },
              { icon: '🔒', title: 'Private & Secure', desc: 'No recording stored' },
              { icon: '📊', title: 'Better Analysis', desc: 'More accurate feedback' },
              { icon: '🎯', title: 'Real Interview Feel', desc: 'Simulates actual interviews' },
            ].map((item, i) => (
              <div key={i} style={{ background: t.bgCard, borderRadius: 12, padding: '12px', border: `1px solid ${t.border}`, textAlign: 'left' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: 12 }}>{item.title}</div>
                <div style={{ color: t.textMuted, fontSize: 11, marginTop: 1 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {webcamError && (
            <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444', padding: '12px 16px', borderRadius: 12, marginBottom: 14, fontSize: 13, border: '1px solid rgba(239,68,68,0.3)', textAlign: 'left' }}>
              ⚠️ {webcamError}
            </div>
          )}

          <button onClick={startWebcam}
            style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${t.primary}, #7C3AED)`, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
            📷 Enable Webcam & Start Interview
          </button>
          <button onClick={() => navigate('home')}
            style={{ width: '100%', padding: '13px', borderRadius: 14, border: `1px solid ${t.border}`, background: 'transparent', color: t.textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN INTERVIEW ───────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'all 0.3s' }}>

      {/* Navbar */}
      <nav style={{ background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ color: t.text, fontWeight: 700 }}>{interviewData.role}</span>
          <span style={{ background: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: t.primary, fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
            {interviewData.difficulty}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: timeLeft < 30 ? 'rgba(239,68,68,0.15)' : t.bgSecondary, border: `1px solid ${timeLeft < 30 ? '#EF4444' : t.border}`, borderRadius: 10, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⏱️</span>
            <span style={{ color: timeLeft < 30 ? '#EF4444' : t.text, fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span style={{ color: t.textSecondary, fontSize: 14, fontWeight: 600 }}>{currentQ + 1} / {questions.length}</span>
          <button onClick={toggleTheme} style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Progress Bar */}
      <div style={{ height: 4, background: t.bgSecondary }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${t.primary}, #7C3AED)`, transition: 'width 0.5s ease' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* LEFT */}
        <div>
          {/* Question Card */}
          <div style={{ background: t.bgCard, borderRadius: 16, border: `2px solid ${isVoiceOnly ? '#EC4899' : t.border}`, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ background: `${getTypeColor(currentQuestion?.type)}20`, color: getTypeColor(currentQuestion?.type), fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase' }}>
                {getTypeLabel(currentQuestion?.type)}
              </span>
              <span style={{ color: t.textMuted, fontSize: 13 }}>Question {currentQ + 1} of {questions.length}</span>
              {evaluations[currentQ] && (
                <span style={{ background: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4', color: '#10B981', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, marginLeft: 'auto' }}>
                  ✅ Already answered
                </span>
              )}
            </div>
            <p style={{ color: t.text, fontSize: 18, lineHeight: 1.7, margin: '0 0 0', fontWeight: 500 }}>
              {currentQuestion?.question}
            </p>
            {isVoiceOnly && (
              <div style={{ background: isDark ? 'rgba(236,72,153,0.1)' : '#FDF2F8', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 12, padding: '12px 16px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🎙️</span>
                <div>
                  <div style={{ color: '#EC4899', fontWeight: 700, fontSize: 13 }}>Voice-Only Question</div>
                  <div style={{ color: t.textMuted, fontSize: 12 }}>Record your spoken answer — no typing needed</div>
                </div>
              </div>
            )}
          </div>

          {/* Answer Box */}
          <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 28 }}>

            {!isVoiceOnly && (
              <>
                <label style={{ display: 'block', color: t.text, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✍️ Your Answer</label>
                <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6}
                  placeholder="Type your answer here... Be specific and use examples."
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${t.border}`, fontSize: 14, resize: 'vertical', outline: 'none', background: t.bgSecondary, color: t.text, boxSizing: 'border-box', lineHeight: 1.7, fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 }}>
                  <span style={{ color: t.textMuted, fontSize: 12 }}>{answer.length} characters</span>
                  <span style={{ color: answer.length > 50 ? '#10B981' : t.textMuted, fontSize: 12 }}>
                    {answer.length > 50 ? '✅ Good length' : '💡 Add more detail'}
                  </span>
                </div>
              </>
            )}

            {/* Voice Recorder */}
            <div style={{ background: isVoiceOnly ? (isDark ? 'rgba(236,72,153,0.08)' : '#FDF2F8') : t.bgSecondary, borderRadius: 12, padding: '16px', marginBottom: 16, border: `1px solid ${isVoiceOnly ? 'rgba(236,72,153,0.3)' : t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🎙️</span>
                <span style={{ color: t.text, fontWeight: 700, fontSize: 13 }}>{isVoiceOnly ? 'Record Your Answer' : 'Voice Recording'}</span>
                {isVoiceOnly && <span style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Required</span>}
                {isBehavioral && !isVoiceOnly && <span style={{ background: isDark ? 'rgba(139,92,246,0.2)' : '#F3E8FF', color: '#7C3AED', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Recommended</span>}
                {!isVoiceOnly && !isBehavioral && <span style={{ color: t.textMuted, fontSize: 11 }}>(Optional)</span>}
              </div>

              {!isRecording && !recordedBlob && (
                <button onClick={startRecording}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                    background: isVoiceOnly ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : isBehavioral ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : `linear-gradient(135deg, ${t.primary}, #7C3AED)`,
                    color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  🎙️ {isVoiceOnly ? 'Start Recording' : isBehavioral ? 'Record Your Answer' : 'Record Voice (Optional)'}
                </button>
              )}

              {isRecording && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderRadius: 12, padding: '12px 16px', marginBottom: 10, border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                    <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 14 }}>Recording... {formatTime(recordingTime)}</span>
                    <span style={{ color: t.textMuted, fontSize: 12, marginLeft: 'auto' }}>Speak clearly</span>
                  </div>
                  <button onClick={stopRecording} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    ⏹️ Stop Recording
                  </button>
                </div>
              )}

              {recordedBlob && !isRecording && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4', borderRadius: 12, padding: '12px 16px', marginBottom: 10, border: '1px solid rgba(16,185,129,0.3)' }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <div style={{ color: '#10B981', fontWeight: 700, fontSize: 13 }}>Recorded! ({formatTime(recordingTime)})</div>
                      <div style={{ color: t.textMuted, fontSize: 11 }}>Ready to submit</div>
                    </div>
                    <button onClick={() => { setRecordedBlob(null); setRecordingTime(0) }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>
                  <audio controls src={URL.createObjectURL(recordedBlob)} style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />
                  <button onClick={startRecording} style={{ width: '100%', padding: '9px', borderRadius: 10, border: `1px solid ${t.border}`, background: 'transparent', color: t.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🔄 Re-record
                  </button>
                </div>
              )}
            </div>

            <button onClick={submitAnswer} disabled={loading || !!evaluations[currentQ]}
              style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: evaluations[currentQ] ? '#10B981' : loading ? t.border : `linear-gradient(135deg, ${t.primary}, #7C3AED)`,
                color: 'white', fontSize: 15, fontWeight: 700, cursor: (loading || evaluations[currentQ]) ? 'not-allowed' : 'pointer' }}>
              {evaluations[currentQ] ? '✅ Answer Submitted' : loading ? '⏳ Evaluating...' : '➡️ Submit Answer'}
            </button>

            {loading && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#BFDBFE'}` }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${t.primary}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <div style={{ color: t.primary, fontWeight: 700, fontSize: 13 }}>AI evaluating your answer...</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Webcam */}
          <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 16 }}>
            <h4 style={{ color: t.text, margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>📷 Live Emotion</h4>
            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 10, position: 'relative' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', display: 'block' }} />
              <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(16,185,129,0.9)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'white', fontWeight: 700 }}>● LIVE</div>
            </div>
            {emotionData && (
              <div style={{ background: t.bgSecondary, borderRadius: 10, padding: 12, border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>
                    {emotionData.dominant_emotion === 'happy' ? '😊' : emotionData.dominant_emotion === 'neutral' ? '😐' : emotionData.dominant_emotion === 'fear' ? '😨' : emotionData.dominant_emotion === 'sad' ? '😢' : '😮'}
                  </span>
                  <div>
                    <div style={{ color: t.primary, fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{emotionData.dominant_emotion}</div>
                    <div style={{ color: t.textMuted, fontSize: 11 }}>Score: {emotionData.confidence_score}/10</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Question Navigator */}
          <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 16 }}>
            <h4 style={{ color: t.text, margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>📋 All Questions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {questions.map((q, i) => {
                const isAnswered = evaluations[i] !== undefined
                const isCurrent = i === currentQ
                const qColor = getTypeColor(q.type)
                return (
                  <button key={i} onClick={() => goToQuestion(i)}
                    style={{ padding: '10px 12px', borderRadius: 10,
                      border: `1.5px solid ${isCurrent ? qColor : isAnswered ? '#10B981' : t.border}`,
                      background: isCurrent ? `${qColor}15` : isAnswered ? (isDark ? 'rgba(16,185,129,0.08)' : '#F0FDF4') : t.bgSecondary,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.2s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%',
                      background: isAnswered ? '#10B981' : isCurrent ? qColor : t.border,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                      {isAnswered ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: isCurrent ? qColor : isAnswered ? '#10B981' : t.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                        {q.type === 'voice_only' ? '🎙️ Voice' : q.type === 'behavioral' ? '🧠 Behavioral' : '💻 Technical'}
                      </div>
                      <div style={{ color: t.textSecondary, fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {q.question.substring(0, 32)}...
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Finish button when all answered */}
            {questions.every((_, i) => evaluations[i] !== undefined) && (
              <button onClick={() => {
                if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
                setInterviewData({ ...interviewData, answers: evaluations.filter(Boolean), emotionData, voiceData })
                navigate('report')
              }}
                style={{ width: '100%', marginTop: 12, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                🏁 Finish & See Report
              </button>
            )}
          </div>

          {/* Tips */}
          <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 16 }}>
            <h4 style={{ color: t.text, margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>💡 Tips</h4>
            {[
              isVoiceOnly ? '🎙️ Speak naturally and clearly' : isBehavioral ? '⭐ Use STAR method' : '💡 Explain step by step',
              'Eye contact with camera',
              'Moderate confident pace',
              'Use specific examples'
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <span style={{ color: t.primary, fontSize: 11 }}>→</span>
                <span style={{ color: t.textSecondary, fontSize: 11, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview