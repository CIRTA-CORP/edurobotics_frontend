import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '../../services/auth'
import { getCourses } from '../../services/courses'

function StudentDashboardPage({ userOverride = null, hideLogout = false }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(userOverride)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userOverride) return
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate, userOverride])

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await getCourses()
        setCourses(response.courses || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/login')
  }

  if (!user) return <div className="loading">Cargando...</div>

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <div className="student-brand">
          <div className="brand-mark">🤖</div>
          <div>
            <p className="brand-title">EduRobotics</p>
            <p className="brand-subtitle">Plataforma de cursos</p>
          </div>
        </div>
        <nav className="student-nav">
          <button className="nav-link">Mis cursos</button>
          <button className="nav-link">Explorar</button>
          <div className="nav-user">
            <span className="user-name">{user.first_name}</span>
            {!hideLogout && (
              <button className="btn-logout" onClick={handleLogout}>
                Cerrar sesión
              </button>
            )}
          </div>
        </nav>
      </header>

      <section className="student-hero">
        <div>
          <h1>Hola, {user.first_name}</h1>
          <p>Revisa tus cursos activos y continúa tu aprendizaje.</p>
        </div>
        <button className="btn-outline">Mostrar cursos archivados</button>
      </section>

      <main className="student-content">
        <div className="courses-header">
          <h2>Cursos activos</h2>
        </div>

        {loading && <p className="loading">Cargando cursos...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="courses-grid">
            {courses.length === 0 && <p className="empty-state">Aún no tienes cursos activos.</p>}
            {courses.map((course) => (
              <article key={course.id} className="course-card">
                <div className="course-thumb">
                  <span className="course-badge">Curso</span>
                </div>
                <div className="course-body">
                  <h3>{course.title}</h3>
                  <p className="course-meta">
                    Nivel: {course.level} · Versión {course.version}
                  </p>
                  <p className="course-description">
                    {course.description || 'Curso disponible para comenzar cuando quieras.'}
                  </p>
                </div>
                <div className="course-actions">
                  <button className="btn-primary" onClick={() => navigate(`/courses/${course.id}`)}>
                    Continuar con el curso
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default StudentDashboardPage
