import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import Interview from './pages/Interview'
import Report from './pages/Report'
import { darkTheme, lightTheme } from './theme'
import Profile from './pages/Profile'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [isDark, setIsDark] = useState(true)
  const [interviewData, setInterviewData] = useState({
    role: '', difficulty: '', questions: [],
    answers: [], emotionData: null, voiceData: null
  })

  const theme = isDark ? darkTheme : lightTheme
  const navigate = (page) => setCurrentPage(page)
  const toggleTheme = () => setIsDark(!isDark)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentPage('login')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userName = params.get('user_name')
    const userEmail = params.get('user_email')
    const userId = params.get('user_id')
    const error = params.get('error')
    window.history.replaceState({}, '', '/')

    if (error) { setCurrentPage('login'); return }

    if (token && userName) {
      const userData = { id: userId, name: userName, email: userEmail }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setCurrentPage('home')
      return
    }

    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setCurrentPage('home')
      return
    }
    setCurrentPage('login')
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: theme.bg, transition: 'all 0.3s ease' }}>
      {currentPage === 'login' && <Login navigate={navigate} setUser={setUser} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />}
      {currentPage === 'home' && <Home navigate={navigate} interviewData={interviewData} setInterviewData={setInterviewData} user={user} logout={logout} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />}
      {currentPage === 'interview' && <Interview navigate={navigate} interviewData={interviewData} setInterviewData={setInterviewData} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />}
      {currentPage === 'report' && <Report navigate={navigate} interviewData={interviewData} user={user} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />}
      {currentPage === 'profile' && (
  <Profile navigate={navigate} user={user} logout={logout} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />
)}
    </div>
  )
}

export default App