import { useState } from 'react'
import axios from 'axios'

function Home({ navigate, interviewData, setInterviewData, user, logout, theme, isDark, toggleTheme }) {
  const [role, setRole] = useState('Software Engineer')
  const [difficulty, setDifficulty] = useState('Medium')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const t = theme

  const roles = [
    { name: 'Software Engineer', icon: '💻' },
    { name: 'Data Analyst', icon: '📊' },
    { name: 'AI Engineer', icon: '🤖' },
    { name: 'Frontend Developer', icon: '🎨' },
    { name: 'Backend Developer', icon: '⚙️' },
    { name: 'Full Stack Developer', icon: '🔥' },
  ]

  const difficulties = [
    { name: 'Easy', color: '#10B981', desc: 'Beginner friendly' },
    { name: 'Medium', color: '#F59E0B', desc: 'Intermediate' },
    { name: 'Hard', color: '#EF4444', desc: 'Advanced' },
  ]

  const handleStart = async () => {
    if (!file) { setError('Please upload your resume!'); return }
    setLoading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('role', role)
      formData.append('difficulty', difficulty)
      const res = await axios.post('http://127.0.0.1:5000/api/upload-resume', formData)
      setInterviewData({ ...interviewData, role, difficulty, questions: res.data.questions, answers: [], emotionData: null, voiceData: null })
      navigate('interview')
    } catch (err) {
      setError('Error uploading resume. Make sure Flask is running!')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'all 0.3s' }}>

      {/* Navbar */}
      <nav style={{ background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <span style={{ color: t.text, fontWeight: 700, fontSize: 18 }}>AI Interview Simulator</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={toggleTheme} style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: t.textSecondary, fontSize: 14 }}>{user?.name}</span>
          </div> */}
          <button
            onClick={() => navigate('profile')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 10,
              background: t.bgSecondary, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '6px 14px 6px 6px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 16
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: t.textSecondary, fontSize: 14, fontWeight: 600 }}>{user?.name}</span>
          </button>
          <button onClick={logout} style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 16px', color: t.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: t.primary, fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 20, marginBottom: 16, border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#BFDBFE'}` }}>
            ✨ AI-Powered Interview Practice
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: t.text, margin: '0 0 12px', lineHeight: 1.2 }}>
            Ready to ace your<br />
            <span style={{ color: t.primary }}>next interview?</span>
          </h1>
          <p style={{ color: t.textSecondary, fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Upload your resume, select a role, and get personalized AI interview questions with real-time feedback.
          </p>
        </div>

        {/* Main Card */}
        <div style={{ background: t.bgCard, borderRadius: 20, border: `1px solid ${t.border}`, padding: 36, marginBottom: 24 }}>

          {/* Role Selection */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: t.text, fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              💼 Select Role
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {roles.map(r => (
                <button key={r.name} onClick={() => setRole(r.name)}
                  style={{
                    padding: '14px 12px', borderRadius: 12, border: `2px solid ${role === r.name ? t.primary : t.border}`,
                    background: role === r.name ? (isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF') : t.bgSecondary,
                    color: role === r.name ? t.primary : t.textSecondary,
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                  <span>{r.icon}</span> {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: t.text, fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>
              ⚡ Difficulty Level
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {difficulties.map(d => (
                <button key={d.name} onClick={() => setDifficulty(d.name)}
                  style={{
                    flex: 1, padding: '16px', borderRadius: 12,
                    border: `2px solid ${difficulty === d.name ? d.color : t.border}`,
                    background: difficulty === d.name ? `${d.color}15` : t.bgSecondary,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>
                    {d.name === 'Easy' ? '🟢' : d.name === 'Medium' ? '🟡' : '🔴'}
                  </div>
                  <div style={{ color: difficulty === d.name ? d.color : t.text, fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                  <div style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resume Upload */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: t.text, fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>
              📄 Upload Resume
            </h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('resumeInput').click()}
              style={{
                border: `2px dashed ${dragOver ? t.primary : file ? '#10B981' : t.border}`,
                borderRadius: 14, padding: '32px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? (isDark ? 'rgba(59,130,246,0.08)' : '#EFF6FF') : file ? (isDark ? 'rgba(16,185,129,0.08)' : '#F0FDF4') : t.bgSecondary,
                transition: 'all 0.2s'
              }}>
              <input id="resumeInput" type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
              {file ? (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <div style={{ color: '#10B981', fontWeight: 700, fontSize: 15 }}>{file.name}</div>
                  <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>Click to change file</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
                  <div style={{ color: t.text, fontWeight: 600, fontSize: 15 }}>Drop your resume here</div>
                  <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>or click to browse — PDF only</div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, border: '1px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleStart} disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: loading ? t.border : `linear-gradient(135deg, ${t.primary}, #7C3AED)`,
              color: 'white', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}>
            {loading ? '⏳ Generating your questions...' : '🚀 Start Interview'}
          </button>
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: '🤖', title: 'AI Questions', desc: 'Resume-based' },
            { icon: '😊', title: 'Emotion AI', desc: 'Live detection' },
            { icon: '🎙️', title: 'Voice Score', desc: 'Fluency check' },
            { icon: '📊', title: 'PDF Report', desc: 'Download report' },
          ].map((item, i) => (
            <div key={i} style={{ background: t.bgCard, borderRadius: 14, border: `1px solid ${t.border}`, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ color: t.text, fontWeight: 700, fontSize: 13 }}>{item.title}</div>
              <div style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home