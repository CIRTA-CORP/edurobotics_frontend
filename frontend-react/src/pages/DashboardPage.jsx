import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '../services/auth'

function DashboardPage() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <div>
            <h2>🤖 EduRobotics</h2>
            <p>Panel de Control</p>
          </div>
          <div>
            <span>{user ? `${user.first_name} ${user.last_name}` : 'Cargando...'}</span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '15px',
                padding: '8px 15px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h3>Bienvenido a EduRobotics</h3>
          <p>Tu plataforma educativa para aprender robótica</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h4>📚 Cursos</h4>
            <p>Explora nuestros cursos de robótica educativa</p>
            <button
              className="btn-primary"
              style={{ marginTop: '15px', width: 'auto', padding: '10px 20px' }}
            >
              Ver Cursos
            </button>
          </div>

          <div className="feature-card">
            <h4>🛠️ Proyectos</h4>
            <p>Trabaja en proyectos prácticos de robótica</p>
            <button
              className="btn-primary"
              style={{ marginTop: '15px', width: 'auto', padding: '10px 20px' }}
            >
              Mis Proyectos
            </button>
          </div>

          <div className="feature-card">
            <h4>🤝 Comunidad</h4>
            <p>Conecta con otros estudiantes y profesores</p>
            <button
              className="btn-primary"
              style={{ marginTop: '15px', width: 'auto', padding: '10px 20px' }}
            >
              Unirse
            </button>
          </div>

          <div className="feature-card">
            <h4>📈 Progreso</h4>
            <p>Revisa tu progreso y logros obtenidos</p>
            <button
              className="btn-primary"
              style={{ marginTop: '15px', width: 'auto', padding: '10px 20px' }}
            >
              Ver Estadísticas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage