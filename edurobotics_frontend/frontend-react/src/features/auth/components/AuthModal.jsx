import { useEffect, useState } from 'react'
import { Modal } from '@/shared/components/Modal'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

/**
 * AuthModal — modal de autenticación para la landing.
 *
 * Reutiliza exactamente los mismos LoginForm / RegisterForm que las páginas
 * /login y /register, así que no hay lógica de auth duplicada. Las dos vistas
 * son un segmentado, no un enlace escondido al pie: entrar y registrarse pesan
 * lo mismo, y se alterna sin salir de la landing.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {'login'|'register'} [initialView='login'] - Vista con la que se abre.
 */
export function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView)

  // Sincronizar la vista cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) setView(initialView)
  }, [isOpen, initialView])

  const isLogin = view === 'login'

  const tab = (id, label) => (
    <button
      type="button"
      onClick={() => setView(id)}
      aria-pressed={view === id}
      className={`h-9 flex-1 rounded-lg text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
        view === id ? 'bg-white text-[#16151b] shadow-sm' : 'text-[#8b8a95] hover:text-[#16151b]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="-mt-2 mb-5 text-center">
        <img src="/cirtanitido.svg" alt="CIRTA" className="mx-auto h-7" />
        <h2 className="mt-4 text-[22px] font-bold tracking-[-0.012em] text-[#16151b]">
          {isLogin ? 'Entra a la plataforma' : 'Crea tu cuenta'}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-[#55545f]">
          {isLogin ? 'Sigue tus cursos y abre el simulador.' : 'Gratis, sin tarjeta.'}
        </p>
      </div>

      <div className="mb-5 flex items-center gap-[3px] rounded-[10px] bg-[#f4f3f8] p-[3px]">
        {tab('login', 'Iniciar sesión')}
        {tab('register', 'Crear cuenta')}
      </div>

      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setView('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setView('login')} />
      )}
    </Modal>
  )
}
