import { useState } from 'react'
import axios from 'axios'

function Login({ navigate, setUser, theme, isDark, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill all fields!'); return }
    if (!isLogin && !name) { setError('Please enter your name!'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters!'); return }
    setLoading(true); setError('')
    try {
      const url = isLogin ? 'http://127.0.0.1:5000/api/login' : 'http://127.0.0.1:5000/api/register'
      const body = isLogin ? { email, password } : { name, email, password }
      const res = await axios.post(url, body)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      navigate('home')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong!')
    }
    setLoading(false)
  }

  const t = theme
  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: `1.5px solid ${t.border}`, fontSize: 14,
    outline: 'none', background: t.inputBg, color: t.text,
    boxSizing: 'border-box', transition: 'border 0.2s'
  }

  const features = [
    { icon: '🤖', title: 'AI Questions', desc: 'Resume-based dynamic questions' },
    { icon: '😊', title: 'Emotion Detection', desc: 'Live facial analysis' },
    { icon: '🎙️', title: 'Voice Analysis', desc: 'Confidence & fluency scoring' },
    { icon: '📊', title: 'Smart Reports', desc: 'Detailed PDF performance report' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: t.bg, transition: 'all 0.3s' }}>

      {/* Left Panel */}
      <div style={{ flex: 1, background: isDark ? '#0B1120' : '#1E40AF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 50px', position: 'relative' }}>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: 18 }}>
          {isDark ? '☀️' : '🌙'}
        </button>

        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>
            AI Interview<br />Simulator
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', margin: '0 0 40px', lineHeight: 1.7 }}>
            Practice smarter. Get hired faster. Real-time AI feedback on every answer.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: 500, background: t.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 50, borderLeft: `1px solid ${t.border}` }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: t.text, margin: '0 0 6px' }}>
            {isLogin ? 'Welcome back 👋' : 'Get started 🚀'}
          </h2>
          <p style={{ color: t.textMuted, fontSize: 14, margin: '0 0 28px' }}>
            {isLogin ? 'Sign in to continue your practice' : 'Create your free account today'}
          </p>

          {/* Toggle Tabs */}
          <div style={{ display: 'flex', background: t.bgSecondary, borderRadius: 12, padding: 4, marginBottom: 24, border: `1px solid ${t.border}` }}>
            {['Login', 'Sign Up'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError('') }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                  background: (isLogin && i === 0) || (!isLogin && i === 1) ? t.primary : 'transparent',
                  color: (isLogin && i === 0) || (!isLogin && i === 1) ? 'white' : t.textMuted,
                  fontWeight: 600, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s'
                }}>
                {tab}
              </button>
            ))}
          </div>

          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ ...inputStyle, paddingRight: 48 }} />
              <button onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: t.textMuted }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Password Strength */}
          {!isLogin && password.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: password.length >= i * 2 ? (password.length < 4 ? '#EF4444' : password.length < 8 ? '#F59E0B' : '#10B981') : t.border }} />
                ))}
              </div>
              <p style={{ fontSize: 12, color: t.textMuted, margin: '4px 0 0' }}>
                {password.length < 4 ? '⚠️ Weak' : password.length < 8 ? '🟡 Medium' : '✅ Strong'} password
              </p>
            </div>
          )}

          {error && (
            <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, border: '1px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: loading ? t.border : t.primary, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16, transition: 'all 0.2s' }}>
            {loading ? '⏳ Please wait...' : isLogin ? '🚀 Sign In' : '✅ Create Account'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: t.border }} />
            <span style={{ fontSize: 13, color: t.textMuted }}>or</span>
            <div style={{ flex: 1, height: 1, background: t.border }} />
          </div>

          <button onClick={() => window.location.href = 'http://127.0.0.1:5000/api/auth/google'}
            style={{ width: '100%', padding: 13, borderRadius: 12, border: `1.5px solid ${t.border}`, background: t.bgCard, color: t.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
            <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="G" />
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, marginTop: 20 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{ color: t.primary, fontWeight: 600, cursor: 'pointer' }}>
              {isLogin ? 'Sign up free' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login