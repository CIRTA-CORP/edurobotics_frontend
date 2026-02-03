import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../services/auth'

const initialState = {
  username: '',
  password: '',
}

function LoginPage() {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const result = await loginUser(form)
      localStorage.setItem('user', JSON.stringify(result.user))
      setMessageType('success')
      setMessage('¡Bienvenido! 🎉')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="logo">
        <h2>🤖 EduRobotics</h2>
        <p className="subtitle">Iniciar Sesión</p>
      </div>

      {message && <div className={messageType}>{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión 🚀'}
        </button>
      </form>

      <p className="auth-link">
        ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </div>
  )
}

export default LoginPage