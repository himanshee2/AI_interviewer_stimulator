import { useState, useEffect } from 'react'
import axios from 'axios'

function Profile({ navigate, user, logout, theme, isDark, toggleTheme }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const t = theme

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('login')
        return
      }
      const res = await axios.get('https://aiinterviewerstimulator-production.up.railway.app/api/my-stats', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setStats(res.data)
    } catch (err) {
      console.log('Stats error:', err.response?.data)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('login')
      }
    }
    setLoading(false)
  }

  const getScoreColor = (score) => {
    if (score >= 8) return '#10B981'
    if (score >= 6) return '#3B82F6'
    if (score >= 4) return '#F59E0B'
    return '#EF4444'
  }

  const getDifficultyColor = (diff) => {
    if (diff === 'Easy') return '#10B981'
    if (diff === 'Medium') return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'all 0.3s' }}>

      {/* Navbar */}
      <nav style={{ background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSecondary, fontSize: 20 }}>←</button>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ color: t.text, fontWeight: 700 }}>My Profile</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={toggleTheme} style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 16px', color: t.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: t.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p>Loading your profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div style={{ background: t.bgCard, borderRadius: 20, border: `1px solid ${t.border}`, padding: 32, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, #2563EB, #7C3AED)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', fontWeight: 800, flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: t.text, margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>{stats?.user?.name}</h2>
                <p style={{ color: t.textMuted, margin: '0 0 8px', fontSize: 14 }}>📧 {stats?.user?.email}</p>
                <p style={{ color: t.textMuted, margin: 0, fontSize: 13 }}>📅 Joined {stats?.user?.joined}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.3)' }}>
                  🎯 Active Member
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Interviews', value: stats?.stats?.total_interviews || 0, icon: '📋', color: '#2563EB' },
                { label: 'Average Score', value: `${stats?.stats?.avg_score || 0}/10`, icon: '⭐', color: '#F59E0B' },
                { label: 'Best Score', value: `${stats?.stats?.best_score || 0}/10`, icon: '🏆', color: '#10B981' },
                { label: 'Roles Practiced', value: stats?.stats?.roles_practiced?.length || 0, icon: '💼', color: '#7C3AED' },
              ].map((item, i) => (
                <div key={i} style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ color: t.textMuted, fontSize: 12 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Roles Practiced */}
            {stats?.stats?.roles_practiced?.length > 0 && (
              <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 24, marginBottom: 24 }}>
                <h3 style={{ color: t.text, margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>💼 Roles Practiced</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {stats.stats.roles_practiced.map((role, i) => (
                    <span key={i} style={{ background: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: '#2563EB', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid rgba(59,130,246,0.2)' }}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interview History */}
            <div style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 24 }}>
              <h3 style={{ color: t.text, margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
                📊 Interview History
                <span style={{ color: t.textMuted, fontSize: 13, fontWeight: 400, marginLeft: 8 }}>({stats?.history?.length || 0} total)</span>
              </h3>

              {stats?.history?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 15, marginBottom: 8 }}>No interviews yet!</p>
                  <button onClick={() => navigate('home')}
                    style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
                    Start Your First Interview
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.history.map((interview, i) => (
                    <div key={i} style={{ background: t.bgSecondary, borderRadius: 14, padding: '16px 20px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                      
                      {/* Score Circle */}
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${getScoreColor(interview.overall_score)}20`, border: `2px solid ${getScoreColor(interview.overall_score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: getScoreColor(interview.overall_score), fontWeight: 800, fontSize: 16 }}>
                          {interview.overall_score || 0}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ color: t.text, fontWeight: 700, fontSize: 15 }}>{interview.role}</span>
                          <span style={{ background: `${getDifficultyColor(interview.difficulty)}20`, color: getDifficultyColor(interview.difficulty), fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            {interview.difficulty}
                          </span>
                        </div>
                        <div style={{ color: t.textMuted, fontSize: 12 }}>📅 {interview.date}</div>
                      </div>

                      {/* Mini Scores */}
                      <div style={{ display: 'flex', gap: 12 }}>
                        {[
                          { label: 'Tech', value: interview.technical_score, color: '#3B82F6' },
                          { label: 'Comm', value: interview.communication_score, color: '#10B981' },
                          { label: 'Voice', value: interview.voice_score, color: '#F59E0B' },
                          { label: 'Emotion', value: interview.emotion_score, color: '#8B5CF6' },
                        ].map((s, j) => (
                          <div key={j} style={{ textAlign: 'center' }}>
                            <div style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.value || 0}</div>
                            <div style={{ color: t.textMuted, fontSize: 10 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Profile