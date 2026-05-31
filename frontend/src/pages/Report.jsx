import { useState } from 'react'
import axios from 'axios'

function Report({ navigate, interviewData, user, theme, isDark, toggleTheme }) {
  const [downloading, setDownloading] = useState(false)
  const t = theme
  const answers = interviewData.answers || []
  const emotionData = interviewData.emotionData
  const voiceData = interviewData.voiceData

  const avgScore = answers.length > 0
    ? (answers.reduce((sum, a) => sum + (a.evaluation?.scores?.overall || 0), 0) / answers.length).toFixed(1)
    : 0

  const getScoreColor = (score) => {
    if (score >= 8) return '#10B981'
    if (score >= 6) return '#3B82F6'
    if (score >= 4) return '#F59E0B'
    return '#EF4444'
  }

  const getGrade = (score) => {
    if (score >= 8) return { label: 'Excellent!', emoji: '🌟' }
    if (score >= 6) return { label: 'Good Job!', emoji: '👍' }
    if (score >= 4) return { label: 'Keep Practicing!', emoji: '💪' }
    return { label: 'Need More Practice', emoji: '📚' }
  }

  const grade = getGrade(parseFloat(avgScore))

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const reportData = {
        candidate: { name: user?.name || 'Candidate', role: interviewData.role, difficulty: interviewData.difficulty },
        scores: {
          overall: parseFloat(avgScore),
          technical: answers[0]?.evaluation?.scores?.technical_accuracy || 7,
          communication: answers[0]?.evaluation?.scores?.communication || 7,
          confidence: emotionData?.confidence_score || 5,
          voice: voiceData?.confidence_score || 5
        },
        emotion: emotionData,
        voice: voiceData,
        answers,
        strengths: answers.flatMap(a => a.evaluation?.strengths || []).slice(0, 4),
        weaknesses: answers.flatMap(a => a.evaluation?.weaknesses || []).slice(0, 4)
      }
      const res = await axios.post('http://127.0.0.1:5000/api/generate-report', reportData, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'Interview_Report.pdf'
      link.click()
      // Save interview to database
const token = localStorage.getItem('token')
if (token) {
  await axios.post('http://127.0.0.1:5000/api/save-interview', {
    role: interviewData.role,
    difficulty: interviewData.difficulty,
    overall_score: avgOverall,
    technical_score: avgTechnical,
    communication_score: avgComm,
    emotion_score: parseFloat(emotionData?.confidence_score || 0),
    voice_score: parseFloat(voiceData?.confidence_score || 0)
  }, {
    headers: { Authorization: `Bearer ${token}` }
  })
}
    } catch (err) { alert('Error downloading report!') }
    setDownloading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'all 0.3s' }}>

      {/* Navbar */}
      <nav style={{ background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ color: t.text, fontWeight: 700 }}>Interview Report</span>
        </div>
        <button onClick={toggleTheme} style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero Score */}
        <div style={{ background: t.bgCard, borderRadius: 20, border: `1px solid ${t.border}`, padding: 40, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{grade.emoji}</div>
          <div style={{ fontSize: 72, fontWeight: 900, color: getScoreColor(parseFloat(avgScore)), lineHeight: 1, marginBottom: 8 }}>
            {avgScore}
          </div>
          <div style={{ color: t.textSecondary, fontSize: 16, marginBottom: 8 }}>out of 10</div>
          <div style={{ color: t.text, fontSize: 24, fontWeight: 700 }}>{grade.label}</div>
          <div style={{ color: t.textMuted, fontSize: 14, marginTop: 8 }}>
            {interviewData.role} • {interviewData.difficulty} difficulty
          </div>
        </div>

        {/* Score Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Emotion Score', value: emotionData?.confidence_score || 'N/A', icon: '😊', color: '#8B5CF6' },
            { label: 'Voice Score', value: voiceData?.confidence_score || 'N/A', icon: '🎙️', color: '#EF4444' },
            { label: 'Answer Score', value: avgScore, icon: '📝', color: t.primary },
          ].map((item, i) => (
            <div key={i} style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Score Bars */}
        <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 28, marginBottom: 24 }}>
          <h3 style={{ color: t.text, margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>📊 Performance Breakdown</h3>
          {[
            { label: 'Technical Accuracy', score: answers[0]?.evaluation?.scores?.technical_accuracy || 0, color: '#3B82F6' },
            { label: 'Communication', score: answers[0]?.evaluation?.scores?.communication || 0, color: '#10B981' },
            { label: 'Relevance', score: answers[0]?.evaluation?.scores?.relevance || 0, color: '#8B5CF6' },
            { label: 'Voice Confidence', score: voiceData?.confidence_score || 0, color: '#F59E0B' },
            { label: 'Emotion Score', score: emotionData?.confidence_score || 0, color: '#EF4444' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: t.textSecondary, fontSize: 14 }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700, fontSize: 14 }}>{item.score}/10</span>
              </div>
              <div style={{ height: 8, background: t.bgSecondary, borderRadius: 4, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                <div style={{ height: '100%', width: `${(item.score / 10) * 100}%`, background: item.color, borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Q&A Review */}
        <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 28, marginBottom: 24 }}>
          <h3 style={{ color: t.text, margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>📝 Answer Review</h3>
          {answers.map((ans, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${t.primary}`, paddingLeft: 16, marginBottom: 20 }}>
              <p style={{ fontWeight: 700, color: t.text, margin: '0 0 6px', fontSize: 14 }}>Q{i + 1}: {ans.question}</p>
              <p style={{ color: t.textSecondary, margin: '0 0 10px', fontSize: 13, lineHeight: 1.6 }}>{ans.answer}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: t.primary, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  Score: {ans.evaluation?.scores?.overall}/10
                </span>
                <span style={{ background: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4', color: '#10B981', padding: '3px 12px', borderRadius: 20, fontSize: 12 }}>
                  💡 {ans.evaluation?.improvement_tip}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: isDark ? 'rgba(16,185,129,0.08)' : '#F0FDF4', borderRadius: 16, border: '1px solid rgba(16,185,129,0.2)', padding: 24 }}>
            <h4 style={{ color: '#10B981', margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>✅ Strengths</h4>
            {answers.flatMap(a => a.evaluation?.strengths || []).slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#10B981' }}>•</span>
                <span style={{ color: t.textSecondary, fontSize: 13 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ background: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)', padding: 24 }}>
            <h4 style={{ color: '#EF4444', margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>⚠️ Improve</h4>
            {answers.flatMap(a => a.evaluation?.weaknesses || []).slice(0, 4).map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#EF4444' }}>•</span>
                <span style={{ color: t.textSecondary, fontSize: 13 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button onClick={() => navigate('home')}
            style={{ padding: '16px', borderRadius: 14, border: `2px solid ${t.primary}`, background: 'transparent', color: t.primary, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            🔄 Try Again
          </button>
          <button onClick={downloadReport} disabled={downloading}
            style={{ padding: '16px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${t.primary}, #7C3AED)`, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {downloading ? '⏳ Downloading...' : '📄 Download PDF Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Report