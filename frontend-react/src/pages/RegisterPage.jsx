import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/auth'

const initialState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
}

function RegisterPage() {
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

    if (form.password !== form.password_confirm) {
      setMessageType('error')
      setMessage('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await registerUser(form)
      setMessageType('success')
      setMessage('¡Cuenta creada exitosamente! 🎉')
      setTimeout(() => navigate('/login'), 1200)
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
        <p className="subtitle">Plataforma Educativa - CIRTA CORP</p>
      </div>

      {message && <div className={messageType}>{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nombre de Usuario:</label>
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
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="first_name">Nombre:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Apellido:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={form.last_name}
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

        <div className="form-group">
          <label htmlFor="password_confirm">Confirmar Contraseña:</label>
          <input
            type="password"
            id="password_confirm"
            name="password_confirm"
            value={form.password_confirm}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear Cuenta ✨'}
        </button>
      </form>

      <p className="auth-link">
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  )
}

export default RegisterPage